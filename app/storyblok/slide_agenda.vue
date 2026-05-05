<script setup lang="ts">
interface AgendaItem {
  _uid: string;
  number_label?: string;
  title: string;
  time_label?: string;
}

defineProps<{
  blok: {
    eyebrow?: string;
    title?: string;
    items?: AgendaItem[];
    repo_url?: string;
  };
}>();
</script>

<template>
  <div v-editable="blok" class="slide layout-agenda">
    <div class="slide-inner">
      <div v-if="blok.eyebrow" class="eyebrow">{{ blok.eyebrow }}</div>
      <h3 v-if="blok.title">{{ blok.title }}</h3>
      <div class="items">
        <div v-for="item in blok.items ?? []" :key="item._uid" class="item">
          <span class="n">{{ item.number_label }}</span>
          <h4>{{ item.title }}</h4>
          <span v-if="item.time_label" class="t">{{ item.time_label }}</span>
        </div>
      </div>
    </div>
    <SlideMark :url="blok.repo_url" />
</div>
</template>
