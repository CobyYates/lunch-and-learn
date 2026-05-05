<script setup lang="ts">
interface LogoItem {
  _uid: string;
  name: string;
  symbol?: string;
  mono_style?: boolean;
}

defineProps<{
  blok: {
    eyebrow?: string;
    title?: string;
    logos?: LogoItem[];
    repo_url?: string;
  };
}>();
</script>

<template>
  <div v-editable="blok" class="slide layout-logos">
    <div class="slide-inner">
      <div v-if="blok.eyebrow" class="eyebrow">{{ blok.eyebrow }}</div>
      <h3 v-if="blok.title">{{ blok.title }}</h3>
      <div class="wall">
        <div
          v-for="logo in blok.logos ?? []"
          :key="logo._uid"
          class="logo"
          :class="{ mono: logo.mono_style }"
        >
          <span v-if="logo.symbol" class="sym">{{ logo.symbol }}</span>{{ logo.name }}
        </div>
      </div>
    </div>
    <SlideMark :url="blok.repo_url" />
</div>
</template>
