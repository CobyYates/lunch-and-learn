<script setup lang="ts">
// `request_sample` is a `storyblok-code-block` plugin field (returns an object
// with a `code` string), but tolerate plain strings too in case Storyblok ever
// flips it back to textarea.
type CodeBlock = string | { code?: string; language?: string };

const props = defineProps<{
  blok: {
    eyebrow?: string;
    title?: string;
    method?: "get" | "post" | "put" | "patch" | "delete";
    path?: string;
    description?: string;
    request_sample?: CodeBlock;
    response_sample?: string;
    repo_url?: string;
  };
}>();

const requestCode = computed(() => {
  const r = props.blok.request_sample;
  if (!r) return "";
  return typeof r === "string" ? r : r.code ?? "";
});
</script>

<template>
  <div v-editable="blok" class="slide layout-api">
    <div class="slide-inner">
      <div v-if="blok.eyebrow" class="eyebrow">{{ blok.eyebrow }}</div>
      <h3 v-if="blok.title">{{ blok.title }}</h3>
      <div class="endpoint">
        <span class="method" :class="blok.method">
          {{ (blok.method || "get").toUpperCase() }}
        </span>
        <span class="path">{{ blok.path }}</span>
      </div>
      <p v-if="blok.description" class="desc">{{ blok.description }}</p>
      <div class="panels">
        <div v-if="requestCode" class="panel">
          <h5>Request</h5>
          <pre>{{ requestCode }}</pre>
        </div>
        <div v-if="blok.response_sample" class="panel">
          <h5>Response</h5>
          <pre>{{ blok.response_sample }}</pre>
        </div>
      </div>
    </div>
    <SlideMark :url="blok.repo_url" />
</div>
</template>
