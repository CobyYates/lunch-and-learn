<script setup lang="ts">
interface TableRow {
  _uid: string;
  cells?: string; // one cell per line
  highlight?: boolean;
  pill_label?: string;
  pill_kind?: "default" | "ok" | "warn";
}

const props = defineProps<{
  blok: {
    eyebrow?: string;
    title?: string;
    headers?: string; // one header per line
    rows?: TableRow[];
    repo_url?: string;
  };
}>();

const headerCells = computed(() =>
  (props.blok.headers ?? "").split("\n").map((s) => s.trim()).filter(Boolean),
);

const parsedRows = computed(() =>
  (props.blok.rows ?? []).map((r) => ({
    ...r,
    cellList: (r.cells ?? "").split("\n").map((s) => s.trim()).filter(Boolean),
  })),
);
</script>

<template>
  <div v-editable="blok" class="slide layout-table">
    <div class="slide-inner">
      <div v-if="blok.eyebrow" class="eyebrow">{{ blok.eyebrow }}</div>
      <h3 v-if="blok.title">{{ blok.title }}</h3>
      <v-table>
        <thead>
          <tr>
            <th v-for="(h, i) in headerCells" :key="i">{{ h }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in parsedRows"
            :key="row._uid"
            :class="{ highlight: row.highlight }"
          >
            <td v-for="(cell, i) in row.cellList" :key="i">
              <v-chip
                v-if="i === 2 && row.pill_label"
                class="pill"
                :class="row.pill_kind"
                variant="outlined"
                size="x-small"
                label
              >
                {{ row.pill_label }}
              </v-chip>
              <template v-else>{{ cell }}</template>
            </td>
          </tr>
        </tbody>
      </v-table>
    </div>
    <SlideMark :url="blok.repo_url" />
</div>
</template>
