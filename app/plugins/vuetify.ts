import { createVuetify } from "vuetify";

// `vite-plugin-vuetify` (in `nuxt.config.ts`) handles component + directive
// auto-import at build time. This plugin only has to wire up the runtime
// `createVuetify` call so theme and global config are applied.
export default defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify({
    ssr: false,
    theme: {
      defaultTheme: "light",
    },
  });
  nuxtApp.vueApp.use(vuetify);
});
