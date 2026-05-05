<script setup lang="ts">
interface DefinitionEntry {
  _uid: string;
  body: string;
}

defineProps<{
  blok: {
    type_label?: string;
    term?: string;
    phonetic?: string;
    entries?: DefinitionEntry[];
    repo_url?: string;
  };
}>();

const pad = (i: number) => String(i + 1).padStart(2, "0");
</script>

<template>
  <div v-editable="blok" class="slide layout-definition">
    <div class="slide-inner">
      <span v-if="blok.type_label" class="type">{{ blok.type_label }}</span>
      <div v-if="blok.term" class="term">
        {{ blok.term }}<span class="dot">.</span>
      </div>
      <div v-if="blok.phonetic" class="phonetic">{{ blok.phonetic }}</div>
      <div class="ns">
        <div v-for="(entry, i) in blok.entries ?? []" :key="entry._uid" class="defn">
          <span class="n">{{ pad(i) }}</span>
          <p>{{ entry.body }}</p>
        </div>
      </div>
    </div>
    <SlideMark :url="blok.repo_url" />
</div>
</template>
