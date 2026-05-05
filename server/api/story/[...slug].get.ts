export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug") ?? "home";
  const { storyblokPublicToken } = useRuntimeConfig(event);

  if (!storyblokPublicToken) {
    throw createError({
      statusCode: 500,
      statusMessage: "STORYBLOK_PUBLIC_TOKEN is not configured",
    });
  }

  return getStoryCached(event, slug, storyblokPublicToken);
});
