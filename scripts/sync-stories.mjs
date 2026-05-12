#!/usr/bin/env node
/**
 * Bootstrap the foundational Storyblok stories used by the app:
 *
 *   /home          — landing page (content type: page)
 *   /slide-shows   — folder, default content type: slideshow
 *   /admin         — admin landing page (content type: page)
 *
 * Existing stories at those slugs are left alone — this script only fills in
 * what's missing, so it's safe to re-run on a populated space.
 *
 * Requires:
 *   STORYBLOK_SPACE_ID
 *   STORYBLOK_MANAGEMENT_TOKEN  (Personal access token, space-write scope)
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import process from "node:process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const API = "https://mapi.storyblok.com/v1";

// Auto-load .env at the repo root, mirroring the other storyblok scripts.
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

const headers = { Authorization: TOKEN, "Content-Type": "application/json" };

async function sb(method, path, body) {
  const res = await fetch(`${API}/spaces/${SPACE_ID}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

// Storyblok's `with_slug` query returns the matching story (or empty list).
async function findBySlug(slug) {
  const { stories } = await sb("GET", `/stories?with_slug=${encodeURIComponent(slug)}`);
  return stories?.[0] ?? null;
}

// Stories the script knows how to create. Order matters — folders need to
// exist before stories that live inside them.
const DESIRED = [
  {
    label: "Home",
    slug: "home",
    create: () => ({
      story: {
        name: "Home",
        slug: "home",
        is_folder: false,
        parent_id: 0,
        content: { _uid: randomUUID(), component: "page", sections: [] },
      },
    }),
  },
  {
    label: "Admin",
    slug: "admin",
    create: () => ({
      story: {
        name: "Admin",
        slug: "admin",
        is_folder: false,
        parent_id: 0,
        content: {
          _uid: randomUUID(),
          component: "page",
          title: "Admin — Access Requests",
          sections: [],
        },
      },
    }),
  },
  {
    label: "Slide Shows folder",
    slug: "slide-shows",
    create: () => ({
      story: {
        name: "Slide Shows",
        slug: "slide-shows",
        is_folder: true,
        parent_id: 0,
        default_root: "slideshow",
      },
    }),
    // For the folder we additionally enforce default_root if it's missing.
    afterFound: async (existing) => {
      if (existing.is_folder && existing.default_root !== "slideshow") {
        console.log(`  ↻ updating folder default_root → "slideshow"`);
        await sb("PUT", `/stories/${existing.id}`, {
          story: { ...existing, default_root: "slideshow" },
        });
      }
    },
  },
];

async function main() {
  console.log(`Syncing foundational stories in space ${SPACE_ID}…\n`);

  for (const item of DESIRED) {
    const existing = await findBySlug(item.slug);
    if (existing) {
      console.log(`  ✓ ${item.label} already exists (id=${existing.id})`);
      if (item.afterFound) await item.afterFound(existing);
      continue;
    }
    const body = item.create();
    const { story } = await sb("POST", "/stories", body);
    console.log(`  ＋ created ${item.label} (id=${story.id}, slug="${story.full_slug}")`);
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
