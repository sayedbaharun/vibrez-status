"use client";

import { Button } from "@/components/ui/button";

const STORAGE_KEY = "vibrez-theme";

function applyTheme(theme: "light" | "dark") {
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

export function ThemeToggle() {
  function toggle() {
    const next = document.documentElement.classList.contains("dark") ? "light" : "dark";
    applyTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="h-11 px-3"
      onClick={toggle}
      aria-label="Switch colour theme"
    >
      Theme
    </Button>
  );
}
