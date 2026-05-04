<script setup lang="ts">
interface ChartGroup {
  _uid: string;
  label: string;
  value_a: number;
  value_b?: number;
}

const props = defineProps<{
  blok: {
    eyebrow?: string;
    title?: string;
    series_a_label?: string;
    series_b_label?: string;
    y_max?: number;
    groups?: ChartGroup[];
  };
}>();

const yMax = computed(() => Number(props.blok.y_max) || 100);
const yTicks = computed(() => {
  const max = yMax.value;
  return [max, (max * 3) / 4, max / 2, max / 4, 0];
});
const hasSecondSeries = computed(() =>
  (props.blok.groups ?? []).some((g) => typeof g.value_b === "number"),
);

const pct = (v: number | undefined) =>
  typeof v === "number" ? `${Math.max(0, Math.min(100, (v / yMax.value) * 100))}%` : "0%";
</script>

<template>
  <div v-editable="blok" class="slide layout-chart">
    <div class="slide-inner">
      <div class="head">
        <div>
          <div v-if="blok.eyebrow" class="eyebrow">{{ blok.eyebrow }}</div>
          <h3 v-if="blok.title">{{ blok.title }}</h3>
        </div>
        <div class="legend">
          <span v-if="blok.series_a_label">
            <span class="dot" />{{ blok.series_a_label }}
          </span>
          <span v-if="hasSecondSeries && blok.series_b_label">
            <span class="dot alt" />{{ blok.series_b_label }}
          </span>
        </div>
      </div>
      <div class="chart">
        <div class="yaxis">
          <span v-for="tick in yTicks" :key="tick">{{ tick }}</span>
        </div>
        <div class="bars">
          <div
            v-for="group in blok.groups ?? []"
            :key="group._uid"
            class="bar-group"
          >
            <div class="pair">
              <div class="bar" :style="{ height: pct(group.value_a) }" />
              <div
                v-if="hasSecondSeries"
                class="bar alt"
                :style="{ height: pct(group.value_b) }"
              />
            </div>
            <div class="lbl">{{ group.label }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
