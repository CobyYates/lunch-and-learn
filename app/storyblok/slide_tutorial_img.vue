<script setup lang="ts">
// Same shape as slide_tutorial, plus an image rendered to the right of the
// step list. The chrome bar above the image (with three dots) is themed via
// the accent color so it sits naturally in any theme.
type RichTextDoc = Parameters<typeof renderRichText>[0];

interface TutorialStep {
  _uid: string;
  icon?: string;
  text?: RichTextDoc;
}

const props = defineProps<{
  blok: {
    eyebrow?: string;
    title?: string;
    steps?: TutorialStep[];
    image?: { filename?: string; alt?: string };
    image_label?: string;
    repo_url?: string;
  };
}>();

const stepHtml = computed(() =>
  (props.blok.steps ?? []).map((s) =>
    s.text ? renderRichText(s.text) : "",
  ),
);
</script>

<template>
  <div v-editable="blok" class="slide layout-tutorial-img">
    <div class="slide-inner">
      <div class="title-row">
        <div class="accent-bar" />
        <div>
          <span v-if="blok.eyebrow" class="eyebrow-sm">{{ blok.eyebrow }}</span>
          <h2 v-if="blok.title">{{ blok.title }}</h2>
        </div>
      </div>
      <div class="body">
        <div class="steps">
          <div
            v-for="(step, i) in blok.steps ?? []"
            :key="step._uid"
            class="step"
          >
            <span class="ic">
              <i :class="['mdi', step.icon || 'mdi-arrow-right-bold']" />
            </span>
            <span class="body" v-html="stepHtml[i]" />
          </div>
        </div>
        <div v-if="blok.image?.filename" class="shot">
          <div class="shot-chrome">
            <span class="dot" />
            <span class="dot" />
            <span class="dot" />
            <span v-if="blok.image_label" class="label">
              {{ blok.image_label }}
            </span>
          </div>
          <img
            :src="blok.image.filename"
            :alt="blok.image.alt ?? blok.title ?? 'Tutorial screenshot'"
            class="shot-img"
          />
        </div>
      </div>
    </div>
    <SlideMark :url="blok.repo_url" />
  </div>
</template>
