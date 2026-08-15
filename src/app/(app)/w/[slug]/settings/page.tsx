// src/app/(app)/w/[slug]/settings/page.tsx
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getWorkspaceBySlugForUser } from "@/lib/workspace/queries";
import { canDeleteWorkspace } from "@/lib/workspace/permissions";
import { WorkspaceDetailsForm } from "@/components/workspace/workspace-details-form";
import { DeleteWorkspaceSection } from "@/components/workspace/delete-workspace-section";

export default async function WorkspaceSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const { slug } = await params;
  const workspace = await getWorkspaceBySlugForUser(slug, session.user.id);
  if (!workspace) return null;

  return (
    <div className="space-y-6">
      <WorkspaceDetailsForm
        workspaceId={workspace.id}
        initialName={workspace.name}
        initialSlug={workspace.slug}
        initialDescription={workspace.description}
        initialIcon={workspace.icon}
      />

      {canDeleteWorkspace(workspace.role) && (
        <DeleteWorkspaceSection workspaceId={workspace.id} workspaceName={workspace.name} />
      )}
    </div>
  );
}
