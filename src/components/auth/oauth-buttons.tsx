// src/components/auth/oauth-buttons.tsx
"use client";

import * as React from "react";
import { Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.6 5.6 0 0 1-2.4 3.68v3h3.86c2.26-2.09 3.6-5.17 3.6-8.92Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.07 7.93-2.9l-3.86-3.02c-1.07.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.11A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.27a7.2 7.2 0 0 1 0-4.54V6.62H1.29a12 12 0 0 0 0 10.76l3.98-3.11Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.94 1.19 15.24 0 12 0A12 12 0 0 0 1.29 6.62l3.98 3.11C6.22 6.88 8.87 4.77 12 4.77Z"
      />
    </svg>
  );
}

interface OAuthButtonsProps {
  callbackURL?: string;
}

export function OAuthButtons({ callbackURL = "/onboarding" }: OAuthButtonsProps) {
  const [loading, setLoading] = React.useState<"google" | "github" | null>(null);

  async function handleOAuth(provider: "google" | "github") {
    setLoading(provider);
    try {
      await authClient.signIn.social({
        provider,
        callbackURL,
      });
    } catch {
      setLoading(null);
    }
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <Button
        type="button"
        variant="secondary"
        size="md"
        loading={loading === "google"}
        disabled={loading !== null}
        onClick={() => handleOAuth("google")}
        icon={!loading ? <GoogleIcon /> : undefined}
        iconPosition="left"
      >
        Google
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="md"
        loading={loading === "github"}
        disabled={loading !== null}
        onClick={() => handleOAuth("github")}
        icon={!loading ? <Github className="h-4 w-4" /> : undefined}
        iconPosition="left"
      >
        GitHub
      </Button>
    </div>
  );
}