<script setup lang="ts">
defineProps<{
  blok: {
    number_label?: string; // e.g. "02"
    eyebrow?: string; // e.g. "Chapter Two"
    title?: string;
    description?: string;
    repo_url?: string;
  };
}>();
</script>

<template>
  <div v-editable="blok" class="slide layout-section">
    <div class="slide-inner">
      <div class="num">{{ blok.number_label || "01" }}</div>
      <div class="body">
        <div v-if="blok.eyebrow" class="eyebrow">{{ blok.eyebrow }}</div>
        <h2 v-if="blok.title">{{ blok.title }}</h2>
        <p v-if="blok.description" class="muted">{{ blok.description }}</p>
      </div>
    </div>
    <SlideMark :url="blok.repo_url" />
</div>
</template>
