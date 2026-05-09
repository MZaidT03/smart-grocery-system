import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// 1. Define the High-End Minimal Color Palette
export const Colors = {
  light: {
    bg: "#ffffff",
    surface1: "#fafafa",
    surface2: "#f5f5f5",
    surface3: "#eeeeee",
    text1: "#000000",
    text2: "#666666",
    text3: "#999999",
    border: "#e5e5e5",
    accent1: "#166534", // Deep Forest Green
    accent2: "#000000", // Pure Black CTA
    success: "#15803d",
    warning: "#ca8a04",
    danger: "#dc2626",
  },
  dark: {
    bg: "#000000",
    surface1: "#0a0a0a",
    surface2: "#141414",
    surface3: "#1f1f1f",
    text1: "#ffffff",
    text2: "#888888",
    text3: "#555555",
    border: "#262626",
    accent1: "#4ade80", // Crisp Mint Green
    accent2: "#ffffff", // Pure White CTA
    success: "#22c55e",
    warning: "#eab308",
    danger: "#ef4444",
  },
};

// Types
export type ThemeColors = typeof Colors.light;
type ThemeMode = "light" | "dark" | "system";

type ThemeContextValue = {
  mode: ThemeMode;
  scheme: "light" | "dark";
  colors: ThemeColors; // Added colors to the context
  setMode: (next: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const storageKey = "sg-theme-mode";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemColorScheme() ?? "light";
  const [mode, setMode] = useState<ThemeMode>("system");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(storageKey);
        if (
          mounted &&
          (stored === "light" || stored === "dark" || stored === "system")
        ) {
          setMode(stored as ThemeMode);
        }
      } catch (err) {
        // ignore storage errors
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(storageKey, mode).catch(() => {});
  }, [mode]);

  // Determine current active scheme
  const scheme = mode === "system" ? systemScheme : mode;

  // Grab the correct color palette based on the active scheme
  const activeColors = Colors[scheme];

  const value = useMemo(
    () => ({ mode, scheme, colors: activeColors, setMode }),
    [mode, scheme, activeColors],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    // Fallback if used outside provider
    return {
      mode: "system",
      scheme: "light",
      colors: Colors.light,
      setMode: () => {},
    } as ThemeContextValue;
  }
  return context;
}
