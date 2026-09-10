"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Sun, Moon } from "lucide-react";

type Theme = "light" | "dark" | "system";

function currentTheme(): Theme {
  if (typeof document === "undefined") return "system";
  const t = document.documentElement.dataset.theme;
  return t === "dark" || t === "light" ? t : "system";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") {
    delete root.dataset.theme;
    try {
      localStorage.removeItem("theme");
    } catch {}
  } else {
    root.dataset.theme = theme;
    try {
      localStorage.setItem("theme", theme);
    } catch {}
  }
  window.dispatchEvent(new Event("themechange"));
}

function subscribe(cb: () => void) {
  window.addEventListener("themechange", cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener("themechange", cb);
    window.removeEventListener("storage", cb);
  };
}

const NEXT: Record<Theme, Theme> = { system: "light", light: "dark", dark: "system" };
const ICON = { system: Monitor, light: Sun, dark: Moon } as const;
const LABEL: Record<Theme, string> = {
  system: "Theme: system",
  light: "Theme: light",
  dark: "Theme: dark",
};

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, currentTheme, () => "system" as Theme);
  const Icon = ICON[theme];

  return (
    <button
      type="button"
      onClick={() => applyTheme(NEXT[theme])}
      aria-label={`${LABEL[theme]}. Activate to change.`}
      title={LABEL[theme]}
      className={`flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink ${className}`}
    >
      <Icon size={16} aria-hidden />
    </button>
  );
}
