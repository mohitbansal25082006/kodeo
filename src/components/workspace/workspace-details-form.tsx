// src/components/workspace/workspace-details-form.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Shuffle } from "lucide-react";
import { SettingsSection } from "@/components/settings/settings-section";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { WorkspaceIcon } from "@/components/workspace/workspace-icon";

interface WorkspaceDetailsFormProps {
  workspaceId: string;
  initialName: string;
  initialSlug: string;
  initialDescription: string | null;
  initialIcon: string | null;
}

function randomSeed() {
  return Math.random().toString(36).slice(2, 10);
}

export function WorkspaceDetailsForm({
  workspaceId,
  initialName,
  initialSlug,
  initialDescription,
  initialIcon,
}: WorkspaceDetailsFormProps) {
  const router = useRouter();
  const [name, setName] = React.useState(initialName);
  const [slug, setSlug] = React.useState(initialSlug);
  const [description, setDescription] = React.useState(initialDescription ?? "");
  const [icon, setIcon] = React.useState(initialIcon);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  const dirty =
    name !== initialName ||
    slug !== initialSlug ||
    description !== (initialDescription ?? "") ||
    icon !== initialIcon;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setLoading(true);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim().toLowerCase(),
          description: description.trim() || null,
          icon,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Try again.");
        setLoading(false);
        return;
      }

      setSaved(true);
      // The slug may have changed — refresh so the URL (and every
      // /w/[slug]/* link built from it) reflects the new value on
      // next navigation. router.refresh() alone doesn't change the
      // address bar, so a slug edit intentionally leaves the user on
      // the old URL until they navigate again, same as most SaaS
      // rename flows (Slack, Linear) rather than force a redirect
      // mid-edit that could feel jarring.
      router.refresh();
      setLoading(false);
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  return (
    <SettingsSection
      title="Workspace details"
      description="Basic information about this workspace."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-border">
            <WorkspaceIcon icon={icon} name={name} />
          </div>
          <button
            type="button"
            onClick={() => setIcon(randomSeed())}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-accent transition-colors hover:text-accent-hover"
          >
            <Shuffle className="h-3.5 w-3.5" />
            Shuffle icon
          </button>
        </div>

        <Input
          label="Workspace name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
        />

        <Input
          label="Workspace URL"
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase())}
          maxLength={48}
          hint={`kodeo.dev/w/${slug || "your-workspace"}`}
        />

        <Input
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={200}
          placeholder="What's this workspace for?"
        />

        {error && <p className="text-sm text-danger">{error}</p>}
        {saved && !dirty && <p className="text-sm text-success">Saved.</p>}

        <div className="flex justify-end">
          <Button type="submit" variant="primary" size="md" loading={loading} disabled={!dirty}>
            Save changes
          </Button>
        </div>
      </form>
    </SettingsSection>
  );
}
