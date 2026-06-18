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

### 3. Bootstrap your Storyblok space (one command)

This branch ships with everything needed to populate a fresh space — schema, component groups, and per-component preview thumbnails. After your `.env` has `STORYBLOK_SPACE_ID` and `STORYBLOK_MANAGEMENT_TOKEN`, run:

```bash
npm run storyblok:bootstrap
```

That runs five steps in sequence — each is idempotent and safe to re-run:

| Step | What happens |
| --- | --- |
| `storyblok:datasources` | Creates/updates the `themes` datasource from `theme_options` in the schema. The `slideshow.theme` field reads its dropdown from this datasource so authors and editors see the same list. |
| `storyblok:push` | Pushes every component in `storyblok-schema.json` (slides, nested item bloks, the `slideshow` and `page` root types, plus the `codeSnippet` plugin and `image` helper) into your space, tagged into the right component groups. |
| `storyblok:stories` | Bootstraps the foundational content: a **Home** story (content type `page`), a **Slide Shows** folder (slug `slide-shows`, default content type `slideshow`), and an **Admin** story (content type `page`). Existing stories at those slugs are left untouched. |
| `storyblok:screenshots` | Renders every slide in `slide-design-system.html` at 1600×900 with the **paper** theme using headless Chromium and writes one PNG per component to `storyblok-thumbnails/` (gitignored). First run downloads the Chromium binary (~150 MB, one-time). |
| `storyblok:thumbs` | Uploads each PNG from `storyblok-thumbnails/` to your Storyblok asset library and attaches it to the matching component as the preview thumbnail authors see in the component picker. |

You can also run them individually if you only need one — every step is its own npm script (`storyblok:datasources`, `storyblok:push`, `storyblok:stories`, `storyblok:screenshots`, `storyblok:thumbs`). Override the screenshot theme with e.g. `THEME=midnight npm run storyblok:screenshots`.

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

### 5. Add environment variables

Pages project → **Settings → Variables and Secrets**, for **both Production and Preview**.

Each value can be added as a plain **Variable** or as a **Secret** — your choice. The two behave differently in one important way:

- **Variables** (plaintext) are exposed during the build *and* at runtime. The original env-var names (`STORYBLOK_PREVIEW_TOKEN`, `STORYBLOK_PUBLIC_TOKEN`, `STORYBLOK_WEBHOOK_SECRET`) work directly because `nuxt.config.ts` reads them via `process.env.*` at build time.
- **Secrets** are runtime-only — they're not exposed to the build. To make Secrets work, name them with the `NUXT_…` prefix so Nuxt's [runtime-config env override](https://nuxt.com/docs/guide/going-further/runtime-config#environment-variables) picks them up at request time.

| What it's for | Variable name | Secret name |
| --- | --- | --- |
| Preview token (client bridge) | `STORYBLOK_PREVIEW_TOKEN` | `NUXT_PUBLIC_STORYBLOK_ACCESS_TOKEN` |
| Public token (server API) | `STORYBLOK_PUBLIC_TOKEN` | `NUXT_STORYBLOK_PUBLIC_TOKEN` |
| Webhook shared secret | `STORYBLOK_WEBHOOK_SECRET` | `NUXT_STORYBLOK_WEBHOOK_SECRET` |
| Space ID (currently not used at runtime) | `STORYBLOK_SPACE_ID` | — |

You can mix and match — e.g. preview token as a Variable, webhook secret as a Secret.

> The preview token is **public by design** — it's embedded in the client bundle so the visual-editor bridge can read drafts. Marking it as a Secret in Cloudflare only encrypts dashboard storage; it still ships to the browser.

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

## Part 5 — Gated slideshows (Firebase auth + approval)

Any slideshow with the **Require authentication** toggle on (the
`requireAuthentication` field) is hidden until the viewer signs in **and** an
admin approves their account. Everything runs on the Firebase **client SDK**
(this app is a Cloudflare SPA — no Admin SDK / service account needed).

**How it works**

- `app/plugins/firebase.client.ts` initialises Firebase from the
  `NUXT_PUBLIC_FIREBASE_*` env vars and provides `$firebaseAuth` / `$firebaseDb`.
- `useAuth()` handles Google + email/password sign-in/sign-up and tracks the
  signed-in user plus their Firestore profile (`users/{uid}`) live. New accounts
  are created with `status: "pending"`, `role: "user"`.
- `<SlideshowGate>` wraps each slideshow: not signed in → login form; signed in
  but pending/rejected → status notice (updates live on approval); approved or
  admin → the slideshow renders.
- `/admin` lists every account and lets admins approve / reject / reset access
  and promote/demote admins. It reads the `users` collection (the client SDK
  can't list Auth accounts directly, so this collection mirrors them).

### 1. Create the Firebase project + web app

[Firebase console](https://console.firebase.google.com/) → **Add project**. Then
add a **Web app** (the `</>` icon under *Project Overview*) and copy the
`firebaseConfig` values it shows. Map them into `.env`:

| `.env` var | `firebaseConfig` key |
| --- | --- |
| `NUXT_PUBLIC_FIREBASE_API_KEY` | `apiKey` |
| `NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `NUXT_PUBLIC_FIREBASE_PROJECT_ID` | `projectId` |
| `NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `NUXT_PUBLIC_FIREBASE_APP_ID` | `appId` |

These are public by design (they ship in the browser bundle); access is gated by
the Firestore rules, not by hiding these values.

### 2. Enable Authentication + Firestore

- **Authentication → Get started → Sign-in method**: enable **Email/Password**
  and **Google**.
- **Firestore Database → Create database** (production mode is fine — the rules
  below lock it down). Pick a region.

### 3. Set the admin allowlist

Add the email you'll **sign into the app with** as the bootstrap admin, in two
places that must stay in sync:

- `.env` (and Cloudflare Pages env): `NUXT_PUBLIC_ADMIN_EMAILS=you@example.com`
- the `isAdminEmail()` list in `firestore.rules`

The env var flips the **admin UI**; the rules entry is what actually grants
database access. (Comma-separate multiple emails in the env var.)

### 4. Deploy the security rules

**The rules are the real enforcement — the client checks are only UX.** Nothing
takes effect until they're deployed. The repo ships `firestore.rules`,
`firebase.json`, and `.firebaserc`, so:

```bash
npx firebase-tools login                       # one-time
npx firebase-tools deploy --only firestore:rules
```

Or, without the CLI: open **Firebase console → Firestore Database → Rules**,
paste the contents of `firestore.rules`, and click **Publish**. Re-deploy
whenever you edit the rules.

> **Project owned by a different Google account?** If the Firebase project lives
> under a different account than the one you're signed into (e.g. a work account
> owns the DB but you log into the app with a personal one), the deploy fails
> with a `403` and the project won't appear in `firebase projects:list`. Deploy
> as the **owner**:
> ```bash
> npx firebase-tools login:add                  # add the owner account
> npx firebase-tools deploy --only firestore:rules --account owner@example.com
> ```
> The app-admin identity is separate — it's whichever email you sign into the
> *app* with, and that's the one that must be in `NUXT_PUBLIC_ADMIN_EMAILS` +
> `isAdminEmail()`.

### 5. Bootstrap the first admin, then use it

With your email in both the env allowlist and `isAdminEmail()`, just **sign into
the app** — your `users/{uid}` doc is created automatically as an approved
admin. (Alternatively: sign in once, then set that doc's `role: "admin"`,
`status: "approved"` in the Firestore *Data* tab.)

Then open **`/admin`** to approve/reject/promote accounts, and toggle **Require
authentication** on any slideshow in Storyblok to gate it. New visitors land as
`pending` and unlock the moment you approve them — no further rule changes
needed.

### Troubleshooting

- **"Could not load users: Missing or insufficient permissions" on `/admin`** —
  the rules aren't live on the project the app uses, or your signed-in email
  isn't an admin. Check, in order:
  1. The rules are **published to the project in `NUXT_PUBLIC_FIREBASE_PROJECT_ID`**
     (a common trap: editing rules in the console while signed into the *wrong*
     Google account, so they land on a different project — see the note above).
  2. The email shown in the `/admin` toolbar **exactly** matches an entry in
     `isAdminEmail()` (watch for Gmail dots and signing in with the wrong
     account).
  3. Rule changes can take ~1 minute to propagate — hard-refresh.

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
│   ├── push-storyblok-schema.mjs  # Pushes storyblok-schema.json to your space
│   ├── sync-datasources.mjs       # Creates the `themes` datasource from theme_options
│   ├── sync-stories.mjs           # Bootstraps Home / Slide Shows folder / Admin stories
│   ├── screenshot-slides.mjs      # Renders each slide to a 1600×900 PNG via headless Chromium
│   └── upload-screenshots.mjs     # Uploads PNGs and attaches them as component preview thumbs
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
| `npm run storyblok:datasources` | Syncs the `themes` datasource from `theme_options` in the schema (idempotent) |
| `npm run storyblok:stories` | Creates Home / Slide Shows folder / Admin stories if they don't exist |
| `npm run storyblok:screenshots` | Renders each slide in `slide-design-system.html` to a 1600×900 PNG (paper theme; override via `THEME=…`) |
| `npm run storyblok:thumbs` | Uploads the screenshots to Storyblok and attaches them as per-component preview thumbnails |
| `npm run storyblok:bootstrap` | Runs datasources → push → stories → screenshots → thumbs in one go (the "fresh fork" command) |
| `npm run preview` | Nitro preview server. For full CF runtime, use `npx wrangler pages dev dist`. |

---

## Troubleshooting

**Storyblok bridge doesn't update the component** — confirm (1) the URL has `?_storyblok=...` (the editor adds this), (2) the component is rendered through `useStory`, (3) each block template uses `v-editable="blok"`.

**`/api/story/<slug>` returns 500 `STORYBLOK_TOKEN is not configured`** — env var isn't set. Double-check Pages **Variables and Secrets** for both Production and Preview, and confirm you used the correct name for the type you chose (see step 5 of the deployment guide — Variables use the bare names, Secrets need the `NUXT_…` prefix).

**Bridge or `/api/story` works locally but 404s on Cloudflare Preview** — almost always a missing or misnamed Pages env var. The catch-all page (`app/pages/[...slug].vue`) converts any fetch failure into a 404, so the underlying error gets masked. Open DevTools → Network and check the `/api/story/<slug>` response body for the real cause.

**KV entries never expire** — they do (24h TTL, set in `server/utils/storyblok.ts`), but the publish webhook also deletes on demand. If webhook isn't firing, check Function logs and verify the `?secret=` query param matches `STORYBLOK_WEBHOOK_SECRET`.

**`Duplicated imports "useAppConfig"` warning** — harmless upstream noise from Nuxt 4 + Nitro. Ignore.
