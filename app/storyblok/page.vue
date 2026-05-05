<script setup lang="ts">
defineProps<{
  blok: {
    sections?: Array<{ _uid: string; component: string } & Record<string, unknown>>;
  };
}>();
</script>

<template>
  <div v-editable="blok">
    <StoryblokComponent
      v-for="section in blok.sections ?? []"
      :key="section._uid"
      :blok="section"
    />
  </div>
</template>
