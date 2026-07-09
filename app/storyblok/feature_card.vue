<script setup lang="ts">
defineProps<{
  blok: {
    icon?: string;
    title: string;
    description?: string;
  };
}>();
</script>

<template>
  <v-card v-editable="blok" class="h-100 pa-5" border flat rounded="lg">
    <v-avatar class="sb-feature-card__icon mb-4" rounded="lg" size="44">
      <v-icon :icon="blok.icon || 'mdi-square-rounded-outline'" />
    </v-avatar>
    <div class="text-subtitle-1 font-weight-bold mb-1">{{ blok.title }}</div>
    <div v-if="blok.description" class="text-body-2 text-medium-emphasis">
      {{ blok.description }}
    </div>
  </v-card>
</template>
