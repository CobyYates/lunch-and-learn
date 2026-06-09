<script setup lang="ts">
import type { SlideshowController } from "~/composables/useSlideshow";

const props = defineProps<{ ctl: SlideshowController }>();
const { showHelp } = props.ctl;

const shortcuts = [
  { keys: ["→", "Space", "PgDn"], label: "Next slide" },
  { keys: ["←", "PgUp"], label: "Previous slide" },
  { keys: ["Home"], label: "First slide" },
  { keys: ["End"], label: "Last slide" },
  { keys: ["F"], label: "Toggle fullscreen" },
  { keys: ["G"], label: "Overview grid" },
  { keys: ["?"], label: "Toggle this help" },
  { keys: ["Esc"], label: "Exit slideshow" },
];
</script>

<template>
  <div class="present-help" @click.self="showHelp = false">
    <div class="present-help-card">
      <h3>Keyboard shortcuts</h3>
      <dl>
        <div v-for="row in shortcuts" :key="row.label">
          <dt>
            <kbd v-for="k in row.keys" :key="k">{{ k }}</kbd>
          </dt>
          <dd>{{ row.label }}</dd>
        </div>
      </dl>
      <button type="button" class="help-close" @click="showHelp = false">
        Close
      </button>
    </div>
  </div>
</template>

<style scoped>
.present-help {
  position: absolute;
  inset: 0;
  z-index: 7;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.6);
}
.present-help-card {
  width: min(440px, 90vw);
  padding: 1.75rem;
  background: #161616;
  color: #eee;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  font-family: system-ui, sans-serif;
}
.present-help-card h3 {
  margin: 0 0 1rem;
  font-size: 1.1rem;
}
.present-help-card dl {
  margin: 0;
  display: grid;
  gap: 0.6rem;
}
.present-help-card dl > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.present-help-card dt {
  display: flex;
  gap: 0.3rem;
}
.present-help-card dd {
  margin: 0;
  color: #b9b9b9;
  font-size: 0.9rem;
}
.present-help-card kbd {
  font: 500 0.75rem/1 ui-monospace, monospace;
  padding: 0.3em 0.5em;
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 5px;
}
.help-close {
  margin-top: 1.25rem;
  width: 100%;
  padding: 0.6rem;
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 8px;
  cursor: pointer;
  font: 600 0.9rem/1 system-ui, sans-serif;
}
.help-close:hover {
  background: rgba(255, 255, 255, 0.18);
}
</style>
