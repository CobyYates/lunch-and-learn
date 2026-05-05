<template>
  <div
    v-editable="blok"
    class="slideshow"
    :data-theme="blok.theme || 'atelier'"
  >
    <div class="slides-stack">
      <StoryblokComponent
        v-for="slide in blok.Slides ?? []"
        :key="slide._uid"
        :blok="slide"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
interface SlideBlok {
  _uid: string;
  component: string;
  [k: string]: unknown;
}

defineProps<{
  blok: {
    title?: string;
    theme?: string; // one of the THEMES keys in useThemes
    image?: { filename?: string; alt?: string };
    Slides?: SlideBlok[]; // existing Storyblok field name (capital S)
  };
}>();
</script>

<style scoped>
.slideshow {
  display: block;
  /*
   * Inherit slide styling from ~/assets/styles/slides.css, scoped under the
   * data-theme attribute set above. Each child slide component renders the
   * exact markup that file's selectors target.
   */
}
.slides-stack {
  display: grid;
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 1rem;
}
</style>
