<script setup lang="ts">
defineProps<{
  blok: {
    window_title?: string;
    content?: string;
  };
}>();
</script>

<template>
  <div v-editable="blok" class="slide layout-console">
    <div class="slide-inner">
      <div class="window">
        <div class="chrome">
          <span class="dot r" />
          <span class="dot y" />
          <span class="dot g" />
          <span class="ttl">{{ blok.window_title }}</span>
        </div>
        <pre class="shell"><span v-html="blok.content" /><span class="cur"></span></pre>
      </div>
    </div>
  </div>
</template>
