<script setup lang="ts">
defineProps<{
  blok: {
    eyebrow?: string;
    title?: string;
    method?: "get" | "post" | "put" | "patch" | "delete";
    path?: string;
    description?: string;
    request_sample?: string;
    response_sample?: string;
  };
}>();
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
        <div v-if="blok.request_sample" class="panel">
          <h5>Request</h5>
          <pre>{{ blok.request_sample }}</pre>
        </div>
        <div v-if="blok.response_sample" class="panel">
          <h5>Response</h5>
          <pre>{{ blok.response_sample }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>
