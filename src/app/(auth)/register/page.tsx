// src/app/(auth)/register/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, User, ArrowRight, AlertCircle } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { AuthDivider } from "@/components/auth/divider";
import { PasswordStrength } from "@/components/auth/password-strength";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Where to send the person after the full sign-up flow completes.
  // Falls back to onboarding's own default (/dashboard) when absent —
  // see the query-string handoff below for why this has to survive
  // three separate redirects (OAuth callback, OTP verification,
  // onboarding) rather than just being read once.
  const next = searchParams.get("next");

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Onboarding is mandatory for every new account (see middleware.ts's
  // PROTECTED_PAGES and the (app)/layout.tsx redirect for
  // onboardingCompletedAt), so a brand-new sign-up can never jump
  // straight to `next` — it always has to pass through /onboarding
  // first. Appending `next` as onboarding's own query param means
  // onboarding is responsible for forwarding to it on completion
  // instead of this page trying to skip a mandatory step.
  const onboardingUrl = next ? `/onboarding?next=${encodeURIComponent(next)}` : "/onboarding";
  const verifyEmailUrl = (emailValue: string) => {
    const params = new URLSearchParams({ email: emailValue });
    if (next) params.set("next", next);
    return `/verify-email?${params.toString()}`;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    const { error: signUpError } = await authClient.signUp.email({
      name,
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message || "Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    // Send the email-verification OTP, then route to the verify screen.
    await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "email-verification",
    });

    router.push(verifyEmailUrl(email));
  }

  return (
    <AuthShell
      eyebrow="Get started"
      title="Create your account"
      subtitle="Start building in seconds — no credit card required."
    >
      <OAuthButtons callbackURL={onboardingUrl} />
      <AuthDivider />

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full name"
          type="text"
          placeholder="Mohit Bansal"
          icon={<User className="h-4 w-4" />}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          required
        />
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          icon={<Mail className="h-4 w-4" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <div>
          <Input
            label="Password"
            type="password"
            placeholder="Create a strong password"
            icon={<Lock className="h-4 w-4" />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          <PasswordStrength password={password} />
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
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-secondary">
        Already have an account?{" "}
        <Link
          href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
          className="font-medium text-primary hover:text-accent"
        >
          Log in
        </Link>
      </p>

      <p className="mt-4 text-center text-xs leading-relaxed text-tertiary">
        By creating an account, you agree to KODEO&apos;s Terms of Service and
        Privacy Policy.
      </p>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <React.Suspense fallback={null}>
      <RegisterForm />
    </React.Suspense>
  );
}
