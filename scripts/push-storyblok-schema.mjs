#!/usr/bin/env node
/**
 * Push the slide-design-system Storyblok component schemas to your space.
 *
 * Requires:
 *   STORYBLOK_SPACE_ID         — numeric space id (Storyblok → Settings → General)
 *   STORYBLOK_MANAGEMENT_TOKEN — personal access token with space-write scope
 *                                (Storyblok → My Account → Personal access tokens)
 *
 * Behavior:
 *   - Reads storyblok-schema.json from the repo root.
 *   - Substitutes the shared theme_options list into any field whose
 *     `options` equals "__THEME_OPTIONS__".
 *   - For each component, fetches the existing definition by name; PUTs to
 *     update if it exists, POSTs to create if it doesn't.
 *   - Idempotent: re-running only changes fields that differ.
 *
 * Usage:
 *   STORYBLOK_SPACE_ID=12345 \
 *   STORYBLOK_MANAGEMENT_TOKEN=xxxx \
 *   node scripts/push-storyblok-schema.mjs
 */

import { readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import process from "node:process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = resolve(__dirname, "..", "storyblok-schema.json");
const API = "https://mapi.storyblok.com/v1";

// Auto-load .env from the repo root so `npm run storyblok:push` works without
// needing a separate env-file loader. Only sets vars that aren't already set
// (explicit shell env wins).
const envPath = resolve(__dirname, "..", ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const [, k, rawV] = m;
    if (process.env[k]) continue;
    const v = rawV.replace(/^['"]|['"]$/g, "");
    process.env[k] = v;
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

const headers = {
  Authorization: TOKEN,
  "Content-Type": "application/json",
};

async function sb(method, path, body) {
  const res = await fetch(`${API}/spaces/${SPACE_ID}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

function hydrateThemeOptions(schema, themeOptions) {
  // Replace the "__THEME_OPTIONS__" placeholder in any field's `options` key
  // with the real theme_options array from the schema file.
  for (const component of schema.components) {
    for (const [fieldName, field] of Object.entries(component.schema ?? {})) {
      if (field?.options === "__THEME_OPTIONS__") {
        field.options = themeOptions;
      }
      void fieldName;
    }
  }
}

async function findComponentByName(name) {
  // Storyblok's GET /components endpoint returns up to 1000 per request; for
  // the scale of this schema (~45 components) that's plenty.
  const { components } = await sb("GET", "/components?per_page=1000");
  return components.find((c) => c.name === name) ?? null;
}

async function upsertComponent(definition) {
  const existing = await findComponentByName(definition.name);
  if (existing) {
    console.log(`  ↻ updating  ${definition.name}`);
    await sb("PUT", `/components/${existing.id}`, { component: definition });
  } else {
    console.log(`  ＋ creating ${definition.name}`);
    await sb("POST", "/components", { component: definition });
  }
}

async function main() {
  const raw = await readFile(SCHEMA_PATH, "utf8");
  const schema = JSON.parse(raw);
  hydrateThemeOptions(schema, schema.theme_options);

  console.log(
    `Pushing ${schema.components.length} components to space ${SPACE_ID}…\n`,
  );

  // Push nested-used components first so that parent components referencing
  // them via component_whitelist resolve cleanly on the first pass. Order
  // isn't strictly required (Storyblok resolves whitelists by name at render
  // time, not at creation), but this produces cleaner logs.
  const sorted = [...schema.components].sort((a, b) => {
    const aParent = (a.schema && Object.values(a.schema).some(
      (f) => f?.type === "bloks",
    ))
      ? 1
      : 0;
    const bParent = (b.schema && Object.values(b.schema).some(
      (f) => f?.type === "bloks",
    ))
      ? 1
      : 0;
    return aParent - bParent;
  });

  for (const component of sorted) {
    try {
      await upsertComponent(component);
    } catch (err) {
      console.error(`✗ ${component.name}: ${err.message}`);
      process.exitCode = 1;
    }
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
