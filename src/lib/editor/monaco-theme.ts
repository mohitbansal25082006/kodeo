// src/lib/editor/monaco-theme.ts
import type { editor } from "monaco-editor";

/**
 * A hand-built Monaco theme matching KODEO's own dark palette
 * (design-tokens.ts) rather than Monaco's stock "vs-dark" — this is
 * what makes the editor feel like part of KODEO instead of a VS Code
 * iframe dropped into the page. Colors are hardcoded (not read from
 * CSS variables) because Monaco's theme system takes a static object
 * at `defineTheme` time, not live CSS custom properties; if KODEO
 * ever supports per-user light themes reaching into the editor too,
 * this would need a second theme + a switch keyed off the active
 * theme's `mode`, not a live CSS variable read.
 */
export const KODEO_DARK_THEME: editor.IStandaloneThemeData = {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "comment", foreground: "6b6b70", fontStyle: "italic" },
    { token: "keyword", foreground: "d7fb43" },
    { token: "string", foreground: "a5d6ff" },
    { token: "number", foreground: "f0b072" },
    { token: "regexp", foreground: "f87171" },
    { token: "type", foreground: "7dd3fc" },
    { token: "class", foreground: "7dd3fc" },
    { token: "function", foreground: "e4e4e7" },
    { token: "variable", foreground: "e4e4e7" },
    { token: "constant", foreground: "f0b072" },
    { token: "delimiter", foreground: "a1a1aa" },
    { token: "tag", foreground: "d7fb43" },
    { token: "attribute.name", foreground: "7dd3fc" },
    { token: "attribute.value", foreground: "a5d6ff" },
  ],
  colors: {
    "editor.background": "#0d0d0d",
    "editor.foreground": "#e4e4e7",
    "editorLineNumber.foreground": "#47474a",
    "editorLineNumber.activeForeground": "#a1a1aa",
    "editor.selectionBackground": "#3a402266",
    "editor.inactiveSelectionBackground": "#3a402233",
    "editor.lineHighlightBackground": "#161616",
    "editor.lineHighlightBorder": "#00000000",
    "editorCursor.foreground": "#d7fb43",
    "editorWhitespace.foreground": "#242424",
    "editorIndentGuide.background": "#1a1a1a",
    "editorIndentGuide.activeBackground": "#333333",
    "editorGutter.background": "#0d0d0d",
    "editor.findMatchBackground": "#d7fb4344",
    "editor.findMatchHighlightBackground": "#d7fb4322",
    "scrollbarSlider.background": "#33333366",
    "scrollbarSlider.hoverBackground": "#33333399",
    "scrollbarSlider.activeBackground": "#333333cc",
    "editorWidget.background": "#111111",
    "editorWidget.border": "#242424",
    "editorSuggestWidget.background": "#111111",
    "editorSuggestWidget.border": "#242424",
    "editorSuggestWidget.selectedBackground": "#1a1a1a",
    "editorSuggestWidget.highlightForeground": "#d7fb43",
    "editorHoverWidget.background": "#111111",
    "editorHoverWidget.border": "#242424",
    "minimap.background": "#0d0d0d",
    "minimapSlider.background": "#33333344",
    "minimapSlider.hoverBackground": "#33333366",
    "editorBracketMatch.background": "#3a402244",
    "editorBracketMatch.border": "#d7fb4355",
  },
};

export const KODEO_MONACO_THEME_ID = "kodeo-dark";
