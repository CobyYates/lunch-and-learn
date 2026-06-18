import hljs from "highlight.js/lib/common";

// highlight.js language aliases for the values authors are likely to type in
// the slide `language` field. Anything not mapped is passed through as-is and,
// if highlight.js still doesn't recognise it, we fall back to auto-detection.
const ALIASES: Record<string, string> = {
  vue: "xml", // SFCs highlight reasonably as markup; script falls back to auto
  ts: "typescript",
  js: "javascript",
  jsx: "javascript", // React (JS)
  tsx: "typescript", // React (TS)
  react: "javascript",
  angular: "typescript", // component code; templates are HTML
  svelte: "xml",
  sh: "bash",
  shell: "bash",
  zsh: "bash",
  yml: "yaml",
  html: "xml",
};

/**
 * Syntax-highlight a code string with highlight.js, returning HTML whose token
 * classes (`hljs-keyword`, `hljs-string`, …) are mapped to the active slide
 * theme's `--syn-*` colour variables in slides.css. The output is already
 * HTML-escaped by highlight.js, so it's safe to drop in via `v-html`.
 */
export function useHighlight() {
  function highlight(code?: string, language?: string): string {
    const src = code ?? "";
    if (!src.trim()) return "";

    const raw = (language || "").trim().toLowerCase();
    const lang = ALIASES[raw] ?? raw;

    try {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(src, { language: lang, ignoreIllegals: true })
          .value;
      }
      // Unknown/blank language → let highlight.js guess.
      return hljs.highlightAuto(src).value;
    } catch {
      // Should never happen, but never break the slide over highlighting.
      return src.replace(/[&<>]/g, (c) =>
        c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;",
      );
    }
  }

  return { highlight };
}
