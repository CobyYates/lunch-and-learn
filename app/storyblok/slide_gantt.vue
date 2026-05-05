<script setup lang="ts">
interface GanttTask {
  _uid: string;
  title: string;
  owner?: string;
  start_pct: number | string;
  duration_pct: number | string;
  color?: "accent" | "alt" | "muted";
  progress_pct?: number | string;
  bar_label?: string;
}

const props = defineProps<{
  blok: {
    eyebrow?: string;
    title?: string;
    months?: string; // one per line
    today_pct?: number | string;
    legend_design_label?: string;
    legend_engineering_label?: string;
    legend_risk_label?: string;
    tasks?: GanttTask[];
    repo_url?: string;
  };
}>();

const monthList = computed(() =>
  (props.blok.months ?? "")
    .split("\n")
    .map((m) => m.trim())
    .filter(Boolean),
);

const todayPct = computed(() => {
  const v = Number(props.blok.today_pct);
  return Number.isFinite(v) ? v : null;
});

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function barClass(t: GanttTask): string {
  const parts = [];
  if (t.color === "alt") parts.push("alt");
  else if (t.color === "muted") parts.push("muted");
  if (t.progress_pct != null && t.progress_pct !== "") parts.push("progress");
  return parts.join(" ");
}

function barStyle(t: GanttTask): Record<string, string> {
  const style: Record<string, string> = {
    left: `${num(t.start_pct)}%`,
    width: `${num(t.duration_pct)}%`,
  };
  if (t.progress_pct != null && t.progress_pct !== "") {
    style["--p"] = `${num(t.progress_pct)}%`;
  }
  return style;
}
</script>

<template>
  <div v-editable="blok" class="slide layout-gantt">
    <div class="slide-inner">
      <div class="head">
        <div>
          <div v-if="blok.eyebrow" class="eyebrow">{{ blok.eyebrow }}</div>
          <h3 v-if="blok.title">{{ blok.title }}</h3>
        </div>
        <div class="legend">
          <span><i />{{ blok.legend_design_label || "Design" }}</span>
          <span><i class="alt" />{{ blok.legend_engineering_label || "Engineering" }}</span>
          <span><i class="muted" />{{ blok.legend_risk_label || "At risk" }}</span>
        </div>
      </div>
      <div
        class="chart"
        :style="`--cols: ${monthList.length || 8}`"
      >
        <div
          class="gantt-months"
          :style="`grid-template-columns: repeat(${monthList.length || 8}, 1fr)`"
        >
          <span v-for="m in monthList" :key="m">{{ m }}</span>
        </div>

        <template v-for="t in blok.tasks ?? []" :key="t._uid">
          <div class="gantt-task-label">
            {{ t.title }}
            <span v-if="t.owner" class="owner">{{ t.owner }}</span>
          </div>
          <div class="gantt-track">
            <div class="bar" :class="barClass(t)" :style="barStyle(t)">
              {{ t.bar_label }}
            </div>
            <div
              v-if="todayPct != null"
              class="today-line"
              :style="`left: ${todayPct}%`"
            />
          </div>
        </template>
      </div>
    </div>
    <SlideMark :url="blok.repo_url" />
  </div>
</template>
