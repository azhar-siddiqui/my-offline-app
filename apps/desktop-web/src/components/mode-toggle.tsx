import { Button } from "@/components/ui/button";

import { useTheme } from "@/provider/theme-provider";
import { IconMoon, IconSun } from "@tabler/icons-react";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {isDark ? <IconSun /> : <IconMoon />}
    </Button>
  );
}
