<script setup lang="ts">
interface BulletItem {
  _uid: string;
  lead: string; // bold leading phrase
  text: string; // rest of the bullet
}

defineProps<{
  blok: {
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    items?: BulletItem[];
    repo_url?: string;
  };
}>();
</script>

<template>
  <div v-editable="blok" class="slide layout-bullets">
    <div class="slide-inner">
      <div v-if="blok.eyebrow" class="eyebrow">{{ blok.eyebrow }}</div>
      <h2 v-if="blok.title">{{ blok.title }}</h2>
      <p v-if="blok.subtitle" class="sub">{{ blok.subtitle }}</p>
      <ul>
        <li v-for="item in blok.items ?? []" :key="item._uid">
          <span>
            <strong v-if="item.lead">{{ item.lead }}</strong>
            {{ item.text }}
          </span>
        </li>
      </ul>
    </div>
    <SlideMark :url="blok.repo_url" />
</div>
</template>
