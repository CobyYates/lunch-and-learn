<script setup lang="ts">
import type { SlideBlok } from "~/composables/useSlideshow";

const props = defineProps<{
  blok: {
    title?: string;
    theme?: string; // one of the THEMES keys in useThemes
    image?: { filename?: string; alt?: string };
    Slides?: SlideBlok[]; // existing Storyblok field name (capital S)
    requireAuthentication?: boolean; // gate viewing behind login + approval
  };
}>();

const slides = computed<SlideBlok[]>(() => props.blok.Slides ?? []);
const theme = computed(() => props.blok.theme || "atelier");
const ctl = useSlideshow(slides);
</script>

<template>
  <div v-editable="blok" class="slideshow" :data-theme="theme">
    <SlideshowGate :required="blok.requireAuthentication">
      <SlideshowOverview :ctl="ctl" />
      <PresentationView :ctl="ctl" :theme="theme" />
    </SlideshowGate>
  </div>
</template>
