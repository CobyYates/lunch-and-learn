<script setup lang="ts">
defineProps<{
  blok: {
    tag?: string;
    title?: string;
    subtitle?: string;
    image?: { filename?: string; alt?: string };
  };
}>();
</script>

<template>
  <div
    v-editable="blok"
    class="slide layout-hero"
    :style="
      blok.image?.filename
        ? `--hero-bg: url(${blok.image.filename}) center/cover no-repeat;`
        : ''
    "
  >
    <div class="slide-inner">
      <span v-if="blok.tag" class="tag">{{ blok.tag }}</span>
      <h1 v-if="blok.title">{{ blok.title }}</h1>
      <p v-if="blok.subtitle" class="sub">{{ blok.subtitle }}</p>
    </div>
  </div>
</template>
