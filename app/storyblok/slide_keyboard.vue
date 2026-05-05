<script setup lang="ts">
// Note: CSS class is `layout-shortcut` (matches the extracted slide stylesheet).
const props = defineProps<{
  blok: {
    eyebrow?: string;
    title?: string;
    description?: string;
    keys?: string; // plus-separated, e.g. "Cmd + K"
    more?: string; // one combo per line, format: "Cmd+K | description"
  };
}>();

const keyList = computed(() =>
  (props.blok.keys ?? "").split("+").map((k) => k.trim()).filter(Boolean),
);

const moreList = computed(() =>
  (props.blok.more ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [combo, ...rest] = l.split("|").map((s) => s.trim());
      return { combo, description: rest.join(" | ") };
    }),
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
      <div v-if="moreList.length" class="more">
        <span v-for="(m, i) in moreList" :key="i">
          <kbd>{{ m.combo }}</kbd> {{ m.description }}
        </span>
      </div>
    </div>
  </div>
</template>
