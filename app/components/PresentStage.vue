<script setup lang="ts">
import type { SlideshowController } from "~/composables/useSlideshow";

const props = defineProps<{ ctl: SlideshowController }>();
const { current, currentSlide, transitionName, next, prev } = props.ctl;
</script>

<template>
  <div class="present-stage" @click="next">
    <Transition :name="transitionName" mode="out-in">
      <div :key="current" class="present-frame">
        <StoryblokComponent v-if="currentSlide" :blok="currentSlide" />
      </div>
    </Transition>

    <!-- invisible edge click zones for mouse navigation -->
    <button
      class="edge edge-prev"
      type="button"
      aria-label="Previous slide"
      @click.stop="prev"
    />
    <button
      class="edge edge-next"
      type="button"
      aria-label="Next slide"
      @click.stop="next"
    />
  </div>
</template>

<style scoped>
.present-stage {
  width: 100vw;
  height: 100vh;
  display: grid;
  place-items: center;
  cursor: pointer;
}
.present-frame {
  /* keep 16:9 while filling as much of the viewport as possible */
  width: min(100vw, calc(100vh * 16 / 9));
  height: min(100vh, calc(100vw * 9 / 16));
}
/* neutralise the overview hover/click affordances inside present mode */
.present-frame :deep(.slide) {
  width: 100%;
  height: 100%;
  cursor: default;
  border-radius: 0;
}
.present-frame :deep(.slide:hover) {
  transform: none;
  box-shadow: none;
}

.edge {
  position: absolute;
  top: 0;
  bottom: 60px;
  width: 18%;
  border: none;
  background: transparent;
  cursor: pointer;
  z-index: 2;
}
.edge-prev {
  left: 0;
}
.edge-next {
  right: 0;
}

/* slide transitions */
.slide-next-enter-active,
.slide-next-leave-active,
.slide-prev-enter-active,
.slide-prev-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.slide-next-enter-from {
  opacity: 0;
  transform: translateX(3%);
}
.slide-next-leave-to {
  opacity: 0;
  transform: translateX(-3%);
}
.slide-prev-enter-from {
  opacity: 0;
  transform: translateX(-3%);
}
.slide-prev-leave-to {
  opacity: 0;
  transform: translateX(3%);
}
</style>
