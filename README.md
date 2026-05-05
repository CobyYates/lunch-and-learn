# lunch-and-learn — Storyblok slides

Storyblok-driven slide deck app, built on top of the **Nuxt 4 + Cloudflare + Vuetify + Tailwind** base from `main`.

## Stack

| Piece | What it does |
| --- | --- |
| **Nuxt 4** | App framework. SPA mode (`ssr: false`) — pages render in the browser. |
| **Vuetify 3** | UI component library, auto-imported via `vite-plugin-vuetify`. |
| **Tailwind CSS 4** | Utility classes, layered under Vuetify so the two coexist. |
| **Storyblok** | CMS. Visual-editor bridge wired up for live preview. |
| **Cloudflare Pages** | Hosting. Static assets + `server/api/*` routes as Pages Functions. |
| **Cloudflare KV** | Caches published Storyblok stories, invalidated by webhook on publish. |

---

## Prerequisites

- **Node.js 22** (`nvm install 22`; `.nvmrc` already pins this).
- **npm** (comes with Node).
- **mkcert** — needed once for the local HTTPS dev server (the Storyblok visual-editor bridge requires HTTPS). Install via `brew install mkcert nss` on macOS.
- Accounts on:
  - [Storyblok](https://app.storyblok.com) (free tier works)
  - [Cloudflare](https://dash.cloudflare.com) (free Pages plan works)
  - **GitHub** — Cloudflare Pages deploys from a connected Git repo.

---

## Part 1 — Local setup

### 1. Clone + install

```bash
git clone <your-repo-url> lunch-and-learn
cd lunch-and-learn
nvm use
npm install
```

### 2. Generate local TLS certs (once)

The Storyblok visual-editor iframe will only load over HTTPS, so the dev server runs over HTTPS locally:

```bash
npm run setup:certs
```

This creates `localhost.pem` + `localhost-key.pem` in the repo root (gitignored). `nuxt.config.ts` auto-detects them and switches the dev server to HTTPS.

### 3. Create `.env`

```bash
cp .env.example .env
```

Fill in the values. Where to find them:

| Var | Where to get it |
| --- | --- |
| `STORYBLOK_SPACE_ID` | Storyblok → **Settings → General → Space ID** |
| `STORYBLOK_PUBLIC_TOKEN` | Storyblok → **Settings → Access Tokens** → **Public** token |
| `STORYBLOK_PREVIEW_TOKEN` | Storyblok → **Settings → Access Tokens** → **Preview** token |
| `STORYBLOK_WEBHOOK_SECRET` | Generate any random string (e.g. `openssl rand -hex 32`). Same string goes on the Storyblok webhook URL later. |
| `STORYBLOK_MANAGEMENT_TOKEN` | Storyblok account → **Personal access tokens → Generate**. **Local-only** — needed to push the slide schema. |

### 4. Run the dev server

```bash
npm run dev
```

App runs at https://localhost:3000.

Local dev talks to Storyblok directly (no KV — the cache layer no-ops when no binding is present).

### 5. (Optional) Run against the real Cloudflare runtime locally

Use this when you want to test KV behavior or Pages Functions behavior before deploying:

```bash
npm run build
npx wrangler pages dev dist
```

---

## Part 2 — Storyblok setup

### 1. Create a space

Storyblok dashboard → **Create new space**. Region: **EU** (matches `apiOptions.region: "eu"` in `nuxt.config.ts`; if you pick US, update that config).

### 2. Grab the access tokens

**Settings → Access Tokens** → copy the **Public** token + **Preview** token into your `.env`.

### 3. Push the slide schema

This branch ships with a full slide-component schema (`storyblok-schema.json`) and a script to push it into your space:

```bash
npm run storyblok:push
```

The script reads `STORYBLOK_MANAGEMENT_TOKEN` and `STORYBLOK_SPACE_ID` and creates/updates each component. Re-run it any time `storyblok-schema.json` changes.

### 4. Set the Visual Editor preview URL

**Settings → Visual Editor → Location**:

- Local dev: `https://localhost:3000/?_storyblok=1`
- Production: `https://<your-project>.pages.dev/?_storyblok=1`

The `?_storyblok=1` query param is what triggers the bridge-aware draft fetch instead of the KV-cached endpoint.

### 5. Create your first slideshow

**Content → Create folder** named `slide-shows`. Inside, **Create story** of content type `slideshow`. Add one or more slide blocks (Hero, Title, Bullets, etc.) in the `Slides` field. Save + publish.

Visit `https://localhost:3000/` and the slideshow appears in the index list.

### 6. Set up the publish webhook (after first deploy)

Wire up after Cloudflare Pages is live — see Part 3.

---

## Part 3 — Cloudflare Pages deployment

### 1. Push the repo to GitHub, connect to Pages

Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.

### 2. Build settings

| Field | Value |
| --- | --- |
| Framework preset | **None** |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | *(leave blank)* |

### 3. Create KV namespaces

Sidebar → **Storage & Databases → KV → Create a namespace**. Make two:

- `storyblok-cache-prod`
- `storyblok-cache-preview`

### 4. Bind KV to the project

Pages project → **Settings → Bindings → Add → KV namespace**:

| Variable name | Production | Preview |
| --- | --- | --- |
| `STORYBLOK_CACHE` | `storyblok-cache-prod` | `storyblok-cache-preview` |

### 5. Add Secrets

Pages project → **Settings → Variables and Secrets → Secrets** for both Production and Preview:

- `STORYBLOK_SPACE_ID`
- `STORYBLOK_PUBLIC_TOKEN`
- `STORYBLOK_PREVIEW_TOKEN`
- `STORYBLOK_WEBHOOK_SECRET`

> Don't add `STORYBLOK_MANAGEMENT_TOKEN` to Cloudflare — it's only used locally by `npm run storyblok:push`.

### 6. Wire up the publish webhook

Storyblok → **Settings → Webhooks → Create webhook**:

| Field | Value |
| --- | --- |
| Name | `Cloudflare KV cache invalidation` |
| Endpoint URL | `https://<your-project>.pages.dev/api/storyblok/webhook?secret=<STORYBLOK_WEBHOOK_SECRET>` |
| Events | ✅ Story published, ✅ Story unpublished, ✅ Story deleted |

---

## Part 4 — How the bridge works

- `bridge: true` in `nuxt.config.ts` loads Storyblok's bridge JS.
- `useStory(slug)` (in `app/composables/useStory.ts`) does two things:
  - **Inside the visual editor** (URL has `?_storyblok=...`): fetches the `draft` version directly and subscribes to `useStoryblokBridge(id, cb)` so in-editor changes update live.
  - **Elsewhere**: fetches from `/api/story/[slug]`, which is KV-cached.
- `useStories(opts)` lists stories (used by the home page to enumerate all `slide-shows/*`).

Each Storyblok block type is mapped to a `.vue` file in `app/storyblok/`. The filename matches the block's technical name. `@storyblok/nuxt` auto-registers everything in that folder.

---

## Project structure

```
.
├── app/
│   ├── app.vue
│   ├── assets/styles/
│   │   ├── main.css               # Tailwind + Vuetify cascade-layer setup
│   │   └── slides.css             # Slide-specific styles (fonts, layouts)
│   ├── composables/
│   │   ├── useStories.ts          # List stories
│   │   └── useStory.ts            # Bridge-aware single-story fetch
│   ├── middleware/
│   │   └── home-redirect.global.ts
│   ├── pages/
│   │   ├── index.vue              # Slideshow list
│   │   └── [...slug].vue          # Catch-all → renders Storyblok stories
│   ├── plugins/
│   │   └── vuetify.ts
│   ├── storyblok/                 # One .vue per Storyblok block type
│   │   ├── Slideshow.vue
│   │   ├── page.vue
│   │   └── slide_*.vue            # 30+ slide components
│   └── utils/
│       └── dates.ts
├── public/
├── scripts/
│   └── push-storyblok-schema.mjs  # Pushes storyblok-schema.json to your space
├── server/
│   ├── api/
│   │   ├── story/[...slug].get.ts     # KV-cached story fetch
│   │   └── storyblok/webhook.post.ts  # KV invalidation webhook
│   └── utils/
│       └── storyblok.ts           # KV + Storyblok CDN helpers
├── slide-design-system.html       # Reference design system for slide components
├── storyblok-schema.json          # Storyblok component definitions (pushed via npm run storyblok:push)
├── .env.example
├── nuxt.config.ts
├── wrangler.toml
└── package.json
```

---

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Nuxt dev server at https://localhost:3000 (HTTPS for Storyblok bridge) |
| `npm run setup:certs` | One-time: generates `localhost.pem` + `localhost-key.pem` via mkcert |
| `npm run build` | Cloudflare-Pages-ready build — outputs `dist/` |
| `npm run storyblok:push` | Pushes `storyblok-schema.json` to your space (uses `STORYBLOK_MANAGEMENT_TOKEN`) |
| `npm run preview` | Nitro preview server. For full CF runtime, use `npx wrangler pages dev dist`. |

---

## Troubleshooting

**Storyblok bridge doesn't update the component** — confirm (1) the URL has `?_storyblok=...` (the editor adds this), (2) the component is rendered through `useStory`, (3) each block template uses `v-editable="blok"`.

**`/api/story/<slug>` returns 500 `STORYBLOK_TOKEN is not configured`** — env var isn't set. Double-check Pages **Variables and Secrets** for both Production and Preview.

**KV entries never expire** — they do (24h TTL, set in `server/utils/storyblok.ts`), but the publish webhook also deletes on demand. If webhook isn't firing, check Function logs and verify the `?secret=` query param matches `STORYBLOK_WEBHOOK_SECRET`.

**`Duplicated imports "useAppConfig"` warning** — harmless upstream noise from Nuxt 4 + Nitro. Ignore.
