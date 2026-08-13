// src/app/onboarding/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AtSign, ArrowRight, AlertCircle } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { AvatarPicker } from "@/components/auth/avatar-picker";
import { RolePicker } from "@/components/auth/role-picker";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authClient, useSession } from "@/lib/auth-client";

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const [username, setUsername] = React.useState("");
  const [role, setRole] = React.useState("");
  const [avatar, setAvatar] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Prefill a suggested username from the signed-up name once available.
  React.useEffect(() => {
    if (session?.user?.name && !username) {
      const suggestion = session.user.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "")
        .slice(0, 20);
      setUsername(suggestion);
    }
  }, [session?.user?.name, username]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!role) {
      setError("Please select what best describes you.");
      return;
    }
    if (!avatar) {
      setError("Please choose a profile picture.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, developerRole: role, image: avatar }),
      });

      let data: { error?: string } = {};
      try {
        data = await res.json();
      } catch {
        // Response wasn't JSON (e.g. a 500 HTML error page) — fall through
        // to the generic error message below instead of throwing.
      }

      if (!res.ok) {
        setError(data.error || `Something went wrong (${res.status}). Please try again.`);
        setLoading(false);
        return;
      }

      // Better Auth caches the session in a signed cookie for 5 minutes
      // (see session.cookieCache in src/lib/auth.ts) to avoid a DB round
      // trip on every request. Onboarding was just completed via a raw
      // SQL UPDATE (not Better Auth's own updateUser), so that cache is
      // now stale — it still says onboardingCompletedAt: null. The
      // (app) layout's server-side session check would read that stale
      // cookie and bounce straight back to /onboarding, which looks
      // exactly like the button "just refreshing" and doing nothing.
      // Forcing a disableCookieCache read here rewrites the cookie with
      // fresh data before we navigate.
      await authClient.getSession({ query: { disableCookieCache: true } });

      router.push("/dashboard");
      router.refresh();
    } catch {
      // Network failure, offline, CORS, etc. Without this catch the
      // promise rejection was unhandled and the button just sat there
      // looking like nothing happened / like the page had reloaded.
      setError("Couldn't reach the server. Check your connection and try again.");
      setLoading(false);
    }
  }

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <AuthShell
      eyebrow="Welcome to KODEO"
      title="Set up your profile"
      subtitle="This only takes a second — you can always change it later."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <AvatarPicker
          seed={username || session?.user?.name || "kodeo"}
          value={avatar}
          onChange={setAvatar}
        />

        <Input
          label="Username"
          type="text"
          placeholder="your-username"
          icon={<AtSign className="h-4 w-4" />}
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase())}
          hint="This is how others will find and mention you."
          required
        />

        <div>
          <label className="mb-2 block text-sm font-medium text-secondary">
            What best describes you?
          </label>
          <RolePicker value={role} onChange={setRole} />
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={loading}
          className="w-full"
          icon={<ArrowRight className="h-4 w-4" />}
        >
          Enter your workspace
        </Button>
      </form>
    </AuthShell>
  );
}