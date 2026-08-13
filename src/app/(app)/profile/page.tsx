// src/app/(app)/profile/page.tsx
"use client";

import * as React from "react";
import { AtSign, User, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { SettingsSection } from "@/components/settings/settings-section";
import { AvatarPicker } from "@/components/auth/avatar-picker";
import { RolePicker } from "@/components/auth/role-picker";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authClient, useSession } from "@/lib/auth-client";

export default function ProfilePage() {
  const { data: session, isPending, refetch } = useSession();

  const [name, setName] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [role, setRole] = React.useState("");
  const [avatar, setAvatar] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
      setUsername(session.user.username || "");
      setRole(session.user.developerRole || "");
      setAvatar(session.user.image || "");
    }
  }, [session?.user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setLoading(true);

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, developerRole: role, image: avatar }),
      });

      let data: { error?: string } = {};
      try {
        data = await res.json();
      } catch {
        // non-JSON error response, fall through to generic message
      }

      if (!res.ok) {
        setError(data.error || `Something went wrong (${res.status}). Please try again.`);
        setLoading(false);
        return;
      }

      // The update went through raw SQL, not Better Auth's own
      // updateUser, so the 5-minute session cookie cache is now stale.
      // Force a fresh read before refetch() so the sidebar/topbar pick
      // up the new name/avatar immediately instead of after the cache
      // naturally expires.
      await authClient.getSession({ query: { disableCookieCache: true } });
      await refetch();
      setSaved(true);
      setLoading(false);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setLoading(false);
    }
  }

  if (isPending || !session?.user) {
    return (
      <div className="flex justify-center py-16">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <SettingsSection
          title="Profile picture"
          description="Choose an avatar style — free, generated instantly by DiceBear."
        >
          <AvatarPicker seed={username || name} value={avatar} onChange={setAvatar} />
        </SettingsSection>

        <SettingsSection title="Personal information" description="Update your name and username.">
          <div className="space-y-4">
            <Input
              label="Full name"
              type="text"
              icon={<User className="h-4 w-4" />}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Username"
              type="text"
              icon={<AtSign className="h-4 w-4" />}
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              required
            />
            <Input
              label="Email"
              type="email"
              icon={<Mail className="h-4 w-4" />}
              value={session.user.email}
              disabled
              hint="Contact support to change your email address."
            />
          </div>
        </SettingsSection>

        <SettingsSection title="What best describes you?">
          <RolePicker value={role} onChange={setRole} />
        </SettingsSection>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" variant="primary" size="md" loading={loading}>
            Save changes
          </Button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-success">
              <CheckCircle2 className="h-4 w-4" />
              Saved
            </span>
          )}
        </div>
      </form>
    </div>
  );
}