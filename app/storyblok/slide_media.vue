<script setup lang="ts">
defineProps<{
  blok: {
    eyebrow?: string;
    title?: string;
    description?: string;
    duration?: string;
    duration_label?: string;
    meta_label?: string;
    meta_value?: string;
    poster?: { filename?: string; alt?: string };
    video_url?: string;
    repo_url?: string;
  };
}>();
</script>

<template>
  <div v-editable="blok" class="slide layout-media">
    <div class="slide-inner">
      <div
        class="video"
        :style="
          blok.poster?.filename
            ? `background-image:url(${blok.poster.filename}); background-size:cover; background-position:center;`
            : ''
        "
      >
        <div class="play">▶</div>
        <div v-if="blok.duration" class="duration">{{ blok.duration }}</div>
      </div>
      <div class="info">
        <div v-if="blok.eyebrow" class="eyebrow">{{ blok.eyebrow }}</div>
        <h3 v-if="blok.title">{{ blok.title }}</h3>
        <p v-if="blok.description">{{ blok.description }}</p>
        <div class="meta" v-if="blok.duration || blok.meta_value">
          <span v-if="blok.meta_value">
            <b>{{ blok.meta_label || "SPEAKER" }}</b> {{ blok.meta_value }}
          </span>
          <span v-if="blok.duration">
            <b>{{ blok.duration_label || "DURATION" }}</b> {{ blok.duration }}
          </span>
        </div>
      </div>
    </div>
    <SlideMark :url="blok.repo_url" />
</div>
</template>
