// src/lib/filesystem/types.ts

export type NodeType = "file" | "folder";

/** A single project_node row, as returned from the database. */
export interface ProjectNode {
  id: string;
  projectId: string;
  parentId: string | null;
  type: NodeType;
  name: string;
  /** Always "" for folders. Omitted entirely from list/tree responses (see ProjectNodeSummary) to keep tree payloads small — fetched separately per-file on open. */
  content: string;
  size: number;
  path: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * The shape used everywhere the file tree is rendered or transmitted
 * over the wire — every field from ProjectNode except `content`.
 * A project can easily have hundreds of files; shipping every file's
 * full text on every tree fetch would make the explorer slow to load
 * and mostly wasted, since only a handful of files are open in tabs
 * at once. Content is fetched per-file, on demand, when a tab opens.
 */
export type ProjectNodeSummary = Omit<ProjectNode, "content">;

/** A ProjectNodeSummary augmented with a `children` array — the shape the tree UI actually consumes. */
export interface ProjectNodeTree extends ProjectNodeSummary {
  children: ProjectNodeTree[];
}

export const MAX_NAME_LENGTH = 255;
export const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB per file — generous for source code, guards against pasting huge blobs into a text column.

/**
 * Characters disallowed in a file/folder name — mirrors what every
 * major OS forbids (Windows is the strictest common denominator) so
 * a name that's valid in KODEO is also safe if ever exported to a
 * real filesystem (zip download, git export, etc. — future parts).
 */
// eslint-disable-next-line no-control-regex
export const INVALID_NAME_CHARS = /[/\\:*?"<>|\x00-\x1f]/;

export const RESERVED_NAMES = new Set([".", "..", ".git", ".DS_Store"]);

export function isValidNodeName(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim();
  if (trimmed.length === 0) return { valid: false, error: "Name cannot be empty." };
  if (trimmed.length > MAX_NAME_LENGTH) return { valid: false, error: "Name is too long." };
  if (INVALID_NAME_CHARS.test(trimmed)) {
    return { valid: false, error: `Name cannot contain: / \\ : * ? " < > |` };
  }
  if (RESERVED_NAMES.has(trimmed)) return { valid: false, error: "That name is reserved." };
  if (trimmed.endsWith(".")) return { valid: false, error: "Name cannot end with a period." };
  return { valid: true };
}

/** Common source extensions mapped to Monaco language IDs — used for syntax highlighting and file-type icons alike. */
export const LANGUAGE_BY_EXTENSION: Record<string, string> = {
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  ts: "typescript",
  tsx: "typescript",
  json: "json",
  jsonc: "jsonc",
  html: "html",
  htm: "html",
  css: "css",
  scss: "scss",
  sass: "scss",
  less: "less",
  md: "markdown",
  mdx: "markdown",
  py: "python",
  rb: "ruby",
  go: "go",
  rs: "rust",
  java: "java",
  kt: "kotlin",
  c: "c",
  h: "c",
  cpp: "cpp",
  hpp: "cpp",
  cs: "csharp",
  php: "php",
  swift: "swift",
  sql: "sql",
  sh: "shell",
  bash: "shell",
  zsh: "shell",
  yml: "yaml",
  yaml: "yaml",
  toml: "ini",
  ini: "ini",
  env: "shell",
  xml: "xml",
  svg: "xml",
  graphql: "graphql",
  gql: "graphql",
  dockerfile: "dockerfile",
  vue: "html",
  txt: "plaintext",
  gitignore: "plaintext",
};

export function getLanguageForFile(name: string): string {
  const lower = name.toLowerCase();
  if (lower === "dockerfile") return "dockerfile";
  if (lower === "makefile") return "plaintext";
  const ext = lower.includes(".") ? lower.slice(lower.lastIndexOf(".") + 1) : "";
  return LANGUAGE_BY_EXTENSION[ext] ?? "plaintext";
}
