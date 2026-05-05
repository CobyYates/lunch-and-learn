<script setup lang="ts">
defineProps<{
  blok: {
    quote?: string;
    author_name?: string;
    author_role?: string;
    author_initials?: string; // shown in the avatar circle if no image
    author_image?: { filename?: string; alt?: string
    repo_url?: string;
  };
  };
}>();
</script>

<template>
  <div v-editable="blok" class="slide layout-quote">
    <div class="slide-inner">
      <div class="qmark">"</div>
      <blockquote>{{ blok.quote }}</blockquote>
      <div class="attr" v-if="blok.author_name">
        <div
          class="avatar"
          :style="
            blok.author_image?.filename
              ? `background-image:url(${blok.author_image.filename}); background-size:cover;`
              : ''
          "
        >
          <template v-if="!blok.author_image?.filename">
            {{ blok.author_initials }}
          </template>
        </div>
        <div>
          <strong>{{ blok.author_name }}</strong>
          <span>{{ blok.author_role }}</span>
        </div>
      </div>
    </div>
    <SlideMark :url="blok.repo_url" />
</div>
</template>
