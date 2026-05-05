<script setup lang="ts">
defineProps<{
  blok: {
    eyebrow?: string;
    title?: string;
    before_label?: string;
    before_sample?: string;
    before_caption?: string;
    after_label?: string;
    after_sample?: string;
    after_caption?: string;
    repo_url?: string;
  };
}>();
</script>

<template>
  <div v-editable="blok" class="slide layout-beforeafter">
    <div class="slide-inner">
      <div v-if="blok.eyebrow" class="eyebrow">{{ blok.eyebrow }}</div>
      <h3 v-if="blok.title">{{ blok.title }}</h3>
      <div class="split">
        <div class="panel before">
          <span class="lbl">{{ blok.before_label || "BEFORE" }}</span>
          <div class="visual">
            <div class="sample" v-html="(blok.before_sample || '').replace(/\n/g, '<br>')" />
          </div>
          <p v-if="blok.before_caption">{{ blok.before_caption }}</p>
        </div>
        <div class="arrow">→</div>
        <div class="panel after">
          <span class="lbl">{{ blok.after_label || "AFTER" }}</span>
          <div class="visual">
            <div class="sample" v-html="(blok.after_sample || '').replace(/\n/g, '<br>')" />
          </div>
          <p v-if="blok.after_caption">{{ blok.after_caption }}</p>
        </div>
      </div>
    </div>
    <SlideMark :url="blok.repo_url" />
</div>
</template>
