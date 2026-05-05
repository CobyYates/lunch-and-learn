<script setup lang="ts">
interface TimelineEvent {
  _uid: string;
  date: string;
  title: string;
  description?: string;
}

defineProps<{
  blok: {
    eyebrow?: string;
    title?: string;
    events?: TimelineEvent[];
    repo_url?: string;
  };
}>();
</script>

<template>
  <div v-editable="blok" class="slide layout-timeline">
    <div class="slide-inner">
      <div v-if="blok.eyebrow" class="eyebrow">{{ blok.eyebrow }}</div>
      <h3 v-if="blok.title">{{ blok.title }}</h3>
      <div class="events">
        <div v-for="evt in blok.events ?? []" :key="evt._uid" class="event">
          <span class="date">{{ evt.date }}</span>
          <span class="dot" />
          <h4>{{ evt.title }}</h4>
          <p v-if="evt.description">{{ evt.description }}</p>
        </div>
      </div>
    </div>
    <SlideMark :url="blok.repo_url" />
</div>
</template>
