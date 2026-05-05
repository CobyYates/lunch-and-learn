<script setup lang="ts">
defineProps<{
  blok: {
    eyebrow?: string;
    title?: string;
    body?: string;
    body_muted?: string;
    image?: { filename?: string; alt?: string
    repo_url?: string;
  };
  };
}>();
</script>

<template>
  <div v-editable="blok" class="slide layout-split">
    <div class="slide-inner">
      <div
        class="visual"
        :style="
          blok.image?.filename
            ? `background-image:url(${blok.image.filename}); background-size:cover; background-position:center;`
            : ''
        "
        role="img"
        :aria-label="blok.image?.alt"
      />
      <div class="text-col">
        <div v-if="blok.eyebrow" class="eyebrow">{{ blok.eyebrow }}</div>
        <h2 v-if="blok.title">{{ blok.title }}</h2>
        <p v-if="blok.body">{{ blok.body }}</p>
        <p v-if="blok.body_muted" class="muted">{{ blok.body_muted }}</p>
      </div>
    </div>
    <SlideMark :url="blok.repo_url" />
</div>
</template>
