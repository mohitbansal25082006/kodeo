// src/components/settings/settings-section.tsx
import { cn } from "@/lib/utils";

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  danger?: boolean;
  className?: string;
}

export function SettingsSection({
  title,
  description,
  children,
  danger,
  className,
}: SettingsSectionProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-surface/50 p-5 sm:p-6",
        danger ? "border-danger/25" : "border-border",
        className
      )}
    >
      <h3 className={cn("text-sm font-semibold", danger ? "text-danger" : "text-primary")}>
        {title}
      </h3>
      {description && (
        <p className="mt-1 text-sm text-secondary">{description}</p>
      )}
      <div className="mt-5">{children}</div>
    </div>
  );
}