#!/usr/bin/env node
/**
 * Sync Storyblok datasources used by the schema. The slideshow.theme field
 * pulls its options from the `themes` datasource, so this script keeps that
 * datasource in sync with the `theme_options` array at the top of
 * storyblok-schema.json.
 *
 * Idempotent:
 *   - Creates the datasource if it doesn't exist.
 *   - Adds new entries.
 *   - Updates entries whose label has changed (matched by `value`).
 *   - Leaves extra Storyblok-side entries alone (so authors can add custom
 *     themes without us wiping them).
 *
 * Requires:
 *   STORYBLOK_SPACE_ID
 *   STORYBLOK_MANAGEMENT_TOKEN  (Personal access token, space-write scope)
 */

import { readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SCHEMA_PATH = resolve(ROOT, "storyblok-schema.json");
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

async function findDatasource(slug) {
  const { datasources } = await sb("GET", "/datasources?per_page=1000");
  return datasources.find((d) => d.slug === slug) ?? null;
}

async function listEntries(datasourceId) {
  const { datasource_entries } = await sb(
    "GET",
    `/datasource_entries?datasource_id=${datasourceId}&per_page=1000`,
  );
  return datasource_entries;
}

async function syncDatasource({ name, slug, entries }) {
  console.log(`\nDatasource "${slug}" (${entries.length} entries)`);

  let datasource = await findDatasource(slug);
  if (!datasource) {
    console.log(`  ＋ creating datasource "${slug}"`);
    const created = await sb("POST", "/datasources", {
      datasource: { name, slug },
    });
    datasource = created.datasource;
  } else if (datasource.name !== name) {
    await sb("PUT", `/datasources/${datasource.id}`, {
      datasource: { name, slug },
    });
  }

  // Index existing entries by value so we can decide upsert vs. update.
  const existing = await listEntries(datasource.id);
  const byValue = new Map(existing.map((e) => [e.value, e]));

  let created = 0;
  let updated = 0;
  for (const entry of entries) {
    const found = byValue.get(entry.value);
    if (!found) {
      await sb("POST", "/datasource_entries", {
        datasource_entry: {
          name: entry.name,
          value: entry.value,
          datasource_id: datasource.id,
        },
      });
      console.log(`  ＋ ${entry.value} — ${entry.name}`);
      created++;
    } else if (found.name !== entry.name) {
      await sb("PUT", `/datasource_entries/${found.id}`, {
        datasource_entry: {
          name: entry.name,
          value: entry.value,
          datasource_id: datasource.id,
        },
      });
      console.log(`  ↻ ${entry.value} — ${entry.name}`);
      updated++;
    }
  }
  console.log(
    `  done — ${created} created, ${updated} renamed, ${entries.length - created - updated} unchanged`,
  );
  if (existing.length > entries.length) {
    console.log(
      `  note: ${existing.length - entries.length} extra entry(s) in Storyblok left untouched`,
    );
  }
}

async function main() {
  const schema = JSON.parse(await readFile(SCHEMA_PATH, "utf8"));

  // Map schema → datasource definitions. Each item drives one Storyblok
  // datasource. Add more here when the schema gains new dropdowns sourced
  // from datasources.
  const datasources = [
    {
      name: "Themes",
      slug: "themes",
      entries: schema.theme_options.map((t) => ({
        name: t.name,
        value: t.value,
      })),
    },
  ];

  console.log(`Syncing ${datasources.length} datasource(s) to space ${SPACE_ID}…`);
  for (const ds of datasources) {
    await syncDatasource(ds);
  }
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
