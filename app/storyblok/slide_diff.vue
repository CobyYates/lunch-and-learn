<script setup lang="ts">
interface DiffLine {
  _uid: string;
  kind: "add" | "rem" | "context";
  line: string;
}

const props = defineProps<{
  blok: {
    eyebrow?: string;
    title?: string;
    filename?: string;
    lines?: DiffLine[];
  };
}>();

const counts = computed(() => {
  const lines = props.blok.lines ?? [];
  const add = lines.filter((l) => l.kind === "add").length;
  const rem = lines.filter((l) => l.kind === "rem").length;
  return `+${add} −${rem}`;
});

const markFor = (kind: DiffLine["kind"]) =>
  kind === "add" ? "+" : kind === "rem" ? "−" : " ";

const lineNumbers = computed(() => {
  // Assign sequential numbers skipping "rem" lines (mimics diff viewer behavior)
  let n = 1;
  return (props.blok.lines ?? []).map((l) => {
    if (l.kind === "rem") return n;
    return n++;
  });
});
</script>

<template>
  <div v-editable="blok" class="slide layout-diff">
    <div class="slide-inner">
      <div v-if="blok.eyebrow" class="eyebrow">{{ blok.eyebrow }}</div>
      <h3 v-if="blok.title">{{ blok.title }}</h3>
      <div class="diff-block">
        <div class="diff-head">
          <span v-if="blok.filename" class="filename">{{ blok.filename }}</span>
          <span>{{ counts }}</span>
        </div>
        <div class="diff-body">
          <template v-for="(line, i) in blok.lines ?? []" :key="line._uid">
            <span class="ln" :class="line.kind">{{ lineNumbers[i] }}</span>
            <span class="mark" :class="line.kind">{{ markFor(line.kind) }}</span>
            <span class="code" :class="line.kind">{{ line.line }}</span>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
