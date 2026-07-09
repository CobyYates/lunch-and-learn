<script setup lang="ts">
import type { SlideBlok } from "~/composables/useSlideshow";

const props = defineProps<{
  blok: {
    columns?: string;
    items?: SlideBlok[];
  };
}>();

// Map the chosen column count to a Vuetify md col span (12-col grid).
const mdSpan = computed(
  () => ({ "2": 6, "3": 4, "4": 3 })[props.blok.columns ?? "3"] ?? 4,
);
</script>

<template>
  <v-theme-provider theme="dark" with-background>
    <section v-editable="blok" class="sb-features pa-6 pa-sm-8">
      <v-row>
        <v-col
          v-for="item in blok.items ?? []"
          :key="item._uid"
          cols="12"
          sm="6"
          :md="mdSpan"
        >
          <StoryblokComponent :blok="item" />
        </v-col>
      </v-row>
    </section>
  </v-theme-provider>
</template>
