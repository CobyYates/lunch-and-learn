<script setup lang="ts">
defineProps<{
  blok: {
    title?: string;
    description?: string;
    repo_label?: string;
    url?: string;
  };
}>();
</script>

<template>
  <v-theme-provider theme="dark" with-background>
    <section v-editable="blok" class="sb-github pa-8 pa-sm-12 text-center">
      <v-icon icon="mdi-github" size="40" class="mb-3" />
      <h2 v-if="blok.title" class="text-h5 font-weight-bold mb-2">
        {{ blok.title }}
      </h2>
      <p
        v-if="blok.description"
        class="sb-github__desc text-body-2 text-medium-emphasis mx-auto mb-6"
      >
        {{ blok.description }}
      </p>
      <v-btn
        v-if="blok.repo_label"
        :href="blok.url || undefined"
        target="_blank"
        rel="noopener"
        variant="outlined"
        prepend-icon="mdi-source-repository"
      >
        {{ blok.repo_label }}
      </v-btn>
    </section>
  </v-theme-provider>
</template>
