// src/components/auth/divider.tsx
export function AuthDivider({ text = "or" }: { text?: string }) {
  return (
    <div className="my-6 flex items-center gap-3">
      <div className="h-px flex-1 bg-border" />
      <span className="text-xs font-medium uppercase tracking-wider text-tertiary">
        {text}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}