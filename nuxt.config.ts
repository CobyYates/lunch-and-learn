import { existsSync } from "node:fs";
import tailwindcss from "@tailwindcss/vite";
import vuetify, { transformAssetUrls } from "vite-plugin-vuetify";

// Enable HTTPS in dev when mkcert-generated certs are present. Needed for
// Storyblok's visual-editor iframe (which requires HTTPS). Run `npm run
// setup:certs` once to generate them; falls back to HTTP if absent.
const certPath = "./localhost.pem";
const keyPath = "./localhost-key.pem";
const hasDevCerts = existsSync(certPath) && existsSync(keyPath);

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",

  devtools: { enabled: true },

  ssr: false,

  devServer: hasDevCerts
    ? { https: { key: keyPath, cert: certPath } }
    : undefined,

  future: {
    compatibilityVersion: 4,
  },

  modules: [
    "@nuxt/image",
    "@storyblok/nuxt",
    // Vuetify's official Nuxt install recipe. `vite-plugin-vuetify` must be
    // registered via `vite:extendConfig` so it sits *after* Nuxt's own Vite
    // plugins — registering it inline via `vite.plugins` can cause its
    // virtual-SCSS module resolver to get shadowed and component SASS files
    // start 404-ing.
    (_options, nuxt) => {
      nuxt.hooks.hook("vite:extendConfig", (config) => {
        // @ts-expect-error vite plugin types narrow stricter than Nuxt's forwarded type
        config.plugins.push(vuetify({ autoImport: true }));
      });
    },
  ],

  css: [
    "@mdi/font/css/materialdesignicons.css",
    "~/assets/styles/main.css",
    "~/assets/styles/slides.css",
    "vuetify/styles",
  ],

  storyblok: {
    // Client-side token. Must be the preview token so the visual-editor
    // bridge can read drafts; it also reads published content fine.
    accessToken: process.env.STORYBLOK_PREVIEW_TOKEN,
    bridge: true,
    apiOptions: {
      region: "eu",
    },
  },

  runtimeConfig: {
    storyblokPublicToken: process.env.STORYBLOK_PUBLIC_TOKEN,
    storyblokPreviewToken: process.env.STORYBLOK_PREVIEW_TOKEN,
    storyblokSpaceId: process.env.STORYBLOK_SPACE_ID,
    storyblokWebhookSecret: process.env.STORYBLOK_WEBHOOK_SECRET,
    public: {
      firebase: {
        apiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NUXT_PUBLIC_FIREBASE_APP_ID,
      },
    },
  },

  nitro: {
    preset: "cloudflare-pages",
    experimental: {
      openAPI: false,
    },
  },

  typescript: {
    tsConfig: {
      compilerOptions: {
        types: ["@cloudflare/workers-types"],
      },
    },
  },

  build: {
    transpile: ["vuetify"],
  },

  vite: {
    vue: {
      template: {
        transformAssetUrls,
      },
    },
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: [
        "@storyblok/vue",
        "@vue/devtools-core",
        "@vue/devtools-kit",
        "firebase/app",
        "firebase/auth",
        "firebase/firestore",
      ],
    },
  },

  app: {
    head: {
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1" },
      ],
      link: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossorigin: "",
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,800;1,9..144,400;1,9..144,600&family=Inter+Tight:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&family=Archivo+Black&family=Archivo:wght@400;600;800&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=Outfit:wght@300;400;500;700&family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@400;500;700&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600;700&family=Unbounded:wght@400;600;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Manrope:wght@400;500;600;700&family=Orbitron:wght@500;700;900&family=Rajdhani:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=Space+Grotesk:wght@400;500;600;700&family=Syne:wght@500;700;800&family=Geist+Mono:wght@400;500&display=swap",
        },
      ],
    },
  },
});
