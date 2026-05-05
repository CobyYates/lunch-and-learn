<script setup lang="ts">
interface DiagramNode {
  _uid: string;
  title: string;
  hint?: string;
  primary?: boolean;
}

defineProps<{
  blok: {
    eyebrow?: string;
    title?: string;
    nodes?: DiagramNode[];
    caption?: string;
    repo_url?: string;
  };
}>();
</script>

<template>
  <div v-editable="blok" class="slide layout-diagram">
    <div class="slide-inner">
      <div v-if="blok.eyebrow" class="eyebrow">{{ blok.eyebrow }}</div>
      <h3 v-if="blok.title">{{ blok.title }}</h3>
      <div class="flow">
        <template v-for="(node, i) in blok.nodes ?? []" :key="node._uid">
          <div class="node" :class="{ primary: node.primary }">
            <h5>{{ node.title }}</h5>
            <span v-if="node.hint" class="hint">{{ node.hint }}</span>
          </div>
          <div v-if="i < (blok.nodes ?? []).length - 1" class="arrow">→</div>
        </template>
      </div>
      <p v-if="blok.caption" class="caption">{{ blok.caption }}</p>
    </div>
    <SlideMark :url="blok.repo_url" />
</div>
</template>
