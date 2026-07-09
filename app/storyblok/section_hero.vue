<script setup lang="ts">
defineProps<{
  blok: {
    eyebrow?: string;
    title: string;
    subtitle?: string;
  };
}>();
</script>

<template>
  <v-theme-provider theme="dark" with-background>
    <section v-editable="blok" class="sb-hero pa-8 pa-sm-12">
      <div class="sb-eyebrow mb-3" v-if="blok.eyebrow">{{ blok.eyebrow }}</div>
      <h1 class="sb-hero__title text-h4 text-sm-h3 font-weight-bold mb-4">
        {{ blok.title }}
      </h1>
      <p
        v-if="blok.subtitle"
        class="sb-hero__subtitle text-body-1 text-medium-emphasis mb-0"
      >
        {{ blok.subtitle }}
      </p>
    </section>
  </v-theme-provider>
</template>
