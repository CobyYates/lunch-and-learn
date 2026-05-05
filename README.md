# lunch-and-learn

A minimal **Nuxt 4** starter, pre-wired for **Cloudflare Pages** deployment with **Vuetify** components and **Tailwind** utilities ready to use.

This is the bare base of the project. Feature work (CMS integration, slides, etc.) lives on branches off `main`.

## Stack

| Piece | What it does |
| --- | --- |
| **Nuxt 4** | App framework. SPA mode (`ssr: false`) — pages render in the browser. |
| **Vuetify 3** | UI component library, auto-imported via `vite-plugin-vuetify`. |
| **Tailwind CSS 4** | Utility classes, layered under Vuetify so the two coexist (see `app/assets/styles/main.css`). |
| **Cloudflare Pages** | Hosting. Static assets + any `server/api/*` routes deploy as Pages Functions. |

---

## Prerequisites

- **Node.js 22** — install via [nvm](https://github.com/nvm-sh/nvm): `nvm install 22`. `.nvmrc` already pins this.
- **npm** (comes with Node).
- A **Cloudflare** account (free Pages plan works) for deployment.

---

## Local setup

### 1. Clone + install

```bash
git clone <your-repo-url> lunch-and-learn
cd lunch-and-learn
nvm use
npm install
```

### 2. Run the dev server

```bash
npm run dev
```

App runs at http://localhost:3000.

### 3. (Optional) Run against the real Cloudflare runtime locally

Use this when you want to test Pages Functions behavior before deploying:

```bash
npm run build
npx wrangler pages dev dist
```

Requires `wrangler login` once.

---

## Cloudflare Pages deployment

### 1. Push the repo to GitHub

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

Click **Save and Deploy**.

### 4. Environment variables (when needed)

`main` itself has no required env vars. If a feature branch adds them (API tokens, secrets), add them in the Pages dashboard under **Settings → Variables and Secrets** as **Secrets** for both Production and Preview.

> Because `wrangler.toml` exists in the repo, Cloudflare locks plaintext-var management to that file and only allows Secrets in the dashboard. That keeps the repo free of deployment-specific values so forks can wire their own.

---

## Project structure

```
.
├── app/
│   ├── app.vue                    # Root component (v-app + NuxtPage)
│   ├── assets/styles/
│   │   └── main.css               # Tailwind + Vuetify cascade layer setup
│   ├── pages/
│   │   └── index.vue              # Landing page placeholder
│   └── plugins/
│       └── vuetify.ts             # Vuetify + theme setup
├── public/
│   ├── favicon.ico
│   └── robots.txt
├── .env.example                   # Template for .env (none required on main)
├── .nvmrc                         # Node 22
├── nuxt.config.ts
├── wrangler.toml                  # Cloudflare Pages config
└── package.json
```

---

## How Vuetify and Tailwind coexist

Both ship CSS resets and utility-style rules. To stop them from fighting, `app/assets/styles/main.css` declares an explicit cascade layer order:

```
tailwind-theme  →  vuetify  →  tailwind-utilities  →  unlayered
```

Tailwind's `preflight` (its global reset) is intentionally skipped by importing `tailwindcss/theme.css` and `tailwindcss/utilities.css` directly instead of `tailwindcss`. If you ever want the reset back, swap the two imports for a single `@import "tailwindcss";`.

---

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Nuxt dev server at http://localhost:3000 |
| `npm run build` | Cloudflare-Pages-ready build — outputs `dist/` with `_worker.js` |
| `npm run generate` | Pure static output — **no Functions, API routes won't work**. Only use for a fully-static fallback. |
| `npm run preview` | Nitro preview server. For the full CF runtime locally, use `npx wrangler pages dev dist`. |

---

## Troubleshooting

**`Duplicated imports "useAppConfig"` warning** — harmless upstream noise from Nuxt 4 + Nitro. Ignore.
