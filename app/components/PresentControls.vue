<script setup lang="ts">
import type { SlideshowController } from "~/composables/useSlideshow";

const props = defineProps<{ ctl: SlideshowController }>();
const {
  current,
  total,
  isFullscreen,
  showGrid,
  showHelp,
  controlsVisible,
  first,
  prev,
  next,
  last,
  toggleFullscreen,
  stopPresenting,
} = props.ctl;
</script>

<template>
  <div class="present-controls" :class="{ hidden: !controlsVisible }">
    <button type="button" title="First slide (Home)" @click="first">
      <v-icon icon="mdi-page-first" size="22" />
    </button>
    <button type="button" title="Previous (←)" @click="prev">
      <v-icon icon="mdi-chevron-left" size="26" />
    </button>

    <span class="counter">{{ current + 1 }} / {{ total }}</span>

    <button type="button" title="Next (→ / Space)" @click="next">
      <v-icon icon="mdi-chevron-right" size="26" />
    </button>
    <button type="button" title="Last slide (End)" @click="last">
      <v-icon icon="mdi-page-last" size="22" />
    </button>

    <span class="ctrl-sep" />

    <button type="button" title="Overview (G)" @click="showGrid = !showGrid">
      <v-icon icon="mdi-view-grid-outline" size="22" />
    </button>
    <button
      type="button"
      :title="isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'"
      @click="toggleFullscreen"
    >
      <v-icon
        :icon="isFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'"
        size="24"
      />
    </button>
    <button type="button" title="Shortcuts (?)" @click="showHelp = !showHelp">
      <v-icon icon="mdi-help-circle-outline" size="22" />
    </button>
    <button type="button" title="Exit (Esc)" @click="stopPresenting">
      <v-icon icon="mdi-close" size="22" />
    </button>
  </div>
</template>

<style scoped>
.present-controls {
  position: absolute;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.4rem 0.6rem;
  background: rgba(20, 20, 20, 0.85);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  z-index: 4;
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.present-controls.hidden {
  opacity: 0;
  transform: translateX(-50%) translateY(0.5rem);
  pointer-events: none;
}
.present-controls button {
  display: grid;
  place-items: center;
  width: 2.2rem;
  height: 2.2rem;
  color: #fff;
  background: transparent;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.15s ease;
}
.present-controls button:hover {
  background: rgba(255, 255, 255, 0.15);
}
.counter {
  min-width: 4.5rem;
  text-align: center;
  font: 600 0.85rem/1 system-ui, sans-serif;
  color: #fff;
  font-variant-numeric: tabular-nums;
}
.ctrl-sep {
  width: 1px;
  height: 1.4rem;
  margin: 0 0.3rem;
  background: rgba(255, 255, 255, 0.18);
}
</style>
