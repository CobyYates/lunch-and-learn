# lunch-and-learn

A production-ready boilerplate for **Nuxt 4 + Vuetify 4 + Storyblok + Firebase**, deployed to **Cloudflare Pages** with KV caching for CMS content.

## Stack

| Piece | What it does |
| --- | --- |
| **Nuxt 4** | App framework. SPA mode (`ssr: false`) — pages render in the browser. |
| **Vuetify 4** | UI component library, auto-imported via `vite-plugin-vuetify`. SCSS overrides supported. |
| **Storyblok** | CMS. Visual-editor bridge wired up for live preview. |
| **Firebase** | Client-side Auth + Firestore. |
| **Cloudflare Pages** | Hosting. Static assets + `server/api/*` routes as Pages Functions. |
| **Cloudflare KV** | Caches published Storyblok stories, invalidated by webhook on publish. |

---

## Prerequisites

- **Node.js 22** — install via [nvm](https://github.com/nvm-sh/nvm): `nvm install 22`. `.nvmrc` already pins this.
- **npm** (comes with Node).
- Accounts on:
  - [Storyblok](https://app.storyblok.com) (free tier works)
  - [Firebase](https://console.firebase.google.com) (free Spark plan works)
  - [Cloudflare](https://dash.cloudflare.com) (free Pages plan works)
  - **GitHub** (or GitLab) — Cloudflare Pages deploys from a connected Git repo.

---

## Part 1 — Local setup

### 1. Clone + install

```bash
git clone <your-repo-url> lunch-and-learn
cd lunch-and-learn
nvm use
npm install
```

### 2. Create `.env`

```bash
cp .env.example .env
```

Fill in the values. Where to find them:

| Var | Where to get it |
| --- | --- |
| `STORYBLOK_TOKEN` | Storyblok space → **Settings → Access Tokens** → use the **preview** token |
| `STORYBLOK_WEBHOOK_SECRET` | Generate any random string (e.g. `openssl rand -hex 32`). You'll paste the same string into Storyblok's webhook URL later. |
| `NUXT_PUBLIC_FIREBASE_*` | Firebase Console → project settings → **Your apps** → the web app → **SDK setup and configuration** → copy each field |

### 3. Run the dev server

```bash
npm run dev
```

App runs at http://localhost:3000.

Local dev talks to Storyblok directly (no KV — the cache layer no-ops when no binding is present). Firebase client SDK connects straight from the browser.

### 4. (Optional) Run against the real Cloudflare runtime locally

Use this when you want to test KV behavior or Pages Functions behavior before deploying:

```bash
npm run build
npx wrangler pages dev dist
```

Requires `wrangler login` once. KV reads/writes will hit a local-simulated KV unless you paste real IDs into `wrangler.toml`.

---

## Part 2 — Storyblok setup

### 1. Create a space

Storyblok dashboard → **Create new space**. Region: **US** (matches `apiOptions.region: "us"` in `nuxt.config.ts`; if you pick EU, update that config).

### 2. Grab the preview token

**Settings → Access Tokens** → copy the **Preview** token into your `.env` as `STORYBLOK_TOKEN`.

### 3. Set the Visual Editor preview URL

**Settings → Visual Editor → Location**:

- Local dev: `https://localhost:3000/?_storyblok=1`
  - Storyblok's visual editor requires HTTPS. The easiest fix: run `npx storyblok-cli sync` or use the [Storyblok HTTPS proxy](https://www.storyblok.com/faq/setup-dev-server-https-local-environment), or temporarily set the preview URL to your Pages deploy.
- Production: `https://<your-project>.pages.dev/?_storyblok=1`

The `?_storyblok=1` query param is what triggers `useStory` to use the bridge-aware draft fetch instead of the KV-cached endpoint.

### 4. Create your first story

**Content → Create** → give it a name like `home` and slug `home`. Save + publish. That's the story your app will fetch.

### 5. Component mappings

Each Storyblok block type (Page, Hero, Feature, etc.) needs a matching `.vue` file in `app/storyblok/`. The filename must match the component's **technical name** from Storyblok. Example:

```vue
<!-- app/storyblok/hero.vue -->
<script setup lang="ts">
defineProps<{ blok: { headline: string } }>();
</script>

<template>
  <v-container v-editable="blok">
    <h1>{{ blok.headline }}</h1>
  </v-container>
</template>
```

`@storyblok/nuxt` auto-registers anything in this folder.

### 6. Set up the publish webhook (after first deploy)

You'll do this **after** Cloudflare Pages is live — see Part 5.

---

## Part 3 — Firebase setup

### 1. Create a project

Firebase Console → **Add project**.

### 2. Add a web app

Project settings → **Your apps** → click the web icon (`</>`) → register the app. Firebase will show you the config object:

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

Copy each value into `.env` under the matching `NUXT_PUBLIC_FIREBASE_*` name.

> These values ship in the browser bundle. That's fine — Firebase web config is designed to be public. Security lives in Firebase Security Rules + App Check, not in hiding the API key.

### 3. Enable the services you'll use

- **Authentication** → Sign-in method → enable whichever providers you want (Email/Password, Google, etc.).
- **Firestore Database** → Create database → Start in **production mode** (tighten rules later).

### 4. Access Firebase in your components

```vue
<script setup lang="ts">
const { $firebase } = useNuxtApp();
// $firebase.auth, $firebase.firestore, $firebase.app all available
</script>
```

The plugin is defined in `app/plugins/firebase.client.ts` and runs **only on the client** (`.client.ts` suffix) — which is correct here since we're SPA anyway.

---

## Part 4 — Cloudflare Pages deployment

### 1. Push the repo to GitHub

If not already:

```bash
git remote add origin git@github.com:<you>/<repo>.git
git push -u origin main
```

### 2. Connect the repo to Pages

Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** tab → **Connect to Git** → select your repo.

### 3. Build settings

| Field | Value |
| --- | --- |
| Framework preset | **None** |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | *(leave blank)* |
| Node version | Auto-detected from `.nvmrc` (v22). No action needed. |

Click **Save and Deploy**. The first deploy will likely fail — that's expected until KV + env vars are wired up. Continue to the next steps.

### 4. Create KV namespaces

Left sidebar → **Storage & Databases** → **KV** → **Create a namespace**. Make two:

- `storyblok-cache-prod`
- `storyblok-cache-preview`

### 5. Bind KV to the Pages project

Pages project → **Settings** → **Bindings** (may be under **Functions** in some accounts) → **Add** → **KV namespace**:

| Variable name | Production | Preview |
| --- | --- | --- |
| `STORYBLOK_CACHE` | `storyblok-cache-prod` | `storyblok-cache-preview` |

(You add this binding once; the same variable name is available in both Production and Preview environments and maps to the namespace you chose per environment.)

### 6. Environment variables (add as **Secrets**)

Pages project → **Settings** → **Variables and Secrets** → **Secrets** section (not Plaintext — because `wrangler.toml` exists in the repo, Cloudflare locks plaintext management to `wrangler.toml` and only allows Secrets in the dashboard).

Add each one as a **Secret** for **both Production and Preview**:

- `STORYBLOK_TOKEN`
- `STORYBLOK_WEBHOOK_SECRET`
- `NUXT_PUBLIC_FIREBASE_API_KEY`
- `NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NUXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NUXT_PUBLIC_FIREBASE_APP_ID`

The `NUXT_PUBLIC_FIREBASE_*` values will still be exposed in the client bundle (that's how Firebase web config is designed to work) — "Secret" here only means Cloudflare encrypts storage and hides the values in the UI, so nothing leaks through the repo or the dashboard.

### 7. Retry the deploy

**Deployments** tab → latest deploy → **Retry deployment**. Or push a new commit.

### 8. Verify

- Visit `https://<your-project>.pages.dev/` — the app should load.
- Visit `https://<your-project>.pages.dev/api/story/home` — should return JSON for your `home` Storyblok story. First hit is uncached (pulls from Storyblok + writes to KV); subsequent hits serve from KV.

---

## Part 5 — Wire up the Storyblok publish webhook

Now that Pages is live, Storyblok can tell our API to invalidate stale KV entries when you publish.

### 1. Create the webhook

Storyblok → **Settings → Webhooks → Create webhook**:

| Field | Value |
| --- | --- |
| Name | `Cloudflare KV cache invalidation` |
| Endpoint URL | `https://<your-project>.pages.dev/api/storyblok/webhook?secret=<STORYBLOK_WEBHOOK_SECRET>` |
| Events | ✅ Story published, ✅ Story unpublished, ✅ Story deleted |

Replace both placeholders with the real values.

### 2. Test it

- In Storyblok, edit and **publish** your `home` story.
- In Cloudflare dashboard → Pages → your project → **Functions → Real-time Logs**, watch for a `POST /api/storyblok/webhook` with `{"ok":true,"invalidated":"home"}`.
- Hit `/api/story/home` again — the response reflects the new content.

---

## Part 6 — Using the Storyblok bridge (live preview)

The bridge is already wired up. Mechanics:

- `bridge: true` in `nuxt.config.ts` loads Storyblok's bridge JS.
- `useStory(slug)` (in `app/composables/useStory.ts`) does two things depending on context:
  - **Inside the Storyblok visual editor** (URL has `?_storyblok=...`): fetches the `draft` version directly from Storyblok and subscribes to `useStoryblokBridge(id, cb)` so in-editor changes update the component live.
  - **Elsewhere**: fetches from `/api/story/[slug]`, which is KV-cached.

Usage in a page:

```vue
<!-- app/pages/index.vue -->
<script setup lang="ts">
const story = await useStory("home");
</script>

<template>
  <div v-if="story">
    <StoryblokComponent
      v-for="blok in story.content.body"
      :key="blok._uid"
      :blok="blok"
    />
  </div>
</template>
```

`StoryblokComponent` auto-resolves each blok to the matching file in `app/storyblok/`.

---

## Project structure

```
.
├── app/
│   ├── app.vue                    # Root component (v-app wrapper)
│   ├── assets/styles/
│   │   ├── settings.scss          # Vuetify SCSS variable overrides
│   │   └── main.scss              # Global styles
│   ├── composables/
│   │   └── useStory.ts            # Bridge-aware story fetching
│   ├── plugins/
│   │   ├── firebase.client.ts     # Client-only Firebase init
│   │   └── vuetify.ts             # Vuetify + theme setup
│   └── storyblok/                 # Storyblok component mappings (add .vue files here)
├── public/
│   ├── favicon.ico
│   └── robots.txt
├── server/
│   ├── api/
│   │   ├── story/[...slug].get.ts     # KV-cached story fetch
│   │   └── storyblok/webhook.post.ts  # KV invalidation webhook
│   └── utils/
│       └── storyblok.ts           # KV + Storyblok CDN helpers
├── .env.example                   # Template for .env
├── .nvmrc                         # Node 22
├── nuxt.config.ts
├── wrangler.toml                  # Cloudflare Pages config (name, compat date, optional KV)
└── package.json
```

---

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Nuxt dev server at http://localhost:3000 |
| `npm run build` | Cloudflare-Pages-ready build — outputs `dist/` with `_worker.js` |
| `npm run generate` | Pure static output — **no Functions, KV/API routes won't work**. Only use for a fully-static fallback. |
| `npm run preview` | Nitro preview server. For the full CF runtime locally, use `npx wrangler pages dev dist`. |

---

## Troubleshooting

**"Invalid KV namespace ID" on deploy** — `wrangler.toml` has a `[[kv_namespaces]]` block with placeholder IDs. Either remove the block (use dashboard bindings) or paste real namespace IDs.

**Storyblok bridge doesn't update the component** — make sure (1) the URL has `?_storyblok=...` (the editor adds this automatically), (2) the component is rendered through `useStory` and not a direct fetch, (3) each blok template uses `v-editable="blok"` so the editor can highlight it.

**`/api/story/<slug>` returns 500 `STORYBLOK_TOKEN is not configured`** — the env var isn't set in Pages. Double-check **Settings → Variables and Secrets** for both Production and Preview.

**KV entries never expire** — they do (24h TTL, set in `server/utils/storyblok.ts`), but the publish webhook also deletes them on demand. If webhook isn't firing, check Cloudflare's Function logs and verify the `?secret=` query param matches `STORYBLOK_WEBHOOK_SECRET`.

**`Duplicated imports "useAppConfig"` warning** — harmless upstream noise from Nuxt 4 + Nitro 2.13. Ignore.
