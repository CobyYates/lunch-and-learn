<script setup lang="ts">
interface StepItem {
  _uid: string;
  number_label?: string;
  title: string;
  description?: string;
}

defineProps<{
  blok: {
    eyebrow?: string;
    title?: string;
    steps?: StepItem[];
    repo_url?: string;
  };
}>();
</script>

<template>
  <div v-editable="blok" class="slide layout-stepper">
    <div class="slide-inner">
      <div v-if="blok.eyebrow" class="eyebrow">{{ blok.eyebrow }}</div>
      <h3 v-if="blok.title">{{ blok.title }}</h3>
      <div class="track">
        <div v-for="step in blok.steps ?? []" :key="step._uid" class="step">
          <span class="dot" />
          <span class="num">{{ step.number_label }}</span>
          <h4>{{ step.title }}</h4>
          <p v-if="step.description">{{ step.description }}</p>
        </div>
      </div>
    </div>
    <SlideMark :url="blok.repo_url" />
  </div>
</template>
