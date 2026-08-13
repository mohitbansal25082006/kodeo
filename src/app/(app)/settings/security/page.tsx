// src/app/(app)/settings/security/page.tsx
"use client";

import * as React from "react";
import { Lock, AlertCircle, CheckCircle2, ShieldOff } from "lucide-react";
import { SettingsSection } from "@/components/settings/settings-section";
import { SessionRow } from "@/components/settings/session-row";
import { PasswordStrength } from "@/components/auth/password-strength";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authClient, useSession } from "@/lib/auth-client";

interface SessionItem {
  id: string;
  token: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  createdAt: string | Date;
}

export default function SecurityPage() {
  const { data: session } = useSession();

  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [pwLoading, setPwLoading] = React.useState(false);
  const [pwError, setPwError] = React.useState<string | null>(null);
  const [pwSaved, setPwSaved] = React.useState(false);

  const [sessions, setSessions] = React.useState<SessionItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = React.useState(true);
  const [revokingToken, setRevokingToken] = React.useState<string | null>(null);

  const loadSessions = React.useCallback(async () => {
    setSessionsLoading(true);
    const { data } = await authClient.listSessions();
    setSessions((data as unknown as SessionItem[]) || []);
    setSessionsLoading(false);
  }, []);

  React.useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError(null);
    setPwSaved(false);

    if (newPassword.length < 8) {
      setPwError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("Passwords do not match.");
      return;
    }

    setPwLoading(true);
    const { error } = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    });

    if (error) {
      setPwError(error.message || "Failed to change password. Check your current password.");
      setPwLoading(false);
      return;
    }

    setPwSaved(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPwLoading(false);
    loadSessions();
    setTimeout(() => setPwSaved(false), 3000);
  }

  async function handleRevoke(token: string) {
    setRevokingToken(token);
    await authClient.revokeSession({ token });
    await loadSessions();
    setRevokingToken(null);
  }

  async function handleRevokeAllOthers() {
    setRevokingToken("all");
    await authClient.revokeOtherSessions();
    await loadSessions();
    setRevokingToken(null);
  }

  const currentToken = (session as unknown as { session?: { token?: string } })?.session?.token;

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Change password"
        description="Choose a strong password you don't use elsewhere."
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input
            label="Current password"
            type="password"
            icon={<Lock className="h-4 w-4" />}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <div>
            <Input
              label="New password"
              type="password"
              icon={<Lock className="h-4 w-4" />}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
            <PasswordStrength password={newPassword} />
          </div>
          <Input
            label="Confirm new password"
            type="password"
            icon={<Lock className="h-4 w-4" />}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
          />

          {pwError && (
            <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {pwError}
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit" variant="primary" size="md" loading={pwLoading}>
              Update password
            </Button>
            {pwSaved && (
              <span className="flex items-center gap-1.5 text-sm text-success">
                <CheckCircle2 className="h-4 w-4" />
                Password updated
              </span>
            )}
          </div>
        </form>
      </SettingsSection>

      <SettingsSection
        title="Active sessions"
        description="Devices currently signed in to your account."
      >
        {sessionsLoading ? (
          <div className="flex justify-center py-6">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {sessions.map((s) => (
                <SessionRow
                  key={s.id}
                  userAgent={s.userAgent}
                  ipAddress={s.ipAddress}
                  createdAt={s.createdAt}
                  isCurrent={s.token === currentToken}
                  onRevoke={() => handleRevoke(s.token)}
                  revoking={revokingToken === s.token}
                />
              ))}
            </div>
            {sessions.length > 1 && (
              <button
                onClick={handleRevokeAllOthers}
                disabled={revokingToken === "all"}
                className="mt-4 flex items-center gap-1.5 text-sm font-medium text-danger hover:text-danger-hover disabled:opacity-50"
              >
                <ShieldOff className="h-3.5 w-3.5" />
                {revokingToken === "all" ? "Revoking..." : "Log out of all other devices"}
              </button>
            )}
          </>
        )}
      </SettingsSection>
    </div>
  );
}