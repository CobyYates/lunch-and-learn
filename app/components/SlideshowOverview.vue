<script setup lang="ts">
import type { SlideshowController } from "~/composables/useSlideshow";

const props = defineProps<{ ctl: SlideshowController }>();
const { slides, total, startPresenting } = props.ctl;
</script>

<template>
  <div class="slides-stack">
    <button
      v-if="total"
      class="present-cta"
      type="button"
      @click="startPresenting(0)"
    >
      <v-icon icon="mdi-play" size="20" />
      Start slideshow
      <kbd>{{ total }} slides</kbd>
    </button>

    <div
      v-for="(slide, i) in slides"
      :key="slide._uid"
      class="stack-item"
      role="button"
      :title="`Present from slide ${i + 1}`"
      @click="startPresenting(i)"
    >
      <span class="stack-num">{{ i + 1 }}</span>
      <StoryblokComponent :blok="slide" />
    </div>
  </div>
</template>

<style scoped>
.slides-stack {
  display: grid;
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.present-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  align-self: start;
  padding: 0.7rem 1.2rem;
  font: 600 1rem/1 system-ui, sans-serif;
  color: #fff;
  background: #111;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.15s ease, opacity 0.15s ease;
}
.present-cta:hover {
  transform: translateY(-1px);
  opacity: 0.9;
}
.present-cta kbd {
  font: 500 0.72rem/1 ui-monospace, monospace;
  padding: 0.25em 0.5em;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.18);
}

.stack-item {
  position: relative;
}
.stack-num {
  position: absolute;
  top: -0.6rem;
  left: -0.6rem;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 1.8rem;
  height: 1.8rem;
  font: 600 0.85rem/1 system-ui, sans-serif;
  color: #fff;
  background: #111;
  border-radius: 50%;
  pointer-events: none;
}
</style>
