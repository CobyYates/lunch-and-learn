<script setup lang="ts">
interface Stat {
  _uid: string;
  big_number: string; // e.g. "142"
  unit?: string; // e.g. "%"
  label?: string; // small uppercase label
  description?: string;
}

defineProps<{
  blok: {
    eyebrow?: string;
    title?: string;
    stats?: Stat[];
  };
}>();
</script>

<template>
  <div v-editable="blok" class="slide layout-stats">
    <div class="slide-inner">
      <div v-if="blok.eyebrow" class="eyebrow">{{ blok.eyebrow }}</div>
      <h3 v-if="blok.title">{{ blok.title }}</h3>
      <div class="grid">
        <div v-for="stat in blok.stats ?? []" :key="stat._uid" class="stat">
          <div class="big">
            {{ stat.big_number }}<span v-if="stat.unit" class="unit">{{ stat.unit }}</span>
          </div>
          <div>
            <div v-if="stat.label" class="lbl">{{ stat.label }}</div>
            <p v-if="stat.description" class="desc">{{ stat.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
