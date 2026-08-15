// src/app/(app)/w/[slug]/members/page.tsx
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getWorkspaceBySlugForUser, listMembers } from "@/lib/workspace/queries";
import { listPendingInvitations } from "@/lib/workspace/invitation-queries";
import { canViewInvitations } from "@/lib/workspace/permissions";
import { MembersTable } from "@/components/workspace/members-table";

export default async function WorkspaceMembersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const { slug } = await params;
  const workspace = await getWorkspaceBySlugForUser(slug, session.user.id);
  if (!workspace) return null;

  const [members, invitations] = await Promise.all([
    listMembers(workspace.id),
    canViewInvitations(workspace.role) ? listPendingInvitations(workspace.id) : Promise.resolve([]),
  ]);

  return (
    <MembersTable
      workspaceId={workspace.id}
      currentUserId={session.user.id}
      currentUserRole={workspace.role}
      initialMembers={members}
      initialInvitations={invitations}
    />
  );
}
