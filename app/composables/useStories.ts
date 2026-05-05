/**
 * Fetch a list of Storyblok stories filtered by folder (`starts_with`) and
 * optionally by content-type. Uses `draft` when inside the visual editor,
 * `published` otherwise.
 */
export interface StoryblokStoryListItem {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  full_slug: string;
  content_type?: string;
  content: Record<string, unknown>;
  first_published_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function useStories(options: {
  starts_with: string;
  content_type?: string;
  per_page?: number;
}) {
  const storyblokApi = useStoryblokApi();
  const route = useRoute();
  const isPreview = Boolean(route.query._storyblok);

  const stories = ref<StoryblokStoryListItem[]>([]);
  const error = ref<unknown>(null);
  const pending = ref(true);

  const load = async () => {
    pending.value = true;
    try {
      const { data } = await storyblokApi.get("cdn/stories", {
        starts_with: options.starts_with,
        content_type: options.content_type,
        per_page: options.per_page ?? 100,
        version: isPreview ? "draft" : "published",
      });
      stories.value = (data.stories ?? []) as StoryblokStoryListItem[];
      error.value = null;
    } catch (err) {
      console.error(
        `[useStories] fetch failed for starts_with="${options.starts_with}":`,
        err,
      );
      error.value = err;
      stories.value = [];
    } finally {
      pending.value = false;
    }
  };

  await load();

  return { stories, pending, error, refresh: load };
}
