<script setup lang="ts">
// Live Vue demo: compile a single-file Vue snippet from the editor field and
// render it inside the .stage. Strategy:
//
//   1. Pull the <template> and (optional) <script setup> blocks out of the
//      source string with simple regex (no SFC parser needed).
//   2. Compile the template to a render function string with @vue/compiler-dom,
//      then `new Function(...)` to materialise it.
//   3. Execute the <script setup> body inside a `setup()` function. `import { x }
//      from 'vue'` lines are rewritten to destructure from the live `vue` runtime
//      instead so users can write the snippet with normal-looking imports.
//   4. Mount via `createApp` into the <div ref="stage">. Re-mount whenever the
//      source code changes (visual editor live edits).
//
// Falls back to `fallback_html` if anything fails — the slide stays useful even
// when the snippet is mid-edit.

import * as Vue from "vue";
import { compile as compileTemplate } from "@vue/compiler-dom";

type CodeBlock = string | { code?: string; language?: string };

const props = defineProps<{
  blok: {
    eyebrow?: string;
    title?: string;
    badge_text?: string;
    vue_code?: string;
    code_plugin?: CodeBlock;
    fallback_html?: string;
    repo_url?: string;
  };
}>();

const sourceCode = computed(() => {
  const plug = props.blok.code_plugin;
  const fromPlugin = !plug ? "" : typeof plug === "string" ? plug : (plug.code ?? "");
  return (fromPlugin || props.blok.vue_code || "").trim();
});

const stage = ref<HTMLDivElement | null>(null);
const compileError = ref<string>("");
let mountedApp: { unmount(): void } | null = null;

function extractBlock(src: string, tag: "template" | "script"): string {
  // Greedy match on the LAST closing tag so a snippet with nested HTML still works.
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*)<\\/${tag}>`, "i");
  const m = src.match(re);
  return m ? m[1] : "";
}

function buildSetupFn(scriptBody: string): (...args: unknown[]) => Record<string, unknown> {
  // Replace `import { ref, computed } from 'vue'` with destructure from the
  // injected runtime so the snippet doesn't need a real module loader. Kill any
  // other imports — the snippet has to be self-contained.
  const rewritten = scriptBody
    .replace(/import\s*\{([^}]+)\}\s*from\s*['"]vue['"];?/g, (_, names) => `const {${names}} = __vue;`)
    .replace(/import\s+[^;]+;?/g, "");
  // Wrap so any top-level `const`/`let`/`function` becomes part of the returned scope.
  // We collect identifiers via a simple scan and build the return object.
  const idents = new Set<string>();
  for (const m of rewritten.matchAll(/\b(?:const|let|var|function)\s+([A-Za-z_$][\w$]*)/g)) {
    idents.add(m[1]);
  }
  const returnObj = `{${[...idents].join(", ")}}`;
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  return new Function("__vue", `${rewritten}\nreturn ${returnObj};`) as never;
}

async function renderDemo() {
  if (!stage.value) return;
  if (mountedApp) {
    mountedApp.unmount();
    mountedApp = null;
  }
  stage.value.innerHTML = "";
  compileError.value = "";

  const code = sourceCode.value;
  if (!code) {
    if (props.blok.fallback_html) stage.value.innerHTML = props.blok.fallback_html;
    return;
  }

  try {
    const templateSrc = extractBlock(code, "template").trim();
    const scriptBody = extractBlock(code, "script");
    if (!templateSrc) throw new Error("Snippet must contain a <template> block.");

    // Compile template → render function source.
    const { code: renderSource } = compileTemplate(templateSrc, {
      mode: "function",
      prefixIdentifiers: true,
      hoistStatic: false,
    });
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const renderFactory = new Function("Vue", `${renderSource}\nreturn render;`);
    const renderFn = renderFactory(Vue) as (..._: unknown[]) => unknown;

    const setupFn = scriptBody.trim() ? buildSetupFn(scriptBody) : () => ({});

    const componentDef = Vue.defineComponent({
      setup: () => setupFn(Vue),
      render: renderFn,
    });

    const app = Vue.createApp(componentDef);
    app.config.errorHandler = (err) => {
      compileError.value = (err as Error)?.message ?? String(err);
    };
    app.mount(stage.value);
    mountedApp = app;
  } catch (err) {
    compileError.value = (err as Error)?.message ?? String(err);
    if (props.blok.fallback_html) stage.value.innerHTML = props.blok.fallback_html;
  }
}

onMounted(renderDemo);
watch(sourceCode, renderDemo);
onBeforeUnmount(() => {
  if (mountedApp) mountedApp.unmount();
});
</script>

<template>
  <div v-editable="blok" class="slide layout-livedemo">
    <div class="slide-inner">
      <div class="head">
        <div>
          <div v-if="blok.eyebrow" class="eyebrow">{{ blok.eyebrow }}</div>
          <h3 v-if="blok.title">{{ blok.title }}</h3>
        </div>
        <span v-if="blok.badge_text" class="badge">
          <span class="vue-mark" />
          {{ blok.badge_text }}
        </span>
      </div>
      <div ref="stage" class="stage" />
      <p v-if="compileError" class="compile-error">{{ compileError }}</p>
    </div>
    <SlideMark :url="blok.repo_url" />
  </div>
</template>

<style scoped>
.compile-error {
  position: absolute;
  bottom: 1cqw;
  left: 1cqw;
  right: 1cqw;
  font-family: var(--font-mono);
  font-size: 0.85cqw;
  color: var(--syn-key, var(--accent));
  opacity: 0.75;
  margin: 0;
}
</style>
