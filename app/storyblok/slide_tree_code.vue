<script setup lang="ts">
// File tree (left) + that file's source (right). The tree is authored as plain
// text with a tiny markup so authors never have to write <span>s:
//   • keep the ├──, └──, │ characters + spaces to draw the branches
//   • end a name with "/"        → folder (accent colour)
//   • wrap a name in *asterisks*  → the focused/active file (highlight + ▸)
//   • add "  # note" after a name → muted italic note
// The code pane is syntax-highlighted by `language` (see useHighlight) and
// coloured by the active theme's --syn-* variables.
const props = defineProps<{
  blok: {
    eyebrow?: string;
    title?: string;
    tree_label?: string;
    tree_root?: string;
    tree?: string;
    filename?: string;
    file_path?: string;
    language?: string;
    code?: string;
    repo_url?: string;
  };
}>();

const esc = (s: string) =>
  s.replace(/[&<>]/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;",
  );

const treeHtml = computed(() => {
  const lines = (props.blok.tree ?? "").split("\n");
  return lines
    .map((raw) => {
      // Separate the branch/indent prefix from the entry name.
      const m = raw.match(/^([\s│├└─]*)(.*)$/);
      const prefix = m?.[1] ?? "";
      let rest = m?.[2] ?? "";
      if (!rest) return esc(prefix); // blank or pure-structure line

      // Trailing "  # note"
      let note = "";
      const nm = rest.match(/\s+#\s?(.*)$/);
      if (nm) {
        note = nm[1] ?? "";
        rest = rest.slice(0, nm.index);
      }

      // Active file marked with *asterisks*
      let active = false;
      const am = rest.match(/^\*(.+)\*$/);
      if (am) {
        active = true;
        rest = am[1] ?? "";
      }

      const cls = active ? "active" : rest.endsWith("/") ? "dir" : "file";
      let html = `${esc(prefix)}<span class="${cls}">${esc(rest)}</span>`;
      if (note) html += ` <span class="note"># ${esc(note)}</span>`;
      return html;
    })
    .join("\n");
});

const { highlight } = useHighlight();
const codeHtml = computed(() =>
  highlight(props.blok.code, props.blok.language),
);
</script>

<template>
  <div v-editable="blok" class="slide layout-tree-code">
    <div class="slide-inner">
      <div class="head">
        <div>
          <div v-if="blok.eyebrow" class="eyebrow">{{ blok.eyebrow }}</div>
          <h3 v-if="blok.title">{{ blok.title }}</h3>
        </div>
      </div>
      <div class="panes">
        <div class="pane tree-pane">
          <div class="pane-head">
            <span>{{ blok.tree_label || "Explorer" }}</span>
            <span v-if="blok.tree_root" class="path-crumb">{{ blok.tree_root }}</span>
          </div>
          <pre class="tree" v-html="treeHtml" />
        </div>
        <div class="pane code-pane">
          <div class="pane-head">
            <span class="filename">{{ blok.filename }}</span>
            <span v-if="blok.file_path" class="path-crumb">{{ blok.file_path }}</span>
          </div>
          <pre class="hljs" v-html="codeHtml" />
        </div>
      </div>
    </div>
    <SlideMark :url="blok.repo_url" />
  </div>
</template>
