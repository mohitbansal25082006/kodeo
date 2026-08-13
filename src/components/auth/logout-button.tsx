// src/components/auth/logout-button.tsx
"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      icon={<LogOut className="h-3.5 w-3.5" />}
      iconPosition="left"
      onClick={handleLogout}
    >
      Log out
    </Button>
  );
}