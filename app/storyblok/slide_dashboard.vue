<script setup lang="ts">
interface DashboardMetric {
  _uid: string;
  label: string;
  value: string;
  delta?: string;
  sparkline?: string; // comma-separated numbers
  accent?: boolean;
}

const props = defineProps<{
  blok: {
    eyebrow?: string;
    title?: string;
    metrics?: DashboardMetric[];
    repo_url?: string;
  };
}>();

// Build a sparkline SVG path from a comma-separated value list. The viewBox
// (0..100 × 0..30) matches the CSS that styles .spark elements, and the
// y-axis is inverted so higher values map to a higher (smaller y) point.
function sparkPath(raw?: string): string {
  if (!raw) return "";
  const nums = raw
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n));
  if (nums.length < 2) return "";
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const span = max - min || 1;
  const stepX = 100 / (nums.length - 1);
  return nums
    .map((n, i) => {
      const x = Math.round(i * stepX);
      const y = Math.round(25 - ((n - min) / span) * 20);
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");
}

const sparklines = computed(() =>
  (props.blok.metrics ?? []).map((m) => sparkPath(m.sparkline)),
);

function deltaDirection(delta?: string): "up" | "down" | "" {
  if (!delta) return "";
  if (delta.startsWith("↑")) return "up";
  if (delta.startsWith("↓")) return "down";
  return "";
}
</script>

<template>
  <div v-editable="blok" class="slide layout-dashboard">
    <div class="slide-inner">
      <div class="head">
        <div>
          <div v-if="blok.eyebrow" class="eyebrow">{{ blok.eyebrow }}</div>
          <h3 v-if="blok.title">{{ blok.title }}</h3>
        </div>
      </div>
      <div class="metrics">
        <div
          v-for="(m, i) in blok.metrics ?? []"
          :key="m._uid"
          class="metric"
          :class="{ accent: m.accent }"
        >
          <span class="lbl">{{ m.label }}</span>
          <span class="val">{{ m.value }}</span>
          <span v-if="m.delta" class="change" :class="deltaDirection(m.delta)">
            {{ m.delta }}
          </span>
          <svg
            v-if="sparklines[i]"
            class="spark"
            viewBox="0 0 100 30"
            preserveAspectRatio="none"
          >
            <path
              :d="sparklines[i]"
              stroke="currentColor"
              fill="none"
              stroke-width="2"
              stroke-linejoin="round"
              stroke-linecap="round"
            />
          </svg>
        </div>
      </div>
    </div>
    <SlideMark :url="blok.repo_url" />
</div>
</template>
