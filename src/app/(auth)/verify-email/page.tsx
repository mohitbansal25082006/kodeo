// src/app/(auth)/verify-email/page.tsx
"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MailCheck, AlertCircle } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { OtpInput } from "@/components/auth/otp-input";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

const RESEND_COOLDOWN = 30;

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  // Carried over from /register?next=... (see that page's comment on
  // why a fresh sign-up always has to pass through /onboarding first
  // rather than jumping straight to `next`) — forwarded again below so
  // onboarding can finish the handoff once it completes.
  const next = searchParams.get("next");

  const [otp, setOtp] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [resending, setResending] = React.useState(false);
  const [cooldown, setCooldown] = React.useState(RESEND_COOLDOWN);

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleVerify = React.useCallback(
    async (code: string) => {
      setError(null);
      setLoading(true);

      const { error: verifyError } = await authClient.emailOtp.verifyEmail({
        email,
        otp: code,
      });

      if (verifyError) {
        setError(verifyError.message || "Invalid or expired code. Please try again.");
        setLoading(false);
        setOtp("");
        return;
      }

      router.push(next ? `/onboarding?next=${encodeURIComponent(next)}` : "/onboarding");
    },
    [email, router, next]
  );

  React.useEffect(() => {
    if (otp.length === 6 && !loading) {
      handleVerify(otp);
    }
  }, [otp, loading, handleVerify]);

  async function handleResend() {
    setResending(true);
    setError(null);
    await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "email-verification",
    });
    setResending(false);
    setCooldown(RESEND_COOLDOWN);
  }

  if (!email) {
    return (
      <AuthShell title="Missing email" subtitle="Please start the sign-up process again.">
        <Button
          variant="primary"
          size="md"
          className="w-full"
          onClick={() => router.push("/register")}
        >
          Back to sign up
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="One last step"
      title="Verify your email"
      subtitle={`We sent a 6-digit code to ${email}`}
    >
      <div className="mb-6 flex justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/20 bg-accent-dim/40">
          <MailCheck className="h-6 w-6 text-accent" />
        </div>
      </div>

      <OtpInput value={otp} onChange={setOtp} error={!!error} disabled={loading} />

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {loading && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-secondary">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Verifying...
        </div>
      )}

      <div className="mt-6 text-center">
        {cooldown > 0 ? (
          <p className="text-sm text-tertiary">
            Resend code in <span className="text-secondary">{cooldown}s</span>
          </p>
        ) : (
          <button
            onClick={handleResend}
            disabled={resending}
            className="text-sm font-medium text-accent hover:text-accent-hover disabled:opacity-50"
          >
            {resending ? "Sending..." : "Resend code"}
          </button>
        )}
      </div>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <React.Suspense fallback={null}>
      <VerifyEmailForm />
    </React.Suspense>
  );
}
