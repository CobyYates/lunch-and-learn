/**
 * Fetch a Storyblok story.
 *
 * - In the Storyblok visual editor (bridge): fetches `draft` directly from
 *   Storyblok and subscribes to bridge events for live updates.
 * - Everywhere else: hits our /api/story route, which is KV-cached.
 *
 * If `slugOverride` is omitted, the slug is derived from the current route
 * (`route.params.slug`, joined with `/`). A root request (`/`) maps to `home`.
 */
export async function useStory(slugOverride?: string) {
  const route = useRoute();

  const slug = computed(() => {
    if (slugOverride) return slugOverride;
    const raw = route.params.slug;
    const joined = Array.isArray(raw) ? raw.join("/") : (raw as string) ?? "";
    return joined || "home";
  });

  const isPreview = Boolean(route.query._storyblok);

  if (isPreview) {
    const storyblokApi = useStoryblokApi();
    const story = ref<any>(null);

    const load = async () => {
      try {
        const { data } = await storyblokApi.get(`cdn/stories/${slug.value}`, {
          version: "draft",
        });
        story.value = data.story;

        if (import.meta.client && story.value?.id) {
          useStoryblokBridge(story.value.id, (evStory) => {
            story.value = evStory;
          });
        }
      } catch (err) {
        console.error(
          `[useStory] Storyblok draft fetch failed for slug "${slug.value}":`,
          err,
        );
        story.value = null;
      }
    };

    await load();
    watch(slug, load);
    return story;
  }

  const { data, error } = await useFetch(() => `/api/story/${slug.value}`, {
    key: "story",
    watch: [slug],
  });

  if (error.value) {
    console.error(
      `[useStory] /api/story/${slug.value} failed:`,
      error.value,
    );
  }

  return computed(
    () => (data.value as { story?: unknown } | null)?.story ?? null,
  );
}
