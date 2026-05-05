<script setup lang="ts">
defineProps<{
  blok: {
    eyebrow?: string;
    number?: string;
    unit?: string;
    label?: string;
    label_bold?: string;
    sub?: string;
    repo_url?: string;
  };
}>();
</script>

<template>
  <div v-editable="blok" class="slide layout-bignum">
    <div class="slide-inner">
      <div v-if="blok.eyebrow" class="eyebrow">{{ blok.eyebrow }}</div>
      <div class="number">
        {{ blok.number }}
        <span v-if="blok.unit" class="unit">{{ blok.unit }}</span>
      </div>
      <p v-if="blok.label" class="label">
        <strong v-if="blok.label_bold">{{ blok.label_bold }}</strong>
        {{ blok.label }}
      </p>
      <p v-if="blok.sub" class="sub">{{ blok.sub }}</p>
    </div>
    <SlideMark :url="blok.repo_url" />
</div>
</template>
