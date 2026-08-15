// src/app/(app)/w/[slug]/layout.tsx
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getWorkspaceBySlugForUser } from "@/lib/workspace/queries";
import { WorkspaceTabs } from "@/components/workspace/workspace-tabs";
import { WorkspaceIcon } from "@/components/workspace/workspace-icon";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  // (app)/layout.tsx above this already guarantees a session exists.
  if (!session?.user) return null;

  const { slug } = await params;
  const workspace = await getWorkspaceBySlugForUser(slug, session.user.id);

  // Not found OR not a member — see getWorkspaceBySlugForUser's doc
  // comment for why these two cases are deliberately indistinguishable
  // to the caller. notFound() renders the standard Next.js 404, which
  // is the right response either way.
  if (!workspace) {
    notFound();
  }

  return (
    <div>
      <div className="flex items-center gap-3 border-b border-border pb-5">
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-border">
          <WorkspaceIcon icon={workspace.icon} name={workspace.name} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-primary">{workspace.name}</h1>
          {workspace.description && (
            <p className="text-sm text-secondary">{workspace.description}</p>
          )}
        </div>
      </div>

      <WorkspaceTabs slug={slug} role={workspace.role} />

      <div className="mt-6">{children}</div>
    </div>
  );
}
