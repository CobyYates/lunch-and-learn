import vuetify, { transformAssetUrls } from "vite-plugin-vuetify";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",

  devtools: { enabled: true },

  ssr: false,

  future: {
    compatibilityVersion: 4,
  },

  modules: ["@nuxt/image", "@storyblok/nuxt"],

  css: ["@mdi/font/css/materialdesignicons.css", "~/assets/styles/main.scss"],

  storyblok: {
    accessToken: process.env.STORYBLOK_TOKEN,
    bridge: true,
    apiOptions: {
      region: "us",
    },
  },

  runtimeConfig: {
    storyblokPreviewToken: process.env.STORYBLOK_TOKEN,
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
    plugins: [
      vuetify({
        autoImport: true,
        styles: { configFile: "assets/styles/settings.scss" },
      }),
    ],
    optimizeDeps: {
      include: ["@storyblok/vue", "@vue/devtools-core", "@vue/devtools-kit"],
    },
  },

  app: {
    head: {
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1" },
      ],
    },
  },
});
