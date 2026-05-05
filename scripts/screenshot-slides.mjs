#!/usr/bin/env node
/**
 * Render every slide in slide-design-system.html as a 1600×900 PNG, themed
 * "paper", with one file per matching Storyblok component. The PNGs are then
 * picked up by `scripts/upload-screenshots.mjs` and attached as each
 * component's preview thumbnail in Storyblok.
 *
 * Usage:
 *   node scripts/screenshot-slides.mjs
 *   THEME=midnight node scripts/screenshot-slides.mjs   # override theme
 *
 * Idempotent: clears .storyblok-screenshots/ on each run.
 */

import { chromium } from "playwright";
import { mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const HTML_FILE = resolve(ROOT, "slide-design-system.html");
const OUT_DIR = resolve(ROOT, ".storyblok-screenshots");
const THEME = process.env.THEME || "paper";
const TARGET_WIDTH = 1600;
const TARGET_HEIGHT = 900;

// Slide caption number → Storyblok component name. The design system uses
// these numbers in `.slide-caption .num`; matching them here means the file
// stays the source of truth for slide ordering and the script just follows.
const SLIDE_NUM_TO_COMPONENT = {
  "01": "slide_title",
  "02": "slide_section",
  "03": "slide_bullets",
  "04": "slide_split",
  "05": "slide_hero",
  "06": "slide_code",
  "07": "slide_compare",
  "08": "slide_quote",
  "09": "slide_stats",
  "10": "slide_stepper",
  "11": "slide_team",
  "12": "slide_chart",
  "13": "slide_media",
  "14": "slide_table",
  "15": "slide_closing",
  "16": "slide_agenda",
  "17": "slide_bignum",
  "18": "slide_pricing",
  "19": "slide_timeline",
  "20": "slide_features",
  "21": "slide_gallery",
  "22": "slide_logos",
  "23": "slide_qa",
  "24": "slide_beforeafter",
  "25": "slide_diagram",
  "26": "slide_device",
  "27": "slide_definition",
  "28": "slide_console",
  "29": "slide_diff",
  "30": "slide_api",
  "31": "slide_tree",
  "32": "slide_techstack",
  "33": "slide_keyboard",
  "34": "slide_changelog",
  "35": "slide_dashboard",
  "36": "slide_livedemo",
  "37": "slide_codedemo",
  "38": "slide_gantt",
  "39": "slide_kanban",
  "40": "slide_swimlane",
  "41": "slide_sprint",
  "42": "slide_scorecard",
  "43": "slide_usmap",
};

function ensureChromium() {
  // `chromium.executablePath()` returns the *expected* path even when the
  // binary isn't actually downloaded yet. Stat the file to know for real.
  let installed = false;
  try {
    const path = chromium.executablePath();
    installed = path && existsSync(path);
  } catch {
    installed = false;
  }
  if (!installed) {
    console.log("Chromium not found — installing for Playwright (~150 MB, one-time)…\n");
    execSync("npx --no playwright install chromium", { stdio: "inherit" });
  }
}

async function main() {
  if (!existsSync(HTML_FILE)) {
    console.error(`Missing ${HTML_FILE}.`);
    process.exit(1);
  }

  ensureChromium();

  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });

  console.log(`Rendering slides at ${TARGET_WIDTH}×${TARGET_HEIGHT} in theme="${THEME}"…\n`);

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: TARGET_WIDTH + 40, height: TARGET_HEIGHT + 40 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  await page.goto(`file://${HTML_FILE}`);
  await page.waitForLoadState("networkidle");

  // Pin the requested theme on the slides grid.
  await page.evaluate((theme) => {
    const grid = document.getElementById("slidesGrid");
    if (grid) grid.setAttribute("data-theme", theme);
  }, THEME);

  // Wait for web fonts so display-face metrics don't shift mid-screenshot.
  await page.evaluate(() => document.fonts.ready);

  // Hide the design-system's GitHub watermark — the per-component thumbnail
  // shouldn't carry an unrelated repo link.
  await page.addStyleTag({
    content: `.slide-mark { display: none !important; }`,
  });

  const cards = await page.$$(".slide-card");
  console.log(`Found ${cards.length} slides.\n`);

  let count = 0;
  for (const card of cards) {
    const num = await card.$eval(".slide-caption .num", (el) => el.textContent.trim());
    const componentName = SLIDE_NUM_TO_COMPONENT[num];
    if (!componentName) {
      console.log(`  - slide ${num}: no component mapping, skipping`);
      continue;
    }

    // Inflate just this card so the slide inside renders 1600×900 with full-
    // scale typography (everything inside a slide is sized in `cqw`, so the
    // card width is what controls visual scale). Other cards stay in the grid.
    await card.evaluate((el, w) => {
      el.dataset._origStyle = el.getAttribute("style") || "";
      el.style.cssText = `width:${w}px; max-width:${w}px; position:relative; z-index:100;`;
    }, TARGET_WIDTH);

    // Let layout + container queries settle before snapping.
    await page.waitForTimeout(120);

    const slide = await card.$(".slide");
    const out = resolve(OUT_DIR, `${componentName}.png`);
    await slide.screenshot({ path: out });
    console.log(`  ✓ ${componentName}.png`);

    // Reset so the next card's neighbours aren't pushed off the visible flow.
    await card.evaluate((el) => {
      el.setAttribute("style", el.dataset._origStyle || "");
      delete el.dataset._origStyle;
    });
    count++;
  }

  await browser.close();
  console.log(`\nWrote ${count} screenshot${count === 1 ? "" : "s"} to ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
