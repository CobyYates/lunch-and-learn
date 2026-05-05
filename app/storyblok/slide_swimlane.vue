<script setup lang="ts">
interface SwimlaneStep {
  _uid: string;
  number_label?: string;
  label: string;
  kind?: "default" | "primary" | "alt" | "decision";
}

interface SwimlaneLane {
  _uid: string;
  icon?: string;
  label: string;
  kind?: "primary" | "alt" | "neutral";
  lead_spacer?: number | string;
  steps?: SwimlaneStep[];
}

defineProps<{
  blok: {
    eyebrow?: string;
    title?: string;
    lanes?: SwimlaneLane[];
    repo_url?: string;
  };
}>();

function laneLabelClass(kind?: string): string {
  if (kind === "alt") return "alt";
  if (kind === "neutral") return "neutral";
  return "";
}

function stepClass(kind?: string): string {
  if (kind === "primary") return "primary";
  if (kind === "alt") return "alt";
  if (kind === "decision") return "decision";
  return "";
}
</script>

<template>
  <div v-editable="blok" class="slide layout-swimlane">
    <div class="slide-inner">
      <div class="head">
        <div>
          <div v-if="blok.eyebrow" class="eyebrow">{{ blok.eyebrow }}</div>
          <h3 v-if="blok.title">{{ blok.title }}</h3>
        </div>
      </div>
      <div class="lanes">
        <template v-for="lane in blok.lanes ?? []" :key="lane._uid">
          <div class="lane-label" :class="laneLabelClass(lane.kind)">
            <span class="icon">{{ lane.icon || (lane.label?.[0] ?? "") }}</span>
            {{ lane.label }}
          </div>
          <div class="lane">
            <span
              v-if="Number(lane.lead_spacer) > 0"
              class="spacer"
              :style="`flex: ${Number(lane.lead_spacer)}`"
            />
            <template v-for="(step, i) in lane.steps ?? []" :key="step._uid">
              <div class="step" :class="stepClass(step.kind)">
                <span v-if="step.number_label" class="num">{{ step.number_label }}</span>
                {{ step.label }}
              </div>
              <span v-if="i < (lane.steps?.length ?? 0) - 1" class="arrow">→</span>
            </template>
            <span class="spacer" />
          </div>
        </template>
      </div>
    </div>
    <SlideMark :url="blok.repo_url" />
  </div>
</template>
