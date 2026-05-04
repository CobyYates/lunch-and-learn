<template>
  <div v-editable="blok" class="slide layout-stepper">
    <div class="slide-inner">
      <div v-if="blok.eyebrow" class="eyebrow">{{ blok.eyebrow }}</div>
      <h3 v-if="blok.title">{{ blok.title }}</h3>
      <img
        v-if="blok.image?.filename"
        :src="blok.image.filename"
        :alt="blok.image.alt ?? blok.title"
        class="hero-img"
      />
      <div class="track">
        <div v-for="step in blok.steps ?? []" :key="step._uid" class="step">
          <span class="dot" />
          <span class="num">{{ step.number_label }}</span>
          <img
            v-if="step.image?.filename"
            :src="step.image.filename"
            :alt="step.image.alt ?? step.title"
            class="step-img"
          />
          <h4>{{ step.title }}</h4>
          <p v-if="step.description">{{ step.description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface StepItem {
  _uid: string;
  number_label?: string;
  title: string;
  description?: string;
  image?: { filename?: string; alt?: string };
}

defineProps<{
  blok: {
    eyebrow?: string;
    title?: string;
    image?: { filename?: string; alt?: string };
    steps?: StepItem[];
  };
}>();
</script>
