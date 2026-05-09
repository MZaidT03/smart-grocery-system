/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

const tintColorLight = "#0e3a32";
const tintColorDark = "#7ec6b2";

export const Colors = {
  light: {
    text: "#1c231f",
    background: "#f7f5f1",
    surface: "#ffffff",
    surfaceAlt: "#f1ece4",
    surfaceStrong: "#e9e2d9",
    muted: "#7a847d",
    border: "#ded6cc",
    accent: "#0e3a32",
    accentAlt: "#b0893b",
    success: "#0f6e56",
    warning: "#b8741a",
    danger: "#b33a2b",
    tint: tintColorLight,
    icon: "#5a655f",
    tabIconDefault: "#7a847d",
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: "#f3f0ea",
    background: "#0c1110",
    surface: "#141a18",
    surfaceAlt: "#1a221f",
    surfaceStrong: "#202925",
    muted: "#9e988d",
    border: "#2a322e",
    accent: "#7ec6b2",
    accentAlt: "#d1b06a",
    success: "#4bbf9a",
    warning: "#e1a85e",
    danger: "#e07a6a",
    tint: tintColorDark,
    icon: "#c7c0b6",
    tabIconDefault: "#9e988d",
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
