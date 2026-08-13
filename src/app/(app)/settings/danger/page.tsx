// src/app/(app)/settings/danger/page.tsx
"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { SettingsSection } from "@/components/settings/settings-section";
import { DeleteAccountModal } from "@/components/settings/delete-account-modal";
import { Button } from "@/components/ui/button";
import { authClient, useSession } from "@/lib/auth-client";

interface AccountItem {
  id: string;
  providerId: string;
}

export default function DangerZonePage() {
  const { data: session } = useSession();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [hasPassword, setHasPassword] = React.useState(false);

  React.useEffect(() => {
    authClient.listAccounts().then(({ data }) => {
      const accounts = (data as unknown as AccountItem[]) || [];
      setHasPassword(accounts.some((a) => a.providerId === "credential"));
    });
  }, []);

  if (!session?.user) return null;

  return (
    <div className="space-y-6">
      <SettingsSection
        danger
        title="Delete account"
        description="Permanently delete your account and all associated data. This action is irreversible."
      >
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <p className="max-w-sm text-sm text-secondary">
            Once you delete your account, there is no going back. All your
            data — profile, sessions, and connected accounts — will be
            permanently removed.
          </p>
          <Button
            variant="danger"
            size="md"
            icon={<Trash2 className="h-4 w-4" />}
            iconPosition="left"
            className="shrink-0"
            onClick={() => setModalOpen(true)}
          >
            Delete account
          </Button>
        </div>
      </SettingsSection>

      <DeleteAccountModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        hasPassword={hasPassword}
        userEmail={session.user.email}
      />
    </div>
  );
}