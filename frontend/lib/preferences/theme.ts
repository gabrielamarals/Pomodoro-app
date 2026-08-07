import type { Preferences } from "../services/auth";

export function applyTheme(theme: Preferences["theme"]) {
  const resolvedTheme = theme === "system"
    ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "ember" : "natural"
    : theme;

  document.documentElement.dataset.theme = resolvedTheme;
  localStorage.setItem("pomodoro-theme", theme);
}
