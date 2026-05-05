<script setup lang="ts">
defineProps<{
  blok: {
    title?: string;
    language?: string;
    code?: string; // raw source; highlighting done via the theme's syntax vars
    repo_url?: string;
  };
}>();
</script>

<template>
  <div v-editable="blok" class="slide layout-code">
    <div class="slide-inner">
      <div class="head">
        <h3 v-if="blok.title">{{ blok.title }}</h3>
        <span v-if="blok.language" class="lang">{{ blok.language }}</span>
      </div>
      <pre><code>{{ blok.code }}</code></pre>
    </div>
    <SlideMark :url="blok.repo_url" />
</div>
</template>
