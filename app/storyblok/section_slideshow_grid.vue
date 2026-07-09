<script setup lang="ts">
import SlideshowCard from "~/storyblok/slideshow_card.vue";

const props = defineProps<{
  blok: {
    title?: string;
    subtitle?: string;
    // Reference field: an array of slideshow story UUIDs.
    slideshows?: string[];
  };
}>();

// Pull every slideshow so we can resolve the referenced UUIDs to real stories
// (title, slide count, timestamps, thumbnail). Cheap — there are only a handful.
const { stories } = await useStories({
  starts_with: "slide-shows/",
  content_type: "slideshow",
});

// Thumbnail tints cycled by position, since a reference doesn't carry one.
const ACCENTS = ["lavender", "mint", "peach", "sky", "butter", "rose"];

function timeAgo(iso?: string | null): string {
  if (!iso) return "";
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)} minute${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  const weeks = Math.round(days / 7);
  if (weeks < 5) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.round(days / 365);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

const cards = computed(() => {
  // Storyblok stores an internal-stories reference as a uuid (default) or a
  // full_slug, so index by both to resolve either shape.
  const byRef = new Map();
  for (const s of stories.value) {
    byRef.set(s.uuid, s);
    byRef.set(s.full_slug, s);
  }
  // Preserve the author-defined order; drop any dangling references. When no
  // references are set, fall back to showing every slideshow.
  const refs = props.blok.slideshows ?? [];
  const list = refs.length
    ? refs.map((ref) => byRef.get(ref)).filter(Boolean)
    : stories.value;

  return (list as typeof stories.value).map((s, i) => {
    const content = (s.content ?? {}) as Record<string, any>;
    return {
      key: s.uuid,
      title: (content.title as string) || s.name,
      slidesCount: Array.isArray(content.Slides) ? content.Slides.length : 0,
      created: timeAgo(s.created_at),
      edited: timeAgo(s.published_at || s.updated_at),
      url: `/${s.full_slug}`,
      image: content.image?.filename || "",
      accent: ACCENTS[i % ACCENTS.length],
    };
  });
});
</script>

<template>
  <v-theme-provider theme="dark" with-background>
    <section v-editable="blok" class="sb-slideshow-grid pa-6 pa-sm-8">
      <div v-if="blok.title || blok.subtitle" class="mb-6">
        <h2 v-if="blok.title" class="text-h5 text-md-h4 font-weight-bold">
          {{ blok.title }}
        </h2>
        <p v-if="blok.subtitle" class="text-body-2 text-medium-emphasis mt-1 mb-0">
          {{ blok.subtitle }}
        </p>
      </div>

      <v-row>
        <v-col v-for="card in cards" :key="card.key" cols="12" sm="6" md="4">
          <SlideshowCard v-bind="card" />
        </v-col>
      </v-row>
    </section>
  </v-theme-provider>
</template>
