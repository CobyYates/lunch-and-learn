# lunch-and-learn

A production-ready boilerplate for **Nuxt 4 + Vuetify 3 + Storyblok + Firebase**, deployed to **Cloudflare Pages** with KV caching for CMS content.

## Stack

| Piece                | What it does                                                                             |
| -------------------- | ---------------------------------------------------------------------------------------- |
| **Nuxt 4**           | App framework. SPA mode (`ssr: false`) — pages render in the browser.                    |
| **Vuetify 3**        | UI component library, auto-imported via `vite-plugin-vuetify`. SCSS overrides supported. |
| **Storyblok**        | CMS. Visual-editor bridge wired up for live preview.                                     |
| **Firebase**         | Client-side Auth + Firestore.                                                            |
| **Cloudflare Pages** | Hosting. Static assets + `server/api/*` routes as Pages Functions.                       |
| **Cloudflare KV**    | Caches published Storyblok stories, invalidated by webhook on publish.                   |

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

| Var                         | Where to get it                                                                                                                         |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `STORYBLOK_SPACE_ID`        | Storyblok space → **Settings → General → Space ID**                                                                                     |
| `STORYBLOK_PUBLIC_TOKEN`    | Storyblok space → **Settings → Access Tokens** → **Public** token (read-only, published content only — used by the KV-cached server route) |
| `STORYBLOK_PREVIEW_TOKEN`   | Storyblok space → **Settings → Access Tokens** → **Preview** token (reads drafts — used by the client so the visual-editor bridge works) |
| `STORYBLOK_WEBHOOK_SECRET`  | Generate any random string (e.g. `openssl rand -hex 32`). You'll paste the same string into Storyblok's webhook URL later.              |
| `NUXT_PUBLIC_FIREBASE_*`    | Firebase Console → project settings → **Your apps** → the web app → **SDK setup and configuration** → copy each field                   |

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

Storyblok dashboard → **Create new space**. Region: **EU** (matches `apiOptions.region: "eu"` in `nuxt.config.ts` and the `https://api.storyblok.com` base URL in `server/utils/storyblok.ts`). If you pick US, change both — `region: "us"` in the config and `api-us.storyblok.com` in the server util.

### 2. Grab the preview token

**Settings → Access Tokens** has both tokens you need:

- Copy the **Preview** token into `.env` as `STORYBLOK_PREVIEW_TOKEN`. This is what the client uses (including the visual-editor bridge, which needs to read drafts).
- Copy the **Public** token into `.env` as `STORYBLOK_PUBLIC_TOKEN`. This is what the server-side `/api/story` route uses when populating KV — it only ever needs published content.
- Also copy the **Space ID** (Settings → General) into `.env` as `STORYBLOK_SPACE_ID`.

### 3. Set up local HTTPS (required for the visual editor iframe)

Storyblok's visual editor loads your app inside an HTTPS iframe. Nuxt's dev server will serve over HTTPS automatically when it finds `localhost.pem` + `localhost-key.pem` in the project root. Generate them once with mkcert:

```bash
# macOS (Homebrew) — install mkcert if you don't have it:
brew install mkcert

# Generate and trust the cert (prompts for sudo on -install):
npm run setup:certs
```

Under the hood that runs `mkcert -install && mkcert localhost`, which writes `localhost.pem` + `localhost-key.pem` into the repo root. Both files are gitignored — never commit them.

Now `npm run dev` will boot on **`https://localhost:3000`** directly. If the cert files aren't present, Nuxt falls back to HTTP — so forks that don't care about the Storyblok editor can skip this step.

### 4. Set the Visual Editor preview URL

**Settings → Visual Editor → Location**:

- Local dev: `https://localhost:3000/?_storyblok=1`
- Production: `https://<your-project>.pages.dev/?_storyblok=1`

The `?_storyblok=1` query param is what triggers `useStory` to use the bridge-aware draft fetch instead of the KV-cached endpoint.

### 5. Create your first story

**Content → Create** → give it a name like `home` and slug `home`. Save + publish. That's the story your app will fetch.

### 6. Component mappings

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

### 7. Set up the publish webhook (after first deploy)

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
  appId: "...",
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

| Field                  | Value                                                |
| ---------------------- | ---------------------------------------------------- |
| Framework preset       | **None**                                             |
| Build command          | `npm run build`                                      |
| Build output directory | `dist`                                               |
| Root directory         | _(leave blank)_                                      |
| Node version           | Auto-detected from `.nvmrc` (v22). No action needed. |

Click **Save and Deploy**. The first deploy will likely fail — that's expected until KV + env vars are wired up. Continue to the next steps.

### 4. Create KV namespaces

Left sidebar → **Storage & Databases** → **KV** → **Create a namespace**. Make two:

- `storyblok-cache-prod`
- `storyblok-cache-preview`

### 5. Bind KV to the Pages project

Pages project → **Settings** → **Bindings** (may be under **Functions** in some accounts) → **Add** → **KV namespace**:

| Variable name     | Production             | Preview                   |
| ----------------- | ---------------------- | ------------------------- |
| `STORYBLOK_CACHE` | `storyblok-cache-prod` | `storyblok-cache-preview` |

(You add this binding once; the same variable name is available in both Production and Preview environments and maps to the namespace you chose per environment.)

### 6. Environment variables (add as **Secrets**)

Pages project → **Settings** → **Variables and Secrets** → **Secrets** section (not Plaintext — because `wrangler.toml` exists in the repo, Cloudflare locks plaintext management to `wrangler.toml` and only allows Secrets in the dashboard).

Add each one as a **Secret** for **both Production and Preview**:

- `STORYBLOK_SPACE_ID`
- `STORYBLOK_PUBLIC_TOKEN`
- `STORYBLOK_PREVIEW_TOKEN`
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

| Field        | Value                                                                                      |
| ------------ | ------------------------------------------------------------------------------------------ |
| Name         | `Cloudflare KV cache invalidation`                                                         |
| Endpoint URL | `https://<your-project>.pages.dev/api/storyblok/webhook?secret=<STORYBLOK_WEBHOOK_SECRET>` |
| Events       | ✅ Story published, ✅ Story unpublished, ✅ Story deleted                                 |

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

| Script                 | What it does                                                                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`          | Nuxt dev server. Serves HTTPS on https://localhost:3000 if `localhost.pem` + `localhost-key.pem` are in the repo root; otherwise falls back to HTTP.    |
| `npm run build`        | Cloudflare-Pages-ready build — outputs `dist/` with `_worker.js`                                                                                        |
| `npm run generate`     | Pure static output — **no Functions, KV/API routes won't work**. Only use for a fully-static fallback.                                                  |
| `npm run preview`      | Nitro preview server. For the full CF runtime locally, use `npx wrangler pages dev dist`.                                                               |
| `npm run setup:certs`  | One-time local HTTPS cert setup via mkcert. Runs `mkcert -install && mkcert localhost` and writes certs to the repo root (gitignored). Requires mkcert. |

---

## Gotchas

Real things that bit us setting this boilerplate up. Grouped by area; click each one to expand.

### Storyblok

<details>
<summary><strong>The home story previews at <code>/home</code>, not <code>/</code></strong></summary>

In the Home story → **Config / Entry settings** → set **Real Path** to `/`. Storyblok then loads the preview at root instead of appending the story's slug. We also ship a `home-redirect.global.ts` middleware that redirects `/home → /` (preserving the `?_storyblok=` query) so the URL stays canonical even before Real Path is set.
</details>

<details>
<summary><strong>404 / "Story not found" from the editor</strong></summary>

Usually one of:
- **Region mismatch.** Storyblok spaces are EU or US. If your space is EU but `nuxt.config.ts` has `region: "us"` (or vice-versa) and `server/utils/storyblok.ts` has the wrong base URL, every fetch 404s. Check Storyblok → Settings → General for the region.
- **Missing `STORYBLOK_PREVIEW_TOKEN` in `.env`** — the client uses this for drafts. After editing `.env`, restart `npm run dev`.
- **Story not saved once** — a story that was just created but never saved has no draft version; `version=draft` returns 404. Hit Save.
- **Full slug doesn't match** — if the story lives in a folder, its full_slug is `folder/slug`. `starts_with` / `getStory(slug)` must use the full path.
</details>

<details>
<summary><strong>Bridge doesn't update the component live</strong></summary>

Verify all three:
1. The URL has `?_storyblok=...` (the editor adds this automatically).
2. The component renders via `useStory()` (which subscribes to `useStoryblokBridge`) — not a direct `storyblokApi.get` call.
3. Each blok template uses `v-editable="blok"` so the editor can pair clicks with bloks.
</details>

<details>
<summary><strong>"Invalid response" in the editor iframe</strong></summary>

Storyblok loads your app inside an HTTPS iframe. If your local dev is HTTP, the browser rejects the connection. Fix: run `npm run setup:certs` (needs `brew install mkcert`) then restart `npm run dev` — Nuxt auto-detects `localhost.pem` in the repo root and boots on `https://localhost:3000`.
</details>

<details>
<summary><strong><code>import { useStoryblokApi } from "@storyblok/nuxt"</code> fails the build</strong></summary>

Nuxt 4 blocks direct imports from module entry points. The `@storyblok/nuxt` composables (`useStoryblokApi`, `useStoryblokBridge`, `useAsyncStoryblok`) are auto-imported globally — just use them without an import statement.
</details>

<details>
<summary><strong>Preview token is shipped to the browser</strong></summary>

Enabling the visual-editor bridge requires the preview token on the client (that's how Storyblok works). Anyone who opens devtools can grab it and read drafts. Tradeoff accepted for the editor UX — but don't confuse the preview token with the Management token, which is way more privileged and should never touch the client. The server (`/api/story`) uses the public token, not the preview token, to limit blast radius on that path.
</details>

### Cloudflare Pages

<details>
<summary><strong>"Invalid KV namespace ID" on deploy</strong></summary>

`wrangler.toml` had a `[[kv_namespaces]]` block with placeholder IDs like `REPLACE_WITH_PROD_KV_ID`. Either remove the whole block (current setup — bind via dashboard) or paste real namespace IDs from Storage & Databases → KV.
</details>

<details>
<summary><strong>Dashboard variables vanished, only Secrets are editable</strong></summary>

Once a `wrangler.toml` exists in the repo, Cloudflare switches the project to "managed by wrangler.toml" mode. Plaintext env vars move out of dashboard scope (you'd have to put them in `[vars]`). We lean into that: everything goes in the dashboard as **Secrets**, including the non-sensitive `NUXT_PUBLIC_FIREBASE_*` values. "Secret" just means encrypted storage — those values still end up in the client bundle because that's how Firebase web config works.
</details>

<details>
<summary><strong><code>nodejs_compat</code> is missing from the compat-flags dropdown</strong></summary>

Cloudflare split `nodejs_compat` into granular sub-flags (`enable_nodejs_process_v2`, etc.) and/or a dedicated toggle that isn't in the generic list. For this project you can skip it entirely — our Pages Functions only do `fetch()` + KV reads, no Node APIs. The `wrangler.toml` doesn't set `compatibility_flags` either.
</details>

<details>
<summary><strong>Env var changes don't take effect until you redeploy</strong></summary>

Pages Functions only pick up env var changes on a new deployment. After editing secrets in the dashboard, **Deployments → Retry deployment** (or push a new commit).
</details>

<details>
<summary><strong>KV cache never seems to refresh</strong></summary>

It does — 24h TTL set in `server/utils/storyblok.ts` — and the `/api/storyblok/webhook` route deletes entries on publish. If webhooks aren't firing:
- Check **Pages → Functions → Real-time Logs** for incoming POSTs.
- Verify the webhook URL's `?secret=` matches `STORYBLOK_WEBHOOK_SECRET` exactly (any mismatch returns 401).
- Confirm Storyblok is subscribed to Story published, unpublished, **and** deleted.
</details>

### Nuxt / dev server

<details>
<summary><strong>Router throws "No match found for location" after renaming a page</strong></summary>

Nuxt's file watcher occasionally misses renames in `pages/`. Stop the dev server, `rm -rf .nuxt node_modules/.vite`, then `npm run dev` again. Cold starts always rescan the pages directory cleanly.
</details>

<details>
<summary><strong><code>.env</code> changes don't appear to work</strong></summary>

Nuxt reads env vars **once at startup**. After any edit to `.env`, stop `npm run dev` and restart. Same applies if you add a new variable to `runtimeConfig` in `nuxt.config.ts`.
</details>

<details>
<summary><strong>Double-bracket filenames (<code>[[...slug]].vue</code>) act flaky</strong></summary>

Some combination of Vite/Node's file watcher and the special characters in `[[...]]` makes renames and hot reloads less reliable than single-bracket catch-alls. We use `index.vue` + `[...slug].vue` explicitly instead of the optional-catch-all form.
</details>

<details>
<summary><strong><code>Duplicated imports "useAppConfig"</code> warning</strong></summary>

Harmless upstream noise from Nuxt 4.4 + Nitro 2.13 + `@nuxt/nitro-server` all registering the same auto-import. Ignore. Will clear on a future Nuxt patch.
</details>

<details>
<summary><strong>Nuxt DevTools error inside the Storyblok iframe</strong></summary>

`SecurityError: Blocked a frame with origin "https://localhost:3000" from accessing a cross-origin frame` — DevTools trying to inspect its parent (Storyblok's UI) and being blocked by browser same-origin policy. Harmless; DevTools still works in non-iframe windows.
</details>

### Firebase

<details>
<summary><strong>Google sign-in popup fails with "unauthorized-domain"</strong></summary>

Firebase Console → **Authentication → Settings → Authorized domains** → add `localhost` **and** your Pages URL (e.g. `lunch-and-learn.pages.dev`). Google sign-in rejects popups from any domain that isn't in this list.
</details>

<details>
<summary><strong><code>NUXT_PUBLIC_FIREBASE_*</code> values "leak" into the client bundle</strong></summary>

That's the design. Firebase web config is public-safe — security is enforced by **Firebase Security Rules + App Check**, not by hiding the API key. Treat them as secrets in Cloudflare/`.env` for tidiness only, not because exposure is dangerous.
</details>

<details>
<summary><strong>Login page keeps showing even after sign-in succeeds</strong></summary>

The `auth.global.ts` middleware compares `user.value` against `to.path`. If the user-state ref isn't populated (missing plugin, Firebase config missing, etc.), the guard stays in "not signed in" mode. Check `useRuntimeConfig().public.firebase.apiKey` in devtools — if undefined, the plugin returned early in "not configured" mode.
</details>

### Styling

<details>
<summary><strong>Vuetify utility classes ≠ Tailwind utility classes</strong></summary>

Two different systems in the same project. Both work side by side — use whichever reads better per line:

| Vuetify | Tailwind |
| --- | --- |
| `pa-6` (all) / `pa-x` / `py-x` | `p-6` / `px-6` / `py-6` |
| `d-flex` | `flex` |
| `align-center` | `items-center` |
| `ga-3` | `gap-3` |
| `text-h5` / `text-caption` | `text-xl` / `text-xs` |
| `bg-primary` | `bg-indigo-500` (or whatever) |
</details>

<details>
<summary><strong>Tailwind classes don't work on a fresh clone</strong></summary>

Tailwind 4 is wired via `@tailwindcss/vite`. After `npm install`, stop and restart `npm run dev` — Vite loads plugins at startup only, so utilities aren't compiled until the server boots with the plugin in place.
</details>

<details>
<summary><strong>Tailwind's "preflight" would reset Vuetify's styles</strong></summary>

We import Tailwind's **theme + utilities only** (skipping preflight) in `app/assets/styles/main.css` so Vuetify's own reset stays authoritative. Layer order is `tailwind-theme, vuetify, tailwind-utilities` — Tailwind theme is demoted below Vuetify (so Tailwind's CSS vars can't leak into Vuetify's defaults), while Tailwind utilities sit on top (so classes explicitly applied to a Vuetify component still win). If you ever need Tailwind's reset, replace the two selective imports with `@import "tailwindcss";`.
</details>

### Misc

<details>
<summary><strong>Console spammed with <code>ERR_BLOCKED_BY_CLIENT</code> in the editor</strong></summary>

Your ad blocker is blocking Storyblok's own telemetry (Sentry, PostHog, Rudderstack). Nothing to do with our code. The editor keeps working fine.
</details>
