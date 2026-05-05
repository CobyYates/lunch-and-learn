<template>
  <div v-editable="blok" class="slide layout-stack">
    <div class="slide-inner">
      <div v-if="blok.eyebrow" class="eyebrow">{{ blok.eyebrow }}</div>
      <h3 v-if="blok.title">{{ blok.title }}</h3>
      <div class="rows">
        <div v-for="row in rows" :key="row.category" class="row">
          <span class="cat w-max">{{ row.category }}</span>
          <div class="items">
            <v-chip
              v-for="item in row.items"
              :key="item.name"
              class="pill"
              :class="item.kind !== 'default' ? item.kind : ''"
              variant="outlined"
              label
            >
              {{ item.name }}
            </v-chip>
          </div>
        </div>
      </div>
    </div>
    <SlideMark :url="blok.repo_url" />
</div>
</template>

<script setup lang="ts">
// Note: CSS class is `layout-stack` (matches the extracted slide stylesheet),
// not `layout-techstack`. The Storyblok technical name uses `slide_techstack`
// so it namespaces cleanly alongside the other slide_* components.
interface StackRow {
  category: string;
  items: { name: string; kind: "primary" | "accent" | "default" }[];
}

const props = defineProps<{
  blok: {
    eyebrow?: string;
    title?: string;
    stack?: string; // one tech per line: "Category | Name | primary|accent|default"
    repo_url?: string;
  };
}>();

const rows = computed<StackRow[]>(() => {
  const byCat = new Map<string, StackRow["items"]>();
  for (const line of (props.blok.stack ?? "").split("\n")) {
    const parts = line.split("|").map((s) => s.trim());
    if (parts.length < 2 || !parts[0] || !parts[1]) continue;
    const [category, name, rawKind] = parts;
    const kind: "primary" | "accent" | "default" =
      rawKind === "primary" || rawKind === "accent" ? rawKind : "default";
    if (!byCat.has(category)) byCat.set(category, []);
    byCat.get(category)!.push({ name, kind });
  }
  return [...byCat.entries()].map(([category, items]) => ({ category, items }));
});
</script>
