<script setup lang="ts">
// Note: CSS class is `layout-shortcut` (matches the extracted slide stylesheet).
const props = defineProps<{
  blok: {
    eyebrow?: string;
    title?: string;
    description?: string;
    keys?: string; // plus-separated, e.g. "Cmd + K"
    repo_url?: string;
  };
}>();

const keyList = computed(() =>
  (props.blok.keys ?? "").split("+").map((k) => k.trim()).filter(Boolean),
);
</script>

<template>
  <div v-editable="blok" class="slide layout-shortcut">
    <div class="slide-inner">
      <div v-if="blok.eyebrow" class="eyebrow">{{ blok.eyebrow }}</div>
      <h3 v-if="blok.title">{{ blok.title }}</h3>
      <div class="combo">
        <template v-for="(key, i) in keyList" :key="i">
          <kbd class="key" :class="{ accent: i === keyList.length - 1 }">{{ key }}</kbd>
          <span v-if="i < keyList.length - 1" class="plus">+</span>
        </template>
      </div>
      <p v-if="blok.description" class="desc">{{ blok.description }}</p>
    </div>
    <SlideMark :url="blok.repo_url" />
</div>
</template>
