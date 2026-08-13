// src/lib/themes/theme-definitions.ts

export type ThemeMode = "dark" | "light";

export interface ThemeDefinition {
  id: string;
  name: string;
  mode: ThemeMode;
  /** Small 3-dot preview swatch shown in the picker */
  preview: [string, string, string]; // [bg, surface, accent]
  vars: {
    "--color-bg": string;
    "--color-bg-elevated": string;
    "--color-surface": string;
    "--color-surface-hover": string;
    "--color-surface-active": string;
    "--color-border": string;
    "--color-border-strong": string;
    "--color-primary": string;
    "--color-secondary": string;
    "--color-tertiary": string;
    "--color-disabled": string;
    "--color-accent": string;
    "--color-accent-hover": string;
    "--color-accent-active": string;
    "--color-accent-muted": string;
    "--color-accent-dim": string;
  };
}

// ────────────────────────────────────────────────────────────
// DARK THEMES (10)
// ────────────────────────────────────────────────────────────

const kodeoDark: ThemeDefinition = {
  id: "kodeo-dark",
  name: "KODEO Dark",
  mode: "dark",
  preview: ["#0a0a0a", "#111111", "#d7fb43"],
  vars: {
    "--color-bg": "#0a0a0a",
    "--color-bg-elevated": "#0d0d0d",
    "--color-surface": "#111111",
    "--color-surface-hover": "#161616",
    "--color-surface-active": "#1a1a1a",
    "--color-border": "#242424",
    "--color-border-strong": "#333333",
    "--color-primary": "#ffffff",
    "--color-secondary": "#a1a1aa",
    "--color-tertiary": "#6b6b70",
    "--color-disabled": "#47474a",
    "--color-accent": "#d7fb43",
    "--color-accent-hover": "#e4ff6b",
    "--color-accent-active": "#c2e832",
    "--color-accent-muted": "#7d8a3f",
    "--color-accent-dim": "#3a4022",
  },
};

const midnight: ThemeDefinition = {
  id: "midnight",
  name: "Midnight",
  mode: "dark",
  preview: ["#0a0e1a", "#111827", "#60a5fa"],
  vars: {
    "--color-bg": "#0a0e1a",
    "--color-bg-elevated": "#0d1220",
    "--color-surface": "#111827",
    "--color-surface-hover": "#161f34",
    "--color-surface-active": "#1a2440",
    "--color-border": "#22293d",
    "--color-border-strong": "#323d5a",
    "--color-primary": "#f1f5f9",
    "--color-secondary": "#a3aec4",
    "--color-tertiary": "#6b7591",
    "--color-disabled": "#454e66",
    "--color-accent": "#60a5fa",
    "--color-accent-hover": "#7db8fb",
    "--color-accent-active": "#3b8ff5",
    "--color-accent-muted": "#4c74a0",
    "--color-accent-dim": "#1c2c42",
  },
};

const forest: ThemeDefinition = {
  id: "forest",
  name: "Forest",
  mode: "dark",
  preview: ["#0a120d", "#111d16", "#4ade80"],
  vars: {
    "--color-bg": "#0a120d",
    "--color-bg-elevated": "#0d1710",
    "--color-surface": "#111d16",
    "--color-surface-hover": "#16261d",
    "--color-surface-active": "#1a2e23",
    "--color-border": "#22332a",
    "--color-border-strong": "#324a3c",
    "--color-primary": "#f0fdf4",
    "--color-secondary": "#a3c2ae",
    "--color-tertiary": "#6b8b76",
    "--color-disabled": "#45594d",
    "--color-accent": "#4ade80",
    "--color-accent-hover": "#6ee89c",
    "--color-accent-active": "#34c765",
    "--color-accent-muted": "#4c8f65",
    "--color-accent-dim": "#1c3427",
  },
};

const crimson: ThemeDefinition = {
  id: "crimson",
  name: "Crimson",
  mode: "dark",
  preview: ["#140a0a", "#1f1111", "#f87171"],
  vars: {
    "--color-bg": "#140a0a",
    "--color-bg-elevated": "#190d0d",
    "--color-surface": "#1f1111",
    "--color-surface-hover": "#2a1616",
    "--color-surface-active": "#331a1a",
    "--color-border": "#332222",
    "--color-border-strong": "#4a3232",
    "--color-primary": "#fef2f2",
    "--color-secondary": "#c2a3a3",
    "--color-tertiary": "#8b6b6b",
    "--color-disabled": "#594545",
    "--color-accent": "#f87171",
    "--color-accent-hover": "#fb9292",
    "--color-accent-active": "#f24d4d",
    "--color-accent-muted": "#a05c5c",
    "--color-accent-dim": "#3a1c1c",
  },
};

const violet: ThemeDefinition = {
  id: "violet",
  name: "Violet",
  mode: "dark",
  preview: ["#120a1a", "#1a1027", "#a78bfa"],
  vars: {
    "--color-bg": "#120a1a",
    "--color-bg-elevated": "#160d20",
    "--color-surface": "#1a1027",
    "--color-surface-hover": "#231533",
    "--color-surface-active": "#2b1a3f",
    "--color-border": "#2c2240",
    "--color-border-strong": "#40325c",
    "--color-primary": "#f5f3ff",
    "--color-secondary": "#b3a3d4",
    "--color-tertiary": "#7d6b96",
    "--color-disabled": "#4f4560",
    "--color-accent": "#a78bfa",
    "--color-accent-hover": "#bda4fc",
    "--color-accent-active": "#9370f7",
    "--color-accent-muted": "#7d6ba0",
    "--color-accent-dim": "#2c2242",
  },
};

const amber: ThemeDefinition = {
  id: "amber",
  name: "Amber",
  mode: "dark",
  preview: ["#160f08", "#211609", "#fbbf24"],
  vars: {
    "--color-bg": "#160f08",
    "--color-bg-elevated": "#1b1309",
    "--color-surface": "#211609",
    "--color-surface-hover": "#2c1e0c",
    "--color-surface-active": "#38260f",
    "--color-border": "#332a1a",
    "--color-border-strong": "#4d3f24",
    "--color-primary": "#fffbeb",
    "--color-secondary": "#c4b190",
    "--color-tertiary": "#93805c",
    "--color-disabled": "#5c5138",
    "--color-accent": "#fbbf24",
    "--color-accent-hover": "#fdd359",
    "--color-accent-active": "#f0a90a",
    "--color-accent-muted": "#a0863f",
    "--color-accent-dim": "#3a2c12",
  },
};

const teal: ThemeDefinition = {
  id: "teal",
  name: "Teal",
  mode: "dark",
  preview: ["#081514", "#0b1f1e", "#2dd4bf"],
  vars: {
    "--color-bg": "#081514",
    "--color-bg-elevated": "#0a1a19",
    "--color-surface": "#0b1f1e",
    "--color-surface-hover": "#0f2928",
    "--color-surface-active": "#123231",
    "--color-border": "#1a3332",
    "--color-border-strong": "#264c4a",
    "--color-primary": "#f0fdfa",
    "--color-secondary": "#a3c4c1",
    "--color-tertiary": "#6b908c",
    "--color-disabled": "#455d5a",
    "--color-accent": "#2dd4bf",
    "--color-accent-hover": "#54e0cd",
    "--color-accent-active": "#22b8a4",
    "--color-accent-muted": "#3f8a80",
    "--color-accent-dim": "#123430",
  },
};

const rose: ThemeDefinition = {
  id: "rose",
  name: "Rose",
  mode: "dark",
  preview: ["#160a10", "#211018", "#fb7185"],
  vars: {
    "--color-bg": "#160a10",
    "--color-bg-elevated": "#1b0c14",
    "--color-surface": "#211018",
    "--color-surface-hover": "#2c1420",
    "--color-surface-active": "#381828",
    "--color-border": "#332030",
    "--color-border-strong": "#4d2f47",
    "--color-primary": "#fff1f4",
    "--color-secondary": "#c4a3b2",
    "--color-tertiary": "#936b7d",
    "--color-disabled": "#5c4552",
    "--color-accent": "#fb7185",
    "--color-accent-hover": "#fc93a2",
    "--color-accent-active": "#f9506a",
    "--color-accent-muted": "#a05c6c",
    "--color-accent-dim": "#3a1c26",
  },
};

const graphite: ThemeDefinition = {
  id: "graphite",
  name: "Graphite",
  mode: "dark",
  preview: ["#0c0c0c", "#161616", "#e4e4e7"],
  vars: {
    "--color-bg": "#0c0c0c",
    "--color-bg-elevated": "#101010",
    "--color-surface": "#161616",
    "--color-surface-hover": "#1c1c1c",
    "--color-surface-active": "#232323",
    "--color-border": "#282828",
    "--color-border-strong": "#3a3a3a",
    "--color-primary": "#fafafa",
    "--color-secondary": "#a1a1a1",
    "--color-tertiary": "#6e6e6e",
    "--color-disabled": "#454545",
    "--color-accent": "#e4e4e7",
    "--color-accent-hover": "#f4f4f5",
    "--color-accent-active": "#d4d4d8",
    "--color-accent-muted": "#8e8e91",
    "--color-accent-dim": "#2a2a2d",
  },
};

const ocean: ThemeDefinition = {
  id: "ocean",
  name: "Ocean",
  mode: "dark",
  preview: ["#061219", "#0a1c26", "#38bdf8"],
  vars: {
    "--color-bg": "#061219",
    "--color-bg-elevated": "#08161e",
    "--color-surface": "#0a1c26",
    "--color-surface-hover": "#0e2530",
    "--color-surface-active": "#122e3b",
    "--color-border": "#1a323f",
    "--color-border-strong": "#26495a",
    "--color-primary": "#f0f9ff",
    "--color-secondary": "#a3c2d4",
    "--color-tertiary": "#6b8fa0",
    "--color-disabled": "#455a66",
    "--color-accent": "#38bdf8",
    "--color-accent-hover": "#65cbfa",
    "--color-accent-active": "#0ea5e9",
    "--color-accent-muted": "#3d80a0",
    "--color-accent-dim": "#123344",
  },
};

// ────────────────────────────────────────────────────────────
// LIGHT THEMES (10)
// ────────────────────────────────────────────────────────────

const kodeoLight: ThemeDefinition = {
  id: "kodeo-light",
  name: "KODEO Light",
  mode: "light",
  preview: ["#ffffff", "#f7f8f5", "#8fae0f"],
  vars: {
    "--color-bg": "#ffffff",
    "--color-bg-elevated": "#fafbf7",
    "--color-surface": "#f4f6ef",
    "--color-surface-hover": "#eceef0",
    "--color-surface-active": "#e6e8e0",
    "--color-border": "#e2e4dc",
    "--color-border-strong": "#cfd2c6",
    "--color-primary": "#0e1210",
    "--color-secondary": "#52584c",
    "--color-tertiary": "#83887c",
    "--color-disabled": "#b7bab0",
    "--color-accent": "#7ea312",
    "--color-accent-hover": "#6c8c0f",
    "--color-accent-active": "#5c780c",
    "--color-accent-muted": "#a6bd6e",
    "--color-accent-dim": "#eef4dc",
  },
};

const solarized: ThemeDefinition = {
  id: "solarized",
  name: "Solarized",
  mode: "light",
  preview: ["#fdf6e3", "#eee8d5", "#268bd2"],
  vars: {
    "--color-bg": "#fdf6e3",
    "--color-bg-elevated": "#faf2da",
    "--color-surface": "#eee8d5",
    "--color-surface-hover": "#e6dfc7",
    "--color-surface-active": "#ded6b8",
    "--color-border": "#d8cfb0",
    "--color-border-strong": "#c2b896",
    "--color-primary": "#073642",
    "--color-secondary": "#586e75",
    "--color-tertiary": "#839496",
    "--color-disabled": "#b0aa93",
    "--color-accent": "#268bd2",
    "--color-accent-hover": "#2f9fee",
    "--color-accent-active": "#1f77b4",
    "--color-accent-muted": "#6ba3c9",
    "--color-accent-dim": "#dceaf5",
  },
};

const paper: ThemeDefinition = {
  id: "paper",
  name: "Paper",
  mode: "light",
  preview: ["#ffffff", "#f5f5f4", "#1c1917"],
  vars: {
    "--color-bg": "#ffffff",
    "--color-bg-elevated": "#fafaf9",
    "--color-surface": "#f5f5f4",
    "--color-surface-hover": "#ebebe9",
    "--color-surface-active": "#e2e1de",
    "--color-border": "#e7e5e4",
    "--color-border-strong": "#d3d1cf",
    "--color-primary": "#1c1917",
    "--color-secondary": "#57534e",
    "--color-tertiary": "#8a8683",
    "--color-disabled": "#c0bdba",
    "--color-accent": "#1c1917",
    "--color-accent-hover": "#3a3532",
    "--color-accent-active": "#0c0a09",
    "--color-accent-muted": "#78746f",
    "--color-accent-dim": "#ececea",
  },
};

const sky: ThemeDefinition = {
  id: "sky",
  name: "Sky",
  mode: "light",
  preview: ["#f0f9ff", "#e0f2fe", "#0284c7"],
  vars: {
    "--color-bg": "#f0f9ff",
    "--color-bg-elevated": "#e9f5fe",
    "--color-surface": "#e0f2fe",
    "--color-surface-hover": "#d3ecfd",
    "--color-surface-active": "#c3e4fc",
    "--color-border": "#bde3fb",
    "--color-border-strong": "#95d1f7",
    "--color-primary": "#0c2a3d",
    "--color-secondary": "#3d5c70",
    "--color-tertiary": "#6f8ea0",
    "--color-disabled": "#a9c1cf",
    "--color-accent": "#0284c7",
    "--color-accent-hover": "#0296e0",
    "--color-accent-active": "#0369a1",
    "--color-accent-muted": "#4f9dc2",
    "--color-accent-dim": "#d5edfa",
  },
};

const blossom: ThemeDefinition = {
  id: "blossom",
  name: "Blossom",
  mode: "light",
  preview: ["#fff5f7", "#ffe4e9", "#e11d48"],
  vars: {
    "--color-bg": "#fff5f7",
    "--color-bg-elevated": "#ffeef1",
    "--color-surface": "#ffe4e9",
    "--color-surface-hover": "#fed7de",
    "--color-surface-active": "#fdc8d2",
    "--color-border": "#fbc7d0",
    "--color-border-strong": "#f7a5b5",
    "--color-primary": "#3d0b16",
    "--color-secondary": "#6b2f3c",
    "--color-tertiary": "#9c6975",
    "--color-disabled": "#cba3ab",
    "--color-accent": "#e11d48",
    "--color-accent-hover": "#f13d63",
    "--color-accent-active": "#be123c",
    "--color-accent-muted": "#c2617c",
    "--color-accent-dim": "#fce0e6",
  },
};

const sand: ThemeDefinition = {
  id: "sand",
  name: "Sand",
  mode: "light",
  preview: ["#fdfaf4", "#f5efe1", "#c2793a"],
  vars: {
    "--color-bg": "#fdfaf4",
    "--color-bg-elevated": "#faf5ea",
    "--color-surface": "#f5efe1",
    "--color-surface-hover": "#ede4d0",
    "--color-surface-active": "#e4d8bd",
    "--color-border": "#e3d7bf",
    "--color-border-strong": "#cdbb96",
    "--color-primary": "#2e2416",
    "--color-secondary": "#5c4d38",
    "--color-tertiary": "#8f7c60",
    "--color-disabled": "#c2b494",
    "--color-accent": "#c2793a",
    "--color-accent-hover": "#d68a48",
    "--color-accent-active": "#a8632b",
    "--color-accent-muted": "#c19468",
    "--color-accent-dim": "#f1e2cc",
  },
};

const mint: ThemeDefinition = {
  id: "mint",
  name: "Mint",
  mode: "light",
  preview: ["#f0fdf9", "#dcfce9", "#10b981"],
  vars: {
    "--color-bg": "#f0fdf9",
    "--color-bg-elevated": "#e6fbf3",
    "--color-surface": "#dcfce9",
    "--color-surface-hover": "#c8f5dc",
    "--color-surface-active": "#b3edcf",
    "--color-border": "#b9ecd4",
    "--color-border-strong": "#8adfb8",
    "--color-primary": "#052e21",
    "--color-secondary": "#155a41",
    "--color-tertiary": "#4d8a6c",
    "--color-disabled": "#9dc9b1",
    "--color-accent": "#10b981",
    "--color-accent-hover": "#13ce92",
    "--color-accent-active": "#0a9c6c",
    "--color-accent-muted": "#4fae8a",
    "--color-accent-dim": "#c3f2df",
  },
};

const lavender: ThemeDefinition = {
  id: "lavender",
  name: "Lavender",
  mode: "light",
  preview: ["#f8f7ff", "#ede9fe", "#7c3aed"],
  vars: {
    "--color-bg": "#f8f7ff",
    "--color-bg-elevated": "#f2effe",
    "--color-surface": "#ede9fe",
    "--color-surface-hover": "#e2dcfd",
    "--color-surface-active": "#d5cbfb",
    "--color-border": "#dbd2fa",
    "--color-border-strong": "#c0aef6",
    "--color-primary": "#20123d",
    "--color-secondary": "#4c3a70",
    "--color-tertiary": "#7c6a9c",
    "--color-disabled": "#b7a9d4",
    "--color-accent": "#7c3aed",
    "--color-accent-hover": "#8f57f0",
    "--color-accent-active": "#6d28d9",
    "--color-accent-muted": "#9575c4",
    "--color-accent-dim": "#e6ddfb",
  },
};

const slate: ThemeDefinition = {
  id: "slate",
  name: "Slate",
  mode: "light",
  preview: ["#f8fafc", "#f1f5f9", "#334155"],
  vars: {
    "--color-bg": "#f8fafc",
    "--color-bg-elevated": "#f4f7fa",
    "--color-surface": "#f1f5f9",
    "--color-surface-hover": "#e7edf3",
    "--color-surface-active": "#dbe4ed",
    "--color-border": "#e2e8f0",
    "--color-border-strong": "#cbd5e1",
    "--color-primary": "#0f172a",
    "--color-secondary": "#475569",
    "--color-tertiary": "#94a3b8",
    "--color-disabled": "#c3ccd8",
    "--color-accent": "#334155",
    "--color-accent-hover": "#475569",
    "--color-accent-active": "#1e293b",
    "--color-accent-muted": "#64748b",
    "--color-accent-dim": "#e2e8f0",
  },
};

export const THEMES: ThemeDefinition[] = [
  kodeoDark,
  midnight,
  forest,
  crimson,
  violet,
  amber,
  teal,
  rose,
  graphite,
  ocean,
  kodeoLight,
  solarized,
  paper,
  sky,
  blossom,
  sand,
  mint,
  lavender,
  slate,
];

// One more to round out to exactly 20 — a warm dark theme distinct from amber.
const cocoa: ThemeDefinition = {
  id: "cocoa",
  name: "Cocoa",
  mode: "dark",
  preview: ["#150f0c", "#1f1712", "#e0a56f"],
  vars: {
    "--color-bg": "#150f0c",
    "--color-bg-elevated": "#1a130f",
    "--color-surface": "#1f1712",
    "--color-surface-hover": "#291e17",
    "--color-surface-active": "#33261c",
    "--color-border": "#332821",
    "--color-border-strong": "#4d3c30",
    "--color-primary": "#fbf1e8",
    "--color-secondary": "#c4ac97",
    "--color-tertiary": "#93795f",
    "--color-disabled": "#5c4d3d",
    "--color-accent": "#e0a56f",
    "--color-accent-hover": "#eab98c",
    "--color-accent-active": "#d1904f",
    "--color-accent-muted": "#a3835f",
    "--color-accent-dim": "#3a2a19",
  },
};

THEMES.push(cocoa);

export const DARK_THEMES = THEMES.filter((t) => t.mode === "dark");
export const LIGHT_THEMES = THEMES.filter((t) => t.mode === "light");

export function getThemeById(id: string): ThemeDefinition {
  return THEMES.find((t) => t.id === id) ?? kodeoDark;
}

export const DEFAULT_THEME_ID = "kodeo-dark";