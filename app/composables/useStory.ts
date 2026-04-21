import { useStoryblokApi, useStoryblokBridge } from "@storyblok/nuxt";

/**
 * Fetch a Storyblok story.
 *
 * - In the Storyblok visual editor (bridge): fetches `draft` directly from
 *   Storyblok and subscribes to bridge events for live updates.
 * - Everywhere else: hits our /api/story route, which is KV-cached.
 */
export async function useStory(slug: string) {
  const route = useRoute();
  const isPreview = Boolean(route.query._storyblok);

  if (isPreview) {
    const storyblokApi = useStoryblokApi();
    const { data } = await storyblokApi.get(`cdn/stories/${slug}`, {
      version: "draft",
    });
    const story = ref(data.story);

    if (import.meta.client) {
      useStoryblokBridge(story.value.id, (evStory) => {
        story.value = evStory;
      });
    }

    return story;
  }

  const { data } = await useFetch(`/api/story/${slug}`, {
    key: `story:${slug}`,
  });
  return computed(() => (data.value as { story?: unknown } | null)?.story);
}
