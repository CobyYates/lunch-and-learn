<script setup lang="ts">
interface FootItem {
  _uid: string;
  label: string; // small uppercase label
  value: string; // bigger value text
}

defineProps<{
  blok: {
    eyebrow?: string;
    title?: string;
    title_accent?: string; // styled in accent color
    foot_items?: FootItem[]; // up to 3 footer items (name/email/web, etc.)
  };
}>();
</script>

<template>
  <div v-editable="blok" class="slide layout-closing">
    <div class="slide-inner">
      <div v-if="blok.eyebrow" class="eyebrow">{{ blok.eyebrow }}</div>
      <h1>
        {{ blok.title }}
        <em v-if="blok.title_accent">{{ blok.title_accent }}</em>
      </h1>
      <div v-if="blok.foot_items?.length" class="foot">
        <div v-for="item in blok.foot_items" :key="item._uid">
          <div class="lbl">{{ item.label }}</div>
          <div class="val">{{ item.value }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
