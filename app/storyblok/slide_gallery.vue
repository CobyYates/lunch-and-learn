<script setup lang="ts">
interface GalleryTile {
  _uid: string;
  kind?: "feature" | "alt" | "neutral" | "muted";
  caption?: string;
  image?: { filename?: string; alt?: string };
}

defineProps<{
  blok: {
    eyebrow?: string;
    title?: string;
    tiles?: GalleryTile[];
  };
}>();
</script>

<template>
  <div v-editable="blok" class="slide layout-gallery">
    <div class="slide-inner">
      <div v-if="blok.eyebrow" class="eyebrow">{{ blok.eyebrow }}</div>
      <h3 v-if="blok.title">{{ blok.title }}</h3>
      <div class="wall">
        <div
          v-for="tile in blok.tiles ?? []"
          :key="tile._uid"
          class="tile"
          :class="tile.kind || 'neutral'"
          :style="
            tile.image?.filename
              ? `background-image:url(${tile.image.filename}); background-size:cover; background-position:center;`
              : ''
          "
        >
          <span v-if="tile.caption" class="cap">{{ tile.caption }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
