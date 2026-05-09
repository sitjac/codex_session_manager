import * as React from "react";

export type ThemeMode = "light" | "dark";

const THEME_STORAGE_KEY = "csm:themeMode";

function readStoredThemeMode(): ThemeMode {
  const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
  return raw === "dark" ? "dark" : "light";
}

export function useThemeMode() {
  const [themeMode, setThemeMode] = React.useState<ThemeMode>(readStoredThemeMode);

  React.useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
  }, [themeMode]);

  const toggleThemeMode = React.useCallback(() => {
    setThemeMode((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  return {
    themeMode,
    toggleThemeMode,
  };
}
