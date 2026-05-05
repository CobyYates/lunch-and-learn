<script setup lang="ts">
const props = defineProps<{
  blok: {
    eyebrow?: string;
    title?: string;
    description?: string;
    features?: string; // one per line
    mock_title?: string;
    mock_sub?: string;
    mock_number?: string;
    mock_label?: string;
  };
}>();

const featureList = computed(() =>
  (props.blok.features ?? "").split("\n").map((s) => s.trim()).filter(Boolean),
);
</script>

<template>
  <div v-editable="blok" class="slide layout-device">
    <div class="slide-inner">
      <div class="content">
        <div v-if="blok.eyebrow" class="eyebrow">{{ blok.eyebrow }}</div>
        <h3 v-if="blok.title">{{ blok.title }}</h3>
        <p v-if="blok.description">{{ blok.description }}</p>
        <ul v-if="featureList.length">
          <li v-for="(f, i) in featureList" :key="i">{{ f }}</li>
        </ul>
      </div>
      <div class="device-frame">
        <div class="screen">
          <div>
            <div v-if="blok.mock_sub" class="mock-sub">{{ blok.mock_sub }}</div>
            <div
              v-if="blok.mock_title"
              class="mock-title"
              v-html="blok.mock_title.replace(/\n/g, '<br>')"
            />
          </div>
          <div v-if="blok.mock_number" class="mock-card">
            <div v-if="blok.mock_label" class="mock-lbl">{{ blok.mock_label }}</div>
            <div class="mock-num">{{ blok.mock_number }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
