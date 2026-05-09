import React, { createContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext({
  mode: "system",
  resolved: "light",
  setMode: () => {},
});

const storageKey = "sg-theme-mode";

const getSystemTheme = () => {
  if (typeof window === "undefined" || !window.matchMedia) {
    return "light";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState("system");
  const [resolved, setResolved] = useState(getSystemTheme());

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (stored === "light" || stored === "dark" || stored === "system") {
      setModeState(stored);
    }
  }, []);

  useEffect(() => {
    const nextResolved = mode === "system" ? getSystemTheme() : mode;
    setResolved(nextResolved);
    window.localStorage.setItem(storageKey, mode);
    document.documentElement.dataset.theme = nextResolved;
    document.documentElement.classList.toggle("dark", nextResolved === "dark");
  }, [mode]);

  useEffect(() => {
    if (mode !== "system" || !window.matchMedia) return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setResolved(media.matches ? "dark" : "light");
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [mode]);

  const value = useMemo(
    () => ({ mode, resolved, setMode: setModeState }),
    [mode, resolved],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    return { mode: "system", resolved: "light", setMode: () => {} };
  }
  return context;
}
