<script setup lang="ts">
// Richtext doc returned by Storyblok — Prosemirror-style JSON tree.
// Render with renderRichText (auto-imported by @storyblok/nuxt) to get HTML.
type RichTextDoc = Parameters<typeof renderRichText>[0];

interface TutorialStep {
  _uid: string;
  icon?: string;          // mdi icon name, e.g. "mdi-check"
  text?: RichTextDoc;     // single-line richtext
}

const props = defineProps<{
  blok: {
    eyebrow?: string;
    title?: string;
    steps?: TutorialStep[];
    repo_url?: string;
  };
}>();

// Pre-render each row's HTML once per props change so we don't re-walk the
// richtext tree on every paint.
const stepHtml = computed(() =>
  (props.blok.steps ?? []).map((s) =>
    s.text ? renderRichText(s.text) : "",
  ),
);
</script>

<template>
  <div v-editable="blok" class="slide layout-tutorial">
    <div class="slide-inner">
      <div class="title-row">
        <div class="accent-bar" />
        <div>
          <span v-if="blok.eyebrow" class="eyebrow-sm">{{ blok.eyebrow }}</span>
          <h2 v-if="blok.title">{{ blok.title }}</h2>
        </div>
      </div>
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
    </div>
    <SlideMark :url="blok.repo_url" />
  </div>
</template>
