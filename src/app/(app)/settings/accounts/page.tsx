// src/app/(app)/settings/accounts/page.tsx
"use client";

import * as React from "react";
import { Github } from "lucide-react";
import { SettingsSection } from "@/components/settings/settings-section";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

interface AccountItem {
  id: string;
  providerId: string;
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="#4285F4" d="M23.52 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.6 5.6 0 0 1-2.4 3.68v3h3.86c2.26-2.09 3.6-5.17 3.6-8.92Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.93-2.9l-3.86-3.02c-1.07.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.11A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.27 14.27a7.2 7.2 0 0 1 0-4.54V6.62H1.29a12 12 0 0 0 0 10.76l3.98-3.11Z" />
      <path fill="#EA4335" d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.94 1.19 15.24 0 12 0A12 12 0 0 0 1.29 6.62l3.98 3.11C6.22 6.88 8.87 4.77 12 4.77Z" />
    </svg>
  );
}

const PROVIDERS = [
  { id: "google", name: "Google", icon: GoogleIcon, description: "Sign in with your Google account." },
  { id: "github", name: "GitHub", icon: Github, description: "Sign in with your GitHub account." },
];

export default function ConnectedAccountsPage() {
  const [accounts, setAccounts] = React.useState<AccountItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busyProvider, setBusyProvider] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const loadAccounts = React.useCallback(async () => {
    setLoading(true);
    const { data } = await authClient.listAccounts();
    setAccounts((data as unknown as AccountItem[]) || []);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  async function handleConnect(providerId: "google" | "github") {
    setBusyProvider(providerId);
    await authClient.linkSocial({
      provider: providerId,
      callbackURL: "/settings/accounts",
    });
  }

  async function handleDisconnect(providerId: string) {
    setError(null);
    setBusyProvider(providerId);
    const { error: unlinkError } = await authClient.unlinkAccount({ providerId });

    if (unlinkError) {
      setError(
        unlinkError.message ||
          "Couldn't disconnect this account — you need at least one sign-in method."
      );
    } else {
      await loadAccounts();
    }
    setBusyProvider(null);
  }

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Connected accounts"
        description="Link accounts for faster sign-in. You'll always need at least one way to sign in."
      >
        {loading ? (
          <div className="flex justify-center py-6">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-2">
            {PROVIDERS.map((provider) => {
              const connected = accounts.some((a) => a.providerId === provider.id);
              const busy = busyProvider === provider.id;
              return (
                <div
                  key={provider.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-bg-elevated px-4 py-3.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface">
                      <provider.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-primary">{provider.name}</div>
                      <div className="text-xs text-tertiary">
                        {connected ? "Connected" : provider.description}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant={connected ? "outline" : "secondary"}
                    size="sm"
                    loading={busy}
                    onClick={() =>
                      connected
                        ? handleDisconnect(provider.id)
                        : handleConnect(provider.id as "google" | "github")
                    }
                  >
                    {connected ? "Disconnect" : "Connect"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {error && (
          <p className="mt-3 text-sm text-danger">{error}</p>
        )}
      </SettingsSection>
    </div>
  );
}