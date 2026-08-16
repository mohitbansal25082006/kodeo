// src/components/editor/tab-bar.tsx
"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EditorTab } from "@/lib/editor/tabs-store";

interface TabBarProps {
  tabs: EditorTab[];
  activeTabId: string | null;
  isDirty: (nodeId: string) => boolean;
  onActivate: (nodeId: string) => void;
  onClose: (nodeId: string) => void;
  onCloseOthers: (nodeId: string) => void;
  onCloseAll: () => void;
}

export function TabBar({ tabs, activeTabId, isDirty, onActivate, onClose, onCloseOthers, onCloseAll }: TabBarProps) {
  const [menuNodeId, setMenuNodeId] = React.useState<string | null>(null);

  if (tabs.length === 0) return null;

  return (
    <div className="flex items-stretch overflow-x-auto border-b border-border bg-bg-elevated">
      {tabs.map((tab) => {
        const active = tab.nodeId === activeTabId;
        const dirty = isDirty(tab.nodeId);

        return (
          <div
            key={tab.nodeId}
            className={cn(
              "group relative flex shrink-0 items-center gap-2 border-r border-border px-3 py-2 text-xs transition-colors",
              active ? "bg-bg text-primary" : "text-tertiary hover:bg-surface hover:text-secondary"
            )}
          >
            <button
              onClick={() => onActivate(tab.nodeId)}
              onContextMenu={(e) => {
                e.preventDefault();
                setMenuNodeId(tab.nodeId);
              }}
              className="max-w-[10rem] truncate font-mono-tech"
              title={tab.path}
            >
              {tab.name}
            </button>

            {dirty ? (
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                aria-label="Unsaved changes"
                title="Unsaved changes"
              />
            ) : (
              <button
                onClick={() => onClose(tab.nodeId)}
                className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded text-tertiary opacity-0 transition-opacity hover:bg-surface-hover hover:text-primary group-hover:opacity-100"
                aria-label={`Close ${tab.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            )}

            {/* When dirty, the dot occupies the close button's slot (matches VS Code's convention: hover reveals the X even over a dirty dot) — shown on hover only, so the dot doesn't jump around on every keystroke. */}
            {dirty && (
              <button
                onClick={() => onClose(tab.nodeId)}
                className="absolute right-2 top-1/2 hidden h-3.5 w-3.5 -translate-y-1/2 items-center justify-center rounded text-tertiary opacity-0 transition-opacity hover:bg-surface-hover hover:text-primary group-hover:flex group-hover:opacity-100"
                aria-label={`Close ${tab.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            )}

            {active && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-accent" />}

            {menuNodeId === tab.nodeId && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setMenuNodeId(null)} />
                <div className="absolute left-0 top-full z-30 mt-1 w-40 rounded-xl border border-border bg-bg-elevated p-1.5 shadow-elevated">
                  <button
                    onClick={() => {
                      setMenuNodeId(null);
                      onClose(tab.nodeId);
                    }}
                    className="flex w-full items-center rounded-lg px-2.5 py-2 text-left text-xs font-medium text-secondary transition-colors hover:bg-surface hover:text-primary"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setMenuNodeId(null);
                      onCloseOthers(tab.nodeId);
                    }}
                    className="flex w-full items-center rounded-lg px-2.5 py-2 text-left text-xs font-medium text-secondary transition-colors hover:bg-surface hover:text-primary"
                  >
                    Close others
                  </button>
                  <button
                    onClick={() => {
                      setMenuNodeId(null);
                      onCloseAll();
                    }}
                    className="flex w-full items-center rounded-lg px-2.5 py-2 text-left text-xs font-medium text-secondary transition-colors hover:bg-surface hover:text-primary"
                  >
                    Close all
                  </button>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
