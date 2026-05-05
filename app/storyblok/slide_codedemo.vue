<script setup lang="ts">
// Side-by-side: Vue source on the left, live-rendered output on the right. The
// rendering pipeline is identical to slide_livedemo — extracted here as a
// composable would tighten the duplication, but we keep them separate so each
// slide stays a single readable file (consistent with the other slides).

import * as Vue from "vue";
import { compile as compileTemplate } from "@vue/compiler-dom";

type CodeBlock = string | { code?: string; language?: string };

const props = defineProps<{
  blok: {
    eyebrow?: string;
    title?: string;
    filename?: string;
    vue_code?: string;
    code_plugin?: CodeBlock;
    preview_label?: string;
    live_label?: string;
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
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*)<\\/${tag}>`, "i");
  const m = src.match(re);
  return m ? m[1] : "";
}

function buildSetupFn(scriptBody: string): (...args: unknown[]) => Record<string, unknown> {
  const rewritten = scriptBody
    .replace(/import\s*\{([^}]+)\}\s*from\s*['"]vue['"];?/g, (_, names) => `const {${names}} = __vue;`)
    .replace(/import\s+[^;]+;?/g, "");
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
  <div v-editable="blok" class="slide layout-codedemo">
    <div class="slide-inner">
      <div class="head">
        <div>
          <div v-if="blok.eyebrow" class="eyebrow">{{ blok.eyebrow }}</div>
          <h3 v-if="blok.title">{{ blok.title }}</h3>
        </div>
      </div>
      <div class="panes">
        <div class="pane code">
          <div class="pane-head">
            <span class="file">{{ blok.filename || "Component.vue" }}</span>
          </div>
          <pre>{{ sourceCode }}</pre>
        </div>
        <div class="pane demo">
          <div class="pane-head">
            <span>{{ blok.preview_label || "Preview" }}</span>
            <span class="live-dot">{{ blok.live_label || "Live" }}</span>
          </div>
          <div ref="stage" class="stage" />
          <p v-if="compileError" class="compile-error">{{ compileError }}</p>
        </div>
      </div>
    </div>
    <SlideMark :url="blok.repo_url" />
  </div>
</template>

<style scoped>
.compile-error {
  padding: 0.6cqw 1cqw;
  font-family: var(--font-mono);
  font-size: 0.85cqw;
  color: var(--syn-key, var(--accent));
  opacity: 0.75;
  margin: 0;
}
</style>
