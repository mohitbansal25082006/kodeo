// src/components/auth/password-strength.tsx
"use client";

import { cn } from "@/lib/utils";

interface PasswordStrengthProps {
  password: string;
}

function getStrength(password: string) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(score, 4);
}

const LABELS = ["Weak", "Fair", "Good", "Strong"];
const COLORS = ["bg-danger", "bg-warning", "bg-info", "bg-success"];

export function PasswordStrength({ password }: PasswordStrengthProps) {
  if (!password) return null;
  const strength = getStrength(password);
  const level = Math.max(strength - 1, 0);

  return (
    <div className="mt-2">
      <div className="flex gap-1.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full bg-border transition-colors duration-300",
              i <= level && strength > 0 && COLORS[level]
            )}
          />
        ))}
      </div>
      <p className="mt-1.5 text-xs text-tertiary">
        Password strength: <span className="text-secondary">{LABELS[level]}</span>
      </p>
    </div>
  );
}