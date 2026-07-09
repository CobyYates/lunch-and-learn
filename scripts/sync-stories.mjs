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

// Collect the UUIDs of every published/draft slideshow story in the folder so
// the homepage's Slideshow Grid can reference them out of the box. Authors can
// re-order or trim the list afterwards in the Storyblok editor.
async function slideshowUuids() {
  try {
    const { stories } = await sb(
      "GET",
      "/stories?starts_with=slide-shows/&is_folder=false&per_page=100",
    );
    return (stories ?? []).map((s) => s.uuid).filter(Boolean);
  } catch {
    return [];
  }
}

// The prefilled homepage. Mirrors the Storyblok section components 1:1 so the
// site renders the intended design without any manual authoring. Re-running
// the script refreshes this content (see `update` handling in main()).
function buildHomeContent(slideshows) {
  return {
    _uid: randomUUID(),
    component: "page",
    title: "Build and share slide decks without touching code",
    sections: [
      {
        _uid: randomUUID(),
        component: "section_hero",
        eyebrow: "CLOUDFLARE · STORYBLOK · NUXT",
        title: "Build and share slide decks without touching code",
        subtitle:
          "Create presentations visually in Storyblok, publish in one click, and serve them instantly from Cloudflare's edge.",
      },
      {
        _uid: randomUUID(),
        component: "section_feature_grid",
        columns: "3",
        items: [
          {
            _uid: randomUUID(),
            component: "feature_card",
            icon: "mdi-pencil",
            title: "Edit it yourself",
            description:
              "Update any slide in Storyblok and republish in under a minute.",
          },
          {
            _uid: randomUUID(),
            component: "feature_card",
            icon: "mdi-view-grid",
            title: "30+ slide layouts",
            description:
              "Charts, code demos, timelines — pick a type and fill in the fields.",
          },
          {
            _uid: randomUUID(),
            component: "feature_card",
            icon: "mdi-lightning-bolt",
            title: "Always fast",
            description: "Cached at the edge via KV — loads instantly everywhere.",
          },
        ],
      },
      {
        _uid: randomUUID(),
        component: "section_slideshow_grid",
        title: "Slideshows",
        subtitle: "Select a deck to preview or present",
        slideshows,
      },
      {
        _uid: randomUUID(),
        component: "section_github",
        title: "View the source code",
        description:
          "Built with Nuxt 4, Storyblok, Vuetify and Cloudflare Pages — open source and free to fork.",
        repo_label: "CobyYates / lunch-and-learn",
        url: "https://github.com/CobyYates/lunch-and-learn",
      },
    ],
  };
}

// Stories the script knows how to create. Order matters — folders need to
// exist before stories that live inside them.
const DESIRED = [
  {
    label: "Home",
    slug: "home",
    // Home is (re)seeded with the full marketing layout every run so the
    // published design stays in sync with the section components in the repo.
    update: true,
    create: (ctx) => ({
      story: {
        name: "Home",
        slug: "home",
        is_folder: false,
        parent_id: 0,
        content: buildHomeContent(ctx.slideshows),
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

  const ctx = { slideshows: await slideshowUuids() };

  for (const item of DESIRED) {
    const existing = await findBySlug(item.slug);
    if (existing) {
      if (item.update) {
        // Refresh the content with the repo's canonical version, keeping the
        // story's identity (name/slug/parent) intact.
        const { story: content } = item.create(ctx);
        console.log(`  ↻ updating ${item.label} content (id=${existing.id})`);
        await sb("PUT", `/stories/${existing.id}`, {
          story: { ...existing, content: content.content },
          // Publish so the change is live immediately — the site serves the
          // published version via /api/story.
          publish: 1,
        });
      } else {
        console.log(`  ✓ ${item.label} already exists (id=${existing.id})`);
      }
      if (item.afterFound) await item.afterFound(existing);
      continue;
    }
    const body = item.create(ctx);
    const { story } = await sb("POST", "/stories", body);
    console.log(`  ＋ created ${item.label} (id=${story.id}, slug="${story.full_slug}")`);
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
