# lunch-and-learn

Nuxt 4 + Vuetify 4 + Storyblok + Firebase, deployed to Cloudflare Pages.

- **Rendering**: SPA (`ssr: false`) — pages render client-side.
- **Server routes**: `server/api/*` deploys as Cloudflare Pages Functions (the `_worker.js` bundle).
- **CMS**: Storyblok, with the visual-editor Bridge enabled for live preview.
- **CMS cache**: published stories are cached in Cloudflare Workers KV (`STORYBLOK_CACHE` binding) and invalidated by a Storyblok webhook on publish.
- **Backend**: Firebase (Auth + Firestore client SDKs).

## Local setup

```bash
nvm use
npm install
cp .env.example .env
# fill in STORYBLOK_TOKEN and NUXT_PUBLIC_FIREBASE_* values
npm run dev
```

Dev server runs without KV (the cache layer no-ops when no binding is present) and talks directly to Storyblok.

To run locally against the real Cloudflare runtime (KV included):

```bash
npm run build
npx wrangler pages dev dist
```

## Cloudflare Pages — one-time setup

The repo ships with a `wrangler.toml`, but several things still need to be done in the dashboard.

1. **Connect the repo** (Workers & Pages → Create → Pages → Connect to Git).
2. **Build settings**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: *(blank)*
3. **Node version**: Pages reads `.nvmrc` automatically (v22). No action needed.
4. **Create two KV namespaces** (Storage & Databases → KV → Create):
   - `storyblok-cache-prod`
   - `storyblok-cache-preview`
5. **Bind KV to the Pages project** (Pages → Settings → Functions → KV namespace bindings):
   - Variable name: `STORYBLOK_CACHE`
   - Production: `storyblok-cache-prod`
   - Preview: `storyblok-cache-preview`

   (The `wrangler.toml` bindings are only used by `wrangler pages dev`. Production bindings live in the dashboard.)
6. **Environment variables** (Pages → Settings → Environment variables, set for Production **and** Preview):
   - `STORYBLOK_TOKEN` — Storyblok preview token
   - `STORYBLOK_WEBHOOK_SECRET` — any random string
   - `NUXT_PUBLIC_FIREBASE_*` — values from the Firebase console

## Storyblok — one-time setup

1. **Preview URL** (Settings → Visual Editor): `https://<project>.pages.dev/?_storyblok=1` (and the same for branch/preview URLs if you want the bridge to work on preview deploys).
2. **Webhook on publish** (Settings → Webhooks → Story published):
   - URL: `https://<project>.pages.dev/api/storyblok/webhook?secret=<STORYBLOK_WEBHOOK_SECRET>`

   This invalidates the KV entry for the published slug so the next request refetches from Storyblok.
3. **Component mappings** live in `app/storyblok/*.vue` — add one `.vue` file per Storyblok component using the component's technical name.

## How the Storyblok bridge works here

- `useStory(slug)` (in `app/composables/useStory.ts`) detects the `?_storyblok` query param that the visual editor adds.
  - In preview (inside the editor iframe): fetches `draft` directly from Storyblok and subscribes to `useStoryblokBridge` so edits update the component live.
  - Otherwise: hits `/api/story/[slug]`, which is KV-cached.
- `bridge: true` in `nuxt.config.ts` loads the bridge client script.

## Scripts

- `npm run dev` — Nuxt dev server
- `npm run build` — Cloudflare-Pages-ready build (`dist/` with `_worker.js`)
- `npm run generate` — pure static output (no Functions; KV/API routes won't work)
- `npm run preview` — Nitro-side preview; for full CF runtime preview use `wrangler pages dev dist`
# lunch-and-learn
