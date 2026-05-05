<script setup lang="ts">
interface ScorecardKpi {
  _uid: string;
  label: string;
  value: string;
  value_suffix?: string;
  delta?: string;
  delta_dir?: "up" | "down" | "flat";
  bar_pct?: number | string;
  alt?: boolean;
}

const props = defineProps<{
  blok: {
    eyebrow?: string;
    title?: string;
    period_label?: string;
    hero_label?: string;
    hero_number?: string;
    hero_unit?: string;
    hero_delta?: string;
    hero_delta_dir?: "up" | "down";
    hero_trend?: string;
    hero_desc?: string;
    kpis?: ScorecardKpi[];
    repo_url?: string;
  };
}>();

// Build the trend SVG from comma-separated y-coords (range 0..24, lower = up).
const trendPaths = computed(() => {
  const nums = (props.blok.hero_trend ?? "")
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n));
  if (nums.length < 2) return null;
  const stepX = 100 / (nums.length - 1);
  const lineCmds = nums
    .map((y, i) => `${i === 0 ? "M" : "L"}${(i * stepX).toFixed(2)},${y}`)
    .join(" ");
  const fillCmds = `${lineCmds} L100,24 L0,24 Z`;
  return { line: lineCmds, fill: fillCmds };
});

function kpiBarStyle(kpi: ScorecardKpi): string {
  const v = Math.max(0, Math.min(100, Number(kpi.bar_pct) || 0));
  return `width: ${v}%`;
}
</script>

<template>
  <div v-editable="blok" class="slide layout-scorecard">
    <div class="slide-inner">
      <div class="head">
        <div>
          <div v-if="blok.eyebrow" class="eyebrow">{{ blok.eyebrow }}</div>
          <h3 v-if="blok.title">{{ blok.title }}</h3>
        </div>
        <span v-if="blok.period_label" class="period">{{ blok.period_label }}</span>
      </div>
      <div class="grid">
        <div class="hero">
          <span v-if="blok.hero_label" class="lbl">{{ blok.hero_label }}</span>
          <div class="num">
            {{ blok.hero_number }}<span v-if="blok.hero_unit" class="unit">{{ blok.hero_unit }}</span>
          </div>
          <span
            v-if="blok.hero_delta"
            class="delta"
            :class="{ down: blok.hero_delta_dir === 'down' }"
          >
            {{ blok.hero_delta }}
          </span>
          <svg
            v-if="trendPaths"
            class="trend"
            viewBox="0 0 100 24"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient :id="`sc-grad-${blok.hero_label}`" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stop-color="currentColor" stop-opacity="0.4" />
                <stop offset="100%" stop-color="currentColor" stop-opacity="0" />
              </linearGradient>
            </defs>
            <path :d="trendPaths.fill" :fill="`url(#sc-grad-${blok.hero_label})`" />
            <path
              :d="trendPaths.line"
              stroke="currentColor"
              stroke-width="1.5"
              fill="none"
              stroke-linejoin="round"
              stroke-linecap="round"
            />
          </svg>
          <p v-if="blok.hero_desc" class="desc" v-html="blok.hero_desc" />
        </div>
        <div
          v-for="kpi in blok.kpis ?? []"
          :key="kpi._uid"
          class="kpi"
          :class="{ alt: kpi.alt }"
        >
          <span class="lbl">{{ kpi.label }}</span>
          <div class="row">
            <span class="v">
              {{ kpi.value
              }}<span v-if="kpi.value_suffix" style="font-size: 0.5em; color: var(--fg-muted);">
                {{ kpi.value_suffix }}
              </span>
            </span>
            <span v-if="kpi.delta" class="d" :class="kpi.delta_dir || 'up'">
              {{ kpi.delta }}
            </span>
          </div>
          <div class="bar"><i :style="kpiBarStyle(kpi)" /></div>
        </div>
      </div>
    </div>
    <SlideMark :url="blok.repo_url" />
  </div>
</template>
