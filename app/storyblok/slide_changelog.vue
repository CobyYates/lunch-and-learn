<script setup lang="ts">
interface ChangelogEntry {
  _uid: string;
  kind: "added" | "changed" | "fixed" | "removed";
  text: string;
}

const props = defineProps<{
  blok: {
    eyebrow?: string;
    title?: string;
    version?: string;
    date?: string;
    entries?: ChangelogEntry[];
  };
}>();

// Group entries by kind so the rendered markup matches the HTML reference
// (one `<div class="entry kind">` per group with a <ul> of items).
type Group = { kind: ChangelogEntry["kind"]; items: string[] };
const grouped = computed<Group[]>(() => {
  const byKind = new Map<ChangelogEntry["kind"], string[]>();
  for (const e of props.blok.entries ?? []) {
    if (!byKind.has(e.kind)) byKind.set(e.kind, []);
    byKind.get(e.kind)!.push(e.text);
  }
  const order: ChangelogEntry["kind"][] = ["added", "changed", "fixed", "removed"];
  return order
    .filter((k) => byKind.has(k))
    .map((k) => ({ kind: k, items: byKind.get(k)! }));
});

const tagLabel: Record<ChangelogEntry["kind"], string> = {
  added: "Added",
  changed: "Changed",
  fixed: "Fixed",
  removed: "Removed",
};
</script>

<template>
  <div v-editable="blok" class="slide layout-changelog">
    <div class="slide-inner">
      <div class="head">
        <div v-if="blok.eyebrow" class="eyebrow">{{ blok.eyebrow }}</div>
        <span v-if="blok.version" class="version">{{ blok.version }}</span>
        <h3 v-if="blok.date">— {{ blok.date }}</h3>
      </div>
      <div class="entries">
        <div
          v-for="group in grouped"
          :key="group.kind"
          class="entry"
          :class="group.kind"
        >
          <span class="tag">{{ tagLabel[group.kind] }}</span>
          <ul>
            <li v-for="(item, i) in group.items" :key="i">{{ item }}</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
