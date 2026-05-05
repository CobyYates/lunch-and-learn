<script setup lang="ts">
defineProps<{
  blok: {
    title_q?: string;
    title_amp?: string;
    title_a?: string;
    sub?: string;
    hint?: string;
    repo_url?: string;
  };
}>();
</script>

<template>
  <div v-editable="blok" class="slide layout-qa">
    <div class="slide-inner">
      <div class="big">
        {{ blok.title_q || "Q" }}
        <span class="amp">{{ blok.title_amp || "&" }}</span>
        {{ blok.title_a || "A" }}
      </div>
      <p v-if="blok.sub" class="sub">{{ blok.sub }}</p>
      <span v-if="blok.hint" class="hint">{{ blok.hint }}</span>
    </div>
    <SlideMark :url="blok.repo_url" />
</div>
</template>
