// src/components/settings/delete-account-modal.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Lock, X, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface DeleteAccountModalProps {
  open: boolean;
  onClose: () => void;
  hasPassword: boolean;
  userEmail: string;
}

export function DeleteAccountModal({
  open,
  onClose,
  hasPassword,
  userEmail,
}: DeleteAccountModalProps) {
  const router = useRouter();
  const [confirmText, setConfirmText] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const confirmMatches = confirmText === "delete my account";

  React.useEffect(() => {
    if (!open) {
      setConfirmText("");
      setPassword("");
      setError(null);
    }
  }, [open]);

  async function handleDelete() {
    setError(null);
    if (!confirmMatches) return;
    if (hasPassword && !password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/account/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: hasPassword ? password : undefined }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
      />
      <div className="animate-scale-in relative w-full max-w-md rounded-2xl border border-danger/30 bg-bg-elevated p-6 shadow-elevated">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-tertiary hover:bg-surface hover:text-primary"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-danger/30 bg-danger/10">
          <AlertTriangle className="h-5 w-5 text-danger" />
        </div>

        <h3 className="mt-4 text-lg font-bold text-primary">Delete your account?</h3>
        <p className="mt-1.5 text-sm text-secondary">
          This permanently deletes <span className="text-primary">{userEmail}</span> and
          all associated data. This action cannot be undone.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-secondary">
              Type <span className="font-mono-tech text-danger">delete my account</span> to
              confirm
            </label>
            <Input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="delete my account"
            />
          </div>

          {hasPassword && (
            <Input
              label="Password"
              type="password"
              icon={<Lock className="h-4 w-4" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="secondary" size="md" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="md"
            className="flex-1"
            disabled={!confirmMatches}
            loading={loading}
            onClick={handleDelete}
          >
            Delete forever
          </Button>
        </div>
      </div>
    </div>
  );
}