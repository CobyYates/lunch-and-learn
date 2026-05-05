<script setup lang="ts">
const props = defineProps<{
  blok: {
    eyebrow?: string;
    title?: string;
    tree?: string;
    callouts?: string; // one per line, format: "Key | body"
    repo_url?: string;
  };
}>();

const parsedCallouts = computed(() =>
  (props.blok.callouts ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [k, ...rest] = l.split("|").map((s) => s.trim());
      return { k, body: rest.join(" | ") };
    }),
);
</script>

<template>
  <div v-editable="blok" class="slide layout-tree">
    <div class="slide-inner">
      <div v-if="blok.eyebrow" class="eyebrow">{{ blok.eyebrow }}</div>
      <h3 v-if="blok.title">{{ blok.title }}</h3>
      <div class="cols">
        <pre class="tree">{{ blok.tree }}</pre>
        <div v-if="parsedCallouts.length" class="callouts">
          <div v-for="(c, i) in parsedCallouts" :key="i" class="callout">
            <span class="k">{{ c.k }}</span>
            <p>{{ c.body }}</p>
          </div>
        </div>
      </div>
    </div>
    <SlideMark :url="blok.repo_url" />
</div>
</template>
