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
const REPO_ROOT = resolve(__dirname, "..");
// Pushed in order. The base schema carries `theme_options`; additional files
// (e.g. homepage sections) reuse those theme options and may declare their own
// `component_groups` by name — see ensureComponentGroups below.
const SCHEMA_PATHS = [
  resolve(REPO_ROOT, "storyblok-schema.json"),
  resolve(REPO_ROOT, "storyblok-homepage-schema.json"),
];
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

async function ensureComponentGroups(names) {
  // Resolve a set of group names to their uuids, creating any that don't yet
  // exist in the space. Returns a Map of name → uuid. Idempotent.
  const map = new Map();
  if (names.size === 0) return map;
  const { component_groups: groups } = await sb("GET", "/component_groups");
  for (const g of groups ?? []) map.set(g.name, g.uuid);
  for (const name of names) {
    if (map.has(name)) continue;
    console.log(`  ＋ creating group ${name}`);
    const { component_group } = await sb("POST", "/component_groups", {
      component_group: { name },
    });
    map.set(component_group.name, component_group.uuid);
  }
  return map;
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
  // Merge every schema file: components are concatenated; theme_options come
  // from whichever file defines them (the base schema).
  const components = [];
  const groupNames = new Set();
  let themeOptions = [];
  for (const path of SCHEMA_PATHS) {
    if (!existsSync(path)) continue;
    const schema = JSON.parse(await readFile(path, "utf8"));
    if (Array.isArray(schema.theme_options)) themeOptions = schema.theme_options;
    for (const name of schema.component_groups ?? []) groupNames.add(name);
    for (const c of schema.components ?? []) {
      if (c.component_group) groupNames.add(c.component_group);
      components.push(c);
    }
  }
  hydrateThemeOptions({ components }, themeOptions);

  // Create any named component groups up front, then resolve each component's
  // `component_group` (a portable name) to the space-specific uuid Storyblok
  // expects. Components that already use `component_group_uuid` are untouched.
  const groupMap = await ensureComponentGroups(groupNames);
  for (const c of components) {
    if (c.component_group && !c.component_group_uuid) {
      const uuid = groupMap.get(c.component_group);
      if (uuid) c.component_group_uuid = uuid;
      delete c.component_group;
    }
  }

  const schema = { components };

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
