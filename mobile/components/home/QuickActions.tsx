import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/context/theme";
import {
  BarChart3,
  ChefHat,
  Search,
  ShoppingBasket,
  TrendingUp,
} from "lucide-react-native";

type QuickActionKey =
  | "recipes"
  | "prices"
  | "shopping"
  | "forecast"
  | "analytics";

type QuickAction = {
  key: QuickActionKey;
  title: string;
  subtitle: string;
  icon: typeof ChefHat;
  accent: string;
};

const actions: QuickAction[] = [
  {
    key: "recipes",
    title: "Recipes",
    subtitle: "Cook from stock",
    icon: ChefHat,
    accent: "#f59e0b",
  },
  {
    key: "prices",
    title: "Prices",
    subtitle: "Market scan",
    icon: Search,
    accent: "#3b82f6",
  },
  {
    key: "shopping",
    title: "Shopping",
    subtitle: "Auto list",
    icon: ShoppingBasket,
    accent: "#10b981",
  },
  {
    key: "forecast",
    title: "Forecast",
    subtitle: "Usage demand",
    icon: TrendingUp,
    accent: "#8b5cf6",
  },
  {
    key: "analytics",
    title: "Analytics",
    subtitle: "Spend patterns",
    icon: BarChart3,
    accent: "#ec4899",
  },
];

export default function QuickActions({
  onAction,
}: {
  onAction: (key: QuickActionKey) => void;
}) {
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => createStyles(colors, scheme), [colors, scheme]);

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.eyebrow}>Shortcuts</Text>
          <Text style={styles.title}>Move quickly</Text>
        </View>
      </View>

      <View style={styles.grid}>
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Pressable
              key={action.key}
              style={[
                styles.card,
                action.key === "analytics" && styles.wideCard,
                {
                  borderColor: toneBorder(action.accent, scheme),
                  backgroundColor: toneBackground(action.accent, scheme),
                },
              ]}
              onPress={() => onAction(action.key)}
            >
              <View style={styles.cardTop}>
                <View
                  style={[
                    styles.iconWrap,
                    { backgroundColor: toneIcon(action.accent, scheme) },
                  ]}
                >
                  <Icon size={20} color={action.accent} />
                </View>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: action.accent },
                  ]}
                />
              </View>
              <Text style={styles.cardTitle}>{action.title}</Text>
              <Text style={styles.cardSub}>{action.subtitle}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const hexToRgb = (hex: string) => {
  const clean = hex.replace("#", "");
  const value = Number.parseInt(clean, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
};

const rgba = (hex: string, alpha: number) => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const toneBackground = (hex: string, scheme: "light" | "dark") =>
  rgba(hex, scheme === "dark" ? 0.13 : 0.08);

const toneBorder = (hex: string, scheme: "light" | "dark") =>
  rgba(hex, scheme === "dark" ? 0.35 : 0.22);

const toneIcon = (hex: string, scheme: "light" | "dark") =>
  rgba(hex, scheme === "dark" ? 0.18 : 0.12);

const createStyles = (colors: any, scheme: "light" | "dark") =>
  StyleSheet.create({
    section: {
      gap: 12,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 2,
    },
    eyebrow: {
      color: colors.accent1,
      fontSize: 11,
      fontWeight: "900",
      textTransform: "uppercase",
    },
    title: {
      fontSize: 22,
      fontWeight: "900",
      color: colors.text1,
      marginTop: 2,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    card: {
      width: "47.5%",
      minHeight: 126,
      borderRadius: 20,
      padding: 14,
      borderWidth: 1,
      justifyContent: "space-between",
    },
    wideCard: {
      width: "100%",
      minHeight: 116,
    },
    cardTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    iconWrap: {
      width: 42,
      height: 42,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      opacity: scheme === "dark" ? 0.9 : 0.75,
    },
    cardTitle: {
      color: colors.text1,
      fontWeight: "900",
      fontSize: 16,
      marginTop: 10,
    },
    cardSub: {
      color: colors.text2,
      marginTop: 3,
      fontSize: 13,
      fontWeight: "600",
    },
  });
