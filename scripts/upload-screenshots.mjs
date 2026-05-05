#!/usr/bin/env node
/**
 * Upload every PNG in .storyblok-screenshots/ to your Storyblok space and
 * attach it as the matching component's preview thumbnail.
 *
 * Each filename is treated as the component name — e.g. `slide_bullets.png`
 * maps to the `slide_bullets` component. Pair with `screenshot-slides.mjs`,
 * which writes files using exactly that convention.
 *
 * Storyblok asset upload is a 3-step dance:
 *   1. POST /spaces/{id}/assets         → returns signed S3 form fields
 *   2. POST <s3 url> (multipart)        → uploads the bytes
 *   3. GET  /spaces/{id}/assets/{id}/finish_upload
 *
 * Then we PUT the component back with `image: <public_url>` so it shows up as
 * the preview thumbnail in the Storyblok component picker.
 *
 * Requires:
 *   STORYBLOK_SPACE_ID
 *   STORYBLOK_MANAGEMENT_TOKEN  (Personal access token, space-write scope)
 */

import { readdir, readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SCREENSHOTS = resolve(ROOT, ".storyblok-screenshots");
const API = "https://mapi.storyblok.com/v1";

// Auto-load .env at the repo root, mirroring push-storyblok-schema.mjs so the
// two scripts can share a config file. Explicit shell env wins.
const envPath = resolve(ROOT, ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const [, k, rawV] = m;
    if (process.env[k]) continue;
    process.env[k] = rawV.replace(/^['"]|['"]$/g, "");
  }
}

function requiredEnv(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
  return v;
}

const SPACE_ID = requiredEnv("STORYBLOK_SPACE_ID");
const TOKEN = requiredEnv("STORYBLOK_MANAGEMENT_TOKEN");

const sbHeaders = { Authorization: TOKEN, "Content-Type": "application/json" };

async function sb(method, path, body) {
  const res = await fetch(`${API}/spaces/${SPACE_ID}${path}`, {
    method,
    headers: sbHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

// One-shot fetch of every component so we don't pay the GET round-trip per file.
async function loadComponents() {
  const { components } = await sb("GET", "/components?per_page=1000");
  const byName = new Map();
  for (const c of components) byName.set(c.name, c);
  return byName;
}

async function uploadAsset(filePath) {
  const filename = basename(filePath);
  const fileBuffer = await readFile(filePath);

  // Step 1: ask Storyblok for a signed S3 upload URL + form fields.
  const signed = await sb("POST", "/assets", {
    filename,
    size: "1600x900",
    asset_folder_id: null,
  });

  // Step 2: POST the file via multipart/form-data to the signed URL.
  const form = new FormData();
  for (const [k, v] of Object.entries(signed.fields ?? {})) {
    form.append(k, v);
  }
  form.append(
    "file",
    new Blob([fileBuffer], { type: "image/png" }),
    filename,
  );

  const uploadRes = await fetch(signed.post_url, {
    method: "POST",
    body: form,
  });
  // S3 returns 204 on success; some compatible backends return 200.
  if (!uploadRes.ok && uploadRes.status !== 204) {
    throw new Error(
      `S3 upload failed (${uploadRes.status}): ${await uploadRes.text()}`,
    );
  }

  // Step 3: tell Storyblok the upload is done so the asset record activates.
  await sb("GET", `/assets/${signed.id}/finish_upload`);

  // Storyblok's pretty_url comes back protocol-relative ("//a.storyblok.com/…").
  const publicUrl =
    signed.public_url ||
    (signed.pretty_url?.startsWith("//")
      ? `https:${signed.pretty_url}`
      : signed.pretty_url);
  return publicUrl;
}

async function attachThumbnail(component, imageUrl) {
  // Storyblok's PUT expects the full component object under a `component` key.
  // Strip read-only fields it returns; everything else round-trips fine.
  const next = { ...component, image: imageUrl };
  delete next.created_at;
  delete next.updated_at;
  delete next.real_name;
  await sb("PUT", `/components/${component.id}`, { component: next });
}

async function main() {
  if (!existsSync(SCREENSHOTS)) {
    console.error(
      `Missing ${SCREENSHOTS}. Run \`npm run storyblok:screenshots\` first.`,
    );
    process.exit(1);
  }

  const files = (await readdir(SCREENSHOTS))
    .filter((f) => f.toLowerCase().endsWith(".png"))
    .sort();

  if (!files.length) {
    console.error(`No PNGs in ${SCREENSHOTS}.`);
    process.exit(1);
  }

  console.log(
    `Uploading ${files.length} screenshot${files.length === 1 ? "" : "s"} to space ${SPACE_ID}…\n`,
  );

  const components = await loadComponents();
  let okCount = 0;
  let failCount = 0;

  for (const file of files) {
    const componentName = file.replace(/\.png$/i, "");
    const filePath = resolve(SCREENSHOTS, file);
    const component = components.get(componentName);

    if (!component) {
      console.log(`  - ${componentName}: no matching component, skipping`);
      continue;
    }

    try {
      const url = await uploadAsset(filePath);
      await attachThumbnail(component, url);
      console.log(`  ✓ ${componentName} → ${url}`);
      okCount++;
    } catch (err) {
      console.error(`  ✗ ${componentName}: ${err.message}`);
      failCount++;
    }
  }

  console.log(`\n${okCount} attached, ${failCount} failed.`);
  if (failCount) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
