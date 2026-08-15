// src/app/invite/[token]/page.tsx
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getInvitationPreviewByToken } from "@/lib/workspace/invitation-queries";
import { InvitationLanding } from "@/components/workspace/invitation-landing";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const [session, invitation] = await Promise.all([
    auth.api.getSession({ headers: await headers() }).catch(() => null),
    getInvitationPreviewByToken(token),
  ]);

  return (
    <InvitationLanding
      token={token}
      invitation={invitation}
      sessionUserEmail={session?.user?.email ?? null}
      isSignedIn={Boolean(session?.user)}
    />
  );
}
