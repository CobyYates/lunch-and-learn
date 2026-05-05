<script setup lang="ts">
interface FeatureItem {
  _uid: string;
  icon?: string;
  title: string;
  description?: string;
}

defineProps<{
  blok: {
    eyebrow?: string;
    title?: string;
    items?: FeatureItem[];
    repo_url?: string;
  };
}>();
</script>

<template>
  <div v-editable="blok" class="slide layout-features">
    <div class="slide-inner">
      <div v-if="blok.eyebrow" class="eyebrow">{{ blok.eyebrow }}</div>
      <h3 v-if="blok.title">{{ blok.title }}</h3>
      <div class="grid">
        <div v-for="f in blok.items ?? []" :key="f._uid" class="feature">
          <div v-if="f.icon" class="icon">{{ f.icon }}</div>
          <h4>{{ f.title }}</h4>
          <p v-if="f.description">{{ f.description }}</p>
        </div>
      </div>
    </div>
    <SlideMark :url="blok.repo_url" />
</div>
</template>
