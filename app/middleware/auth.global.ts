export default defineNuxtRouteMiddleware((to) => {
  // Bypass auth for the Storyblok visual-editor iframe so content editing
  // still works. The editor always appends a `_storyblok` query param.
  if (to.query._storyblok) return;

  // Client-only guard — auth state is not available on the server.
  if (import.meta.server) return;

  const { isConfigured, isSignedIn } = useAuth();

  // If Firebase isn't configured, funnel everyone to /login — that page
  // doubles as the setup-instructions screen.
  if (!isConfigured.value) {
    if (to.path !== "/login") return navigateTo("/login");
    return;
  }

  if (!isSignedIn.value && to.path !== "/login") {
    return navigateTo("/login");
  }

  if (isSignedIn.value && to.path === "/login") {
    return navigateTo("/");
  }
});
