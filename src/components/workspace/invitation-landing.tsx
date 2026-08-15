// src/components/workspace/invitation-landing.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { WorkspaceIcon } from "@/components/workspace/workspace-icon";
import { Button } from "@/components/ui/button";
import { WORKSPACE_ROLE_META } from "@/lib/workspace/types";
import type { InvitationPreview } from "@/lib/workspace/types";

interface InvitationLandingProps {
  token: string;
  invitation: InvitationPreview | null;
  sessionUserEmail: string | null;
  isSignedIn: boolean;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo markSize={28} />
        </div>
        <div className="rounded-2xl border border-border bg-bg-elevated p-6 sm:p-8">{children}</div>
      </div>
    </div>
  );
}

export function InvitationLanding({
  token,
  invitation,
  sessionUserEmail,
  isSignedIn,
}: InvitationLandingProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState<"accept" | "decline" | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [accepted, setAccepted] = React.useState(false);
  const [declined, setDeclined] = React.useState(false);

  if (!invitation) {
    return (
      <Shell>
        <div className="text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-tertiary" />
          <h1 className="mt-4 text-lg font-semibold text-primary">Invitation not found</h1>
          <p className="mt-2 text-sm text-secondary">
            This invitation link is invalid. It may have been mistyped, or the
            invitation may no longer exist.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-block text-sm font-medium text-accent hover:text-accent-hover"
          >
            Go to KODEO
          </Link>
        </div>
      </Shell>
    );
  }

  const roleMeta = WORKSPACE_ROLE_META[invitation.role];

  if (invitation.status !== "pending" || accepted || declined) {
    const message = accepted
      ? `You've joined ${invitation.workspaceName}.`
      : declined
        ? "You've declined this invitation."
        : invitation.status === "accepted"
          ? "This invitation has already been accepted."
          : invitation.status === "declined"
            ? "This invitation was declined."
            : "This invitation is no longer valid.";

    return (
      <Shell>
        <div className="text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-accent" />
          <h1 className="mt-4 text-lg font-semibold text-primary">{message}</h1>
          <Link
            href="/dashboard"
            className="mt-6 inline-block text-sm font-medium text-accent hover:text-accent-hover"
          >
            Go to KODEO
          </Link>
        </div>
      </Shell>
    );
  }

  const expired = new Date(invitation.expiresAt).getTime() < Date.now();
  const emailMismatch = isSignedIn && sessionUserEmail?.toLowerCase() !== invitation.email.toLowerCase();

  async function handleAccept() {
    setError(null);
    setLoading("accept");
    try {
      const res = await fetch(`/api/invitations/${token}/accept`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Couldn't accept this invitation.");
        setLoading(null);
        return;
      }
      setAccepted(true);
      setTimeout(() => {
        router.push(`/w/${data.workspaceSlug}`);
      }, 1200);
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(null);
    }
  }

  async function handleDecline() {
    setError(null);
    setLoading("decline");
    try {
      const res = await fetch(`/api/invitations/${token}/decline`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Couldn't decline this invitation.");
        setLoading(null);
        return;
      }
      setDeclined(true);
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(null);
    }
  }

  return (
    <Shell>
      <div className="flex flex-col items-center text-center">
        <div className="h-16 w-16 overflow-hidden rounded-2xl border border-border">
          <WorkspaceIcon icon={invitation.workspaceIcon} name={invitation.workspaceName} />
        </div>

        <h1 className="mt-5 text-lg font-semibold text-primary">
          Join {invitation.workspaceName}
        </h1>
        <p className="mt-2 text-sm text-secondary">
          <span className="font-medium text-primary">{invitation.inviterName}</span> invited you
          to join as <span className="font-medium text-primary">{roleMeta.label}</span>.
        </p>
        <p className="mt-1 text-xs text-tertiary">Invited: {invitation.email}</p>

        {expired ? (
          <p className="mt-6 text-sm text-danger">
            This invitation has expired. Ask an admin to send a new one.
          </p>
        ) : !isSignedIn ? (
          <div className="mt-6 w-full space-y-2">
            <p className="text-sm text-secondary">Sign in or create an account to continue.</p>
            <Link href={`/login?next=/invite/${token}`}>
              <Button variant="primary" size="md" className="w-full">
                Sign in
              </Button>
            </Link>
            <Link href={`/register?next=/invite/${token}`}>
              <Button variant="secondary" size="md" className="w-full">
                Create an account
              </Button>
            </Link>
          </div>
        ) : emailMismatch ? (
          <p className="mt-6 text-sm text-secondary">
            You&apos;re signed in as <span className="font-medium text-primary">{sessionUserEmail}</span>,
            but this invitation was sent to <span className="font-medium text-primary">{invitation.email}</span>.
            Sign in with that email to accept it.
          </p>
        ) : (
          <div className="mt-6 w-full space-y-2">
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button
              variant="primary"
              size="md"
              className="w-full"
              loading={loading === "accept"}
              disabled={loading === "decline"}
              onClick={handleAccept}
            >
              Accept invitation
            </Button>
            <Button
              variant="ghost"
              size="md"
              className="w-full"
              loading={loading === "decline"}
              disabled={loading === "accept"}
              onClick={handleDecline}
            >
              Decline
            </Button>
          </div>
        )}
      </div>
    </Shell>
  );
}