export default defineNuxtRouteMiddleware((to) => {
  // Keep /home and / as the same URL: redirect /home → /, preserving query +
  // hash so the Storyblok bridge params survive the redirect.
  if (to.path === "/home") {
    return navigateTo({ path: "/", query: to.query, hash: to.hash });
  }
});
