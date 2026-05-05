<script setup lang="ts">
import { getUsStatePaths, type StatePath } from "~/utils/usMapPaths";

// d3-geo + us-atlas TopoJSON are loaded lazily — only the slides that need
// them pay the bundle cost. Cached after the first call so theme switches and
// hover updates don't re-project.
const statePaths = ref<StatePath[]>([]);
onMounted(async () => {
  statePaths.value = await getUsStatePaths();
});

interface MapState {
  _uid: string;
  state_id: string;
  tier?: "1" | "2" | "3" | "4" | number;
  headline?: string;
  tier_label?: string;
  customers?: string;
  revenue?: string;
  growth?: string;
  description?: string;
}

const props = defineProps<{
  blok: {
    eyebrow?: string;
    title?: string;
    scale_low_label?: string;
    scale_high_label?: string;
    default_state_id?: string;
    panel_eyebrow_default?: string;
    states?: MapState[];
    panel_hint?: string;
    repo_url?: string;
  };
}>();

// Index author-supplied state data by state_id so click/hover lookups are O(1).
const stateData = computed<Record<string, MapState>>(() => {
  const out: Record<string, MapState> = {};
  for (const s of props.blok.states ?? []) {
    if (s.state_id) out[s.state_id] = s;
  }
  return out;
});

function tierClass(stateId: string): string {
  const s = stateData.value[stateId];
  if (!s) return "";
  const tier = String(s.tier ?? "1");
  return `t${tier}`;
}

const TIER_LABELS: Record<string, string> = {
  "1": "Emerging market",
  "2": "Growing market",
  "3": "Strong market",
  "4": "Top region",
};

function autoTierLabel(tier?: string | number): string {
  return TIER_LABELS[String(tier ?? "1")] ?? "Region";
}

function autoDescription(name: string, tier?: string | number): string {
  const t = String(tier ?? "1");
  if (t === "4") return `${name} is one of our largest markets — sustained enterprise growth and strong renewal rates.`;
  if (t === "3") return `${name} is performing above plan, with healthy expansion among mid-market customers.`;
  if (t === "2") return `${name} is showing real traction, especially in design-led teams. Worth deeper investment.`;
  return `${name} is early-stage for us — small customer base but interesting recent signal.`;
}

// Active state — defaults to the configured default, falls back to the first
// state with data, then NY.
const activeId = ref<string>(
  props.blok.default_state_id || (props.blok.states?.[0]?.state_id ?? "NY"),
);

const activeState = computed(() => {
  const id = activeId.value;
  const s = stateData.value[id];
  const path = statePaths.value.find((p) => p.id === id);
  const name = s?.headline || path?.name || id;
  const tier = s?.tier ?? "1";
  return {
    id,
    name,
    tierLabel: s?.tier_label || autoTierLabel(tier),
    customers: s?.customers ?? "—",
    revenue: s?.revenue ?? "—",
    growth: s?.growth ?? "—",
    tier: String(tier),
    description: s?.description || autoDescription(name, tier),
  };
});

function setActive(id: string) {
  activeId.value = id;
}
</script>

<template>
  <div v-editable="blok" class="slide layout-usmap">
    <div class="slide-inner">
      <div class="head">
        <div>
          <div v-if="blok.eyebrow" class="eyebrow">{{ blok.eyebrow }}</div>
          <h3 v-if="blok.title">{{ blok.title }}</h3>
        </div>
        <div class="scale">
          <span>{{ blok.scale_low_label || "Fewer" }}</span>
          <span class="swatches">
            <i :style="`background: color-mix(in srgb, var(--accent) 22%, var(--bg-alt))`" />
            <i :style="`background: color-mix(in srgb, var(--accent) 45%, var(--bg-alt))`" />
            <i :style="`background: color-mix(in srgb, var(--accent) 70%, var(--bg-alt))`" />
            <i :style="`background: var(--accent)`" />
          </span>
          <span>{{ blok.scale_high_label || "More" }}</span>
        </div>
      </div>
      <div class="body">
        <div class="map-wrap">
          <svg
            class="us"
            viewBox="0 0 960 600"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              v-for="state in statePaths"
              :key="state.id"
              class="state"
              :class="[tierClass(state.id), { active: activeId === state.id }]"
              :data-id="state.id"
              :d="state.d"
              @mouseover="setActive(state.id)"
              @click="setActive(state.id)"
            >
              <title>{{ state.name }}</title>
            </path>
          </svg>
        </div>
        <div class="panel">
          <span class="panel-eyebrow">{{ activeState.tierLabel || blok.panel_eyebrow_default }}</span>
          <h4>{{ activeState.name }}</h4>
          <p>{{ activeState.description }}</p>
          <div class="stat-row">
            <div class="stat">
              <span class="k">Customers</span>
              <span class="v">{{ activeState.customers }}</span>
            </div>
            <div class="stat">
              <span class="k">Revenue</span>
              <span class="v accent">{{ activeState.revenue }}</span>
            </div>
            <div class="stat">
              <span class="k">YoY Growth</span>
              <span class="v accent">{{ activeState.growth }}</span>
            </div>
            <div class="stat">
              <span class="k">Tier</span>
              <span class="v">Tier {{ activeState.tier }}</span>
            </div>
          </div>
          <div v-if="blok.panel_hint" class="hint">{{ blok.panel_hint }}</div>
        </div>
      </div>
    </div>
    <SlideMark :url="blok.repo_url" />
  </div>
</template>
