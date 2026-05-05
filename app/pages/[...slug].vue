<template>
  <StoryblokComponent v-if="story" :blok="(story as any).content" />
</template>

<script setup lang="ts">
const story = await useStory();

if (!story.value) {
  throw createError({
    statusCode: 404,
    statusMessage: "Story not found",
    fatal: true,
  });
}
</script>
