import { createVuetify } from "vuetify";

export default defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify({
    ssr: false,
    theme: {
      defaultTheme: "light",
    },
  });
  nuxtApp.vueApp.use(vuetify);
});
