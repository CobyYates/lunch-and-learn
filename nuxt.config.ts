import tailwindcss from "@tailwindcss/vite";
import vuetify, { transformAssetUrls } from "vite-plugin-vuetify";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",

  devtools: { enabled: true },

  ssr: false,

  future: {
    compatibilityVersion: 4,
  },

  modules: [
    "@nuxt/image",
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
    "vuetify/styles",
  ],

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
  },

  app: {
    head: {
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1" },
      ],
    },
  },
});
