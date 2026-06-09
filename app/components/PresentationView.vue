<script setup lang="ts">
import type { SlideshowController } from "~/composables/useSlideshow";

const props = defineProps<{ ctl: SlideshowController; theme: string }>();
const { presenting, showGrid, showHelp, progressPct, stageEl, bumpControls } =
  props.ctl;
</script>

<template>
  <Teleport to="body">
    <div
      v-if="presenting"
      ref="stageEl"
      class="present-overlay"
      :data-theme="theme"
      tabindex="-1"
      @mousemove="bumpControls"
    >
      <div class="present-progress">
        <div class="present-progress-fill" :style="{ width: progressPct + '%' }" />
      </div>

      <PresentStage :ctl="ctl" />
      <PresentGrid v-if="showGrid" :ctl="ctl" />
      <PresentHelp v-if="showHelp" :ctl="ctl" />
      <PresentControls :ctl="ctl" />
    </div>
  </Teleport>
</template>

<style scoped>
.present-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: #000;
  display: grid;
  place-items: center;
  outline: none;
}
.present-progress {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(255, 255, 255, 0.12);
  z-index: 3;
}
.present-progress-fill {
  height: 100%;
  background: #fff;
  transition: width 0.3s ease;
}
</style>
