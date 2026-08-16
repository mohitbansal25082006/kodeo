"use client";

/**
 * y-monaco's MonacoBinding renders remote selections/cursors as
 * Monaco decorations with CSS class names derived from each remote
 * client's awareness `clientID` (classes like
 * `yRemoteSelection-<clientID>` and `yRemoteSelectionHead-<clientID>`
 * — see y-monaco's own source for the exact naming), but it does NOT
 * inject any actual CSS for those classes — every consuming app is
 * expected to supply its own styling. This module maintains one
 * <style> element per mounted editor and keeps it in sync with the
 * awareness states currently present, so each remote collaborator's
 * cursor/selection renders in THEIR assigned color with a small
 * name-label flag, matching KODEO's own visual language rather than
 * an unstyled default.
 */

export interface RemoteAwarenessUser {
  clientId: number;
  name: string;
  color: string;
}

const STYLE_ELEMENT_ID_PREFIX = "kodeo-yjs-remote-cursor-style-";

/**
 * Rebuilds the <style> block for one editor instance from the current
 * set of remote users. Cheap enough to call on every awareness
 * "change" event (typically a handful of users, a few times a
 * second at most during active cursor movement) — no diffing needed.
 */
export function updateRemoteCursorStyles(editorInstanceId: string, users: RemoteAwarenessUser[]): void {
  if (typeof document === "undefined") return;

  const elementId = STYLE_ELEMENT_ID_PREFIX + editorInstanceId;
  let styleEl = document.getElementById(elementId) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = elementId;
    document.head.appendChild(styleEl);
  }

  const css = users
    .map(({ clientId, name, color }) => {
      const safeName = escapeCssContent(name || "Anonymous");
      return `
.yRemoteSelection-${clientId} {
  background-color: ${color}33;
}
.yRemoteSelectionHead-${clientId} {
  position: absolute;
  border-left: 2px solid ${color};
  border-top: 2px solid ${color};
  height: 100%;
}
.yRemoteSelectionHead-${clientId}::after {
  content: "${safeName}";
  position: absolute;
  top: -1.35em;
  left: -2px;
  font-size: 11px;
  font-family: var(--font-sans, ui-sans-serif, sans-serif);
  font-weight: 600;
  line-height: 1.4;
  padding: 1px 6px;
  border-radius: 4px 4px 4px 0;
  background: ${color};
  color: #08090a;
  white-space: nowrap;
  pointer-events: none;
  z-index: 30;
}`;
    })
    .join("\n");

  styleEl.textContent = css;
}

export function removeRemoteCursorStyles(editorInstanceId: string): void {
  if (typeof document === "undefined") return;
  const elementId = STYLE_ELEMENT_ID_PREFIX + editorInstanceId;
  document.getElementById(elementId)?.remove();
}

/** Minimal escaping for interpolation into a CSS `content` string — strips characters that could break out of the quoted string or inject additional CSS. Display names are user-controlled (Part 1c profile editing), so this must not be skipped. */
function escapeCssContent(value: string): string {
  return value.replace(/["\\]/g, "").replace(/[\r\n]/g, " ").slice(0, 40);
}
