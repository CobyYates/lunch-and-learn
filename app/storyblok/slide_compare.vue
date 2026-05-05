<script setup lang="ts">
interface CompareCol {
  _uid: string;
  heading: string;
  description?: string;
  featured?: boolean;
  tag?: string; // shown when featured (e.g. "Popular")
  items?: string[];
}

defineProps<{
  blok: {
    eyebrow?: string;
    title?: string;
    left?: CompareCol;
    right?: CompareCol;
    divider_label?: string; // defaults to "vs"
    repo_url?: string;
  };
}>();
</script>

<template>
  <div v-editable="blok" class="slide layout-compare">
    <div class="slide-inner">
      <div v-if="blok.eyebrow" class="eyebrow">{{ blok.eyebrow }}</div>
      <h3 v-if="blok.title">{{ blok.title }}</h3>
      <div class="cols">
        <div v-if="blok.left" class="col" :class="{ featured: blok.left.featured }">
          <span v-if="blok.left.featured && blok.left.tag" class="tag">{{ blok.left.tag }}</span>
          <h4>{{ blok.left.heading }}</h4>
          <p v-if="blok.left.description" class="muted">{{ blok.left.description }}</p>
          <ul>
            <li v-for="(item, i) in blok.left.items ?? []" :key="i">{{ item }}</li>
          </ul>
        </div>
        <div class="divider">{{ blok.divider_label || "vs" }}</div>
        <div v-if="blok.right" class="col" :class="{ featured: blok.right.featured }">
          <span v-if="blok.right.featured && blok.right.tag" class="tag">{{ blok.right.tag }}</span>
          <h4>{{ blok.right.heading }}</h4>
          <p v-if="blok.right.description" class="muted">{{ blok.right.description }}</p>
          <ul>
            <li v-for="(item, i) in blok.right.items ?? []" :key="i">{{ item }}</li>
          </ul>
        </div>
      </div>
    </div>
    <SlideMark :url="blok.repo_url" />
</div>
</template>
