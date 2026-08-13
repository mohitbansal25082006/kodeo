// src/app/(app)/settings/appearance/page.tsx
"use client";

import { Moon, Sun } from "lucide-react";
import { SettingsSection } from "@/components/settings/settings-section";
import { ThemeSwatch } from "@/components/settings/theme-swatch";
import { useTheme } from "@/lib/themes/theme-provider";
import { DARK_THEMES, LIGHT_THEMES } from "@/lib/themes/theme-definitions";

export default function AppearancePage() {
  const { themeId, setThemeId } = useTheme();

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Dark themes"
        description="10 dark palettes — pick the one that matches your focus."
      >
        <div className="mb-1 flex items-center gap-1.5 text-xs text-tertiary">
          <Moon className="h-3.5 w-3.5" />
          Dark mode
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {DARK_THEMES.map((theme) => (
            <ThemeSwatch
              key={theme.id}
              theme={theme}
              selected={themeId === theme.id}
              onSelect={() => setThemeId(theme.id)}
            />
          ))}
        </div>
      </SettingsSection>

      <SettingsSection
        title="Light themes"
        description="10 light palettes for daytime coding."
      >
        <div className="mb-1 flex items-center gap-1.5 text-xs text-tertiary">
          <Sun className="h-3.5 w-3.5" />
          Light mode
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {LIGHT_THEMES.map((theme) => (
            <ThemeSwatch
              key={theme.id}
              theme={theme}
              selected={themeId === theme.id}
              onSelect={() => setThemeId(theme.id)}
            />
          ))}
        </div>
      </SettingsSection>
    </div>
  );
}