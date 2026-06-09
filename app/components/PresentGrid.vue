<script setup lang="ts">
import type { SlideshowController } from "~/composables/useSlideshow";

const props = defineProps<{ ctl: SlideshowController }>();
const { slides, current, showGrid, goto } = props.ctl;

function jump(i: number) {
  goto(i);
  showGrid.value = false;
}
</script>

<template>
  <div class="present-grid" @click.self="showGrid = false">
    <div class="present-grid-inner">
      <button
        v-for="(slide, i) in slides"
        :key="slide._uid"
        type="button"
        class="grid-cell"
        :class="{ active: i === current }"
        @click="jump(i)"
      >
        <div class="grid-cell-frame">
          <StoryblokComponent :blok="slide" />
        </div>
        <span class="grid-cell-num">{{ i + 1 }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.present-grid {
  position: absolute;
  inset: 0;
  z-index: 6;
  background: rgba(0, 0, 0, 0.9);
  overflow: auto;
  padding: 3rem 2rem 5rem;
}
.present-grid-inner {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.2rem;
  max-width: 1400px;
  margin: 0 auto;
}
.grid-cell {
  position: relative;
  padding: 0;
  background: none;
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  overflow: hidden;
}
.grid-cell.active {
  border-color: #fff;
}
.grid-cell-frame {
  pointer-events: none;
}
.grid-cell-frame :deep(.slide) {
  cursor: default;
  border-radius: 6px;
}
.grid-cell-frame :deep(.slide:hover) {
  transform: none;
  box-shadow: none;
}
.grid-cell-num {
  position: absolute;
  top: 0.4rem;
  left: 0.4rem;
  display: grid;
  place-items: center;
  width: 1.6rem;
  height: 1.6rem;
  font: 600 0.8rem/1 system-ui, sans-serif;
  color: #fff;
  background: rgba(0, 0, 0, 0.65);
  border-radius: 50%;
}
</style>
