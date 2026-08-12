/**
 * KODEO Design Tokens
 * Single source of truth for values referenced in JS/TS (not pure CSS).
 * Colors here mirror the CSS variables defined in globals.css under @theme.
 * Keep these in sync if you ever change the palette.
 */

export const kodeoColors = {
  bg: "#0a0a0a",
  bgElevated: "#0d0d0d",
  surface: "#111111",
  surfaceHover: "#161616",
  border: "#242424",
  borderStrong: "#333333",
  primary: "#ffffff",
  secondary: "#a1a1aa",
  tertiary: "#6b6b70",
  accent: "#d7fb43",
  accentHover: "#e4ff6b",
  accentActive: "#c2e832",
  success: "#4ade80",
  warning: "#fbbf24",
  danger: "#f87171",
  info: "#60a5fa",
} as const;

export const kodeoFonts = {
  sans: "var(--font-sans)",
  mono: "var(--font-mono)",
} as const;

export const kodeoEasing = {
  default: [0.16, 1, 0.3, 1] as const,
  snappy: [0.34, 1.56, 0.64, 1] as const,
};

export const kodeoMotion = {
  fadeUp: {
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: kodeoEasing.default },
  },
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.5, ease: kodeoEasing.default },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.96 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.4, ease: kodeoEasing.default },
  },
} as const;