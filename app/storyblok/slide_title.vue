<script setup lang="ts">
defineProps<{
  blok: {
    eyebrow?: string;
    meta_left?: string;
    meta_right?: string;
    title?: string;
    title_accent?: string; // word(s) rendered in accent color (italic)
    presenter_name?: string;
    presenter_role?: string;
    date_label?: string;
    date_sub?: string;
  };
}>();
</script>

<template>
  <div v-editable="blok" class="slide layout-title">
    <div class="slide-inner">
      <div class="top">
        <span>{{ blok.meta_left }}</span>
        <span>{{ blok.meta_right }}</span>
      </div>
      <h1 class="big-title">
        {{ blok.title }}
        <em v-if="blok.title_accent"> {{ blok.title_accent }}</em>
      </h1>
      <div class="meta">
        <div v-if="blok.presenter_name">
          <strong>{{ blok.presenter_name }}</strong>
          <span>{{ blok.presenter_role }}</span>
        </div>
        <div v-if="blok.date_label">
          <strong>{{ blok.date_label }}</strong>
          <span>{{ blok.date_sub }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
