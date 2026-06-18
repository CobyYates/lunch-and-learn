<script setup lang="ts">
const props = defineProps<{
  blok: {
    title?: string;
    language?: string;
    code?: string; // raw source; highlighted per `language`, coloured by the theme
    repo_url?: string;
  };
}>();

const { highlight } = useHighlight();
const highlighted = computed(() =>
  highlight(props.blok.code, props.blok.language),
);
</script>

<template>
  <div v-editable="blok" class="slide layout-code">
    <div class="slide-inner">
      <div class="head">
        <h3 v-if="blok.title">{{ blok.title }}</h3>
        <span v-if="blok.language" class="lang">{{ blok.language }}</span>
      </div>
      <pre><code class="hljs" v-html="highlighted" /></pre>
    </div>
    <SlideMark :url="blok.repo_url" />
</div>
</template>
