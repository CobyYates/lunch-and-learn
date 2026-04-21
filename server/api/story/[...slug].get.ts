export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug") ?? "home";
  const { storyblokPreviewToken } = useRuntimeConfig(event);

  if (!storyblokPreviewToken) {
    throw createError({
      statusCode: 500,
      statusMessage: "STORYBLOK_TOKEN is not configured",
    });
  }

  return getStoryCached(event, slug, storyblokPreviewToken);
});
