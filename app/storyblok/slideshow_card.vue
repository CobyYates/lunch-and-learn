<script setup lang="ts">
/**
 * Presentational card for a single slideshow. Not authored directly in
 * Storyblok — `section_slideshow_grid` resolves its referenced slideshow
 * stories and renders one of these per deck.
 */
defineProps<{
  title: string;
  slidesCount?: number;
  created?: string;
  edited?: string;
  url?: string;
  image?: string;
  accent?: string;
}>();
</script>

<template>
  <v-card
    class="h-100 d-flex flex-column"
    :href="url || undefined"
    :link="!!url"
    border
    flat
    rounded="lg"
  >
    <v-responsive
      class="sb-slideshow-card__thumb"
      :data-accent="accent || 'lavender'"
      :aspect-ratio="16 / 9"
    >
      <v-img v-if="image" :src="image" :aspect-ratio="16 / 9" cover />
      <div v-else class="d-flex align-center justify-center fill-height">
        <v-icon icon="mdi-play-box-outline" size="36" />
      </div>
    </v-responsive>

    <v-card-item>
      <v-card-title class="text-subtitle-1 font-weight-bold">
        {{ title }}
      </v-card-title>
      <div
        v-if="slidesCount"
        class="text-body-2 text-medium-emphasis mt-1"
      >
        {{ slidesCount }} {{ slidesCount === 1 ? "slide" : "slides" }}
      </div>
      <client-only>
        <div v-if="created" class="text-caption text-medium-emphasis mt-2 d-flex align-center ga-1">
          <v-icon icon="mdi-calendar-blank-outline" size="14" />
          Created {{ created }}
        </div>
        <div v-if="edited" class="text-caption text-medium-emphasis mt-1 d-flex align-center ga-1">
          <v-icon icon="mdi-clock-outline" size="14" />
          Edited {{ edited }}
        </div>
      </client-only>
    </v-card-item>

    <v-card-actions v-if="url" class="px-4 pb-4 mt-auto">
      <span class="sb-accent text-body-2 font-weight-medium d-flex align-center ga-1">
        <v-icon icon="mdi-arrow-right" size="16" /> Open
      </span>
    </v-card-actions>
  </v-card>
</template>
