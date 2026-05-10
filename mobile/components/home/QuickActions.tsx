import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/context/theme"; // Using your updated theme context

// We use RGBA here to create a "glass" effect over your pure black/white backgrounds
const buildActions = (scheme: "light" | "dark") => [
  {
    key: "recipes",
    title: "Recipes",
    subtitle: "Smart cook",
    tone:
      scheme === "dark"
        ? {
            bg: "rgba(245, 158, 11, 0.1)",
            border: "rgba(245, 158, 11, 0.5)",
            accent: "#fbbf24",
          } // Amber
        : {
            bg: "rgba(245, 158, 11, 0.08)",
            border: "rgba(245, 158, 11, 0.4)",
            accent: "#f59e0b",
          },
  },
  {
    key: "prices",
    title: "Prices",
    subtitle: "Market trends",
    tone:
      scheme === "dark"
        ? {
            bg: "rgba(59, 130, 246, 0.1)",
            border: "rgba(59, 130, 246, 0.5)",
            accent: "#60a5fa",
          } // Blue
        : {
            bg: "rgba(59, 130, 246, 0.08)",
            border: "rgba(59, 130, 246, 0.4)",
            accent: "#3b82f6",
          },
  },
  {
    key: "shopping",
    title: "Shopping",
    subtitle: "Auto list",
    tone:
      scheme === "dark"
        ? {
            bg: "rgba(16, 185, 129, 0.1)",
            border: "rgba(16, 185, 129, 0.5)",
            accent: "#34d399",
          } // Emerald (Brand)
        : {
            bg: "rgba(16, 185, 129, 0.08)",
            border: "rgba(16, 185, 129, 0.4)",
            accent: "#10b981",
          },
  },
  {
    key: "forecast",
    title: "Forecast",
    subtitle: "Usage trend",
    tone:
      scheme === "dark"
        ? {
            bg: "rgba(139, 92, 246, 0.1)",
            border: "rgba(139, 92, 246, 0.5)",
            accent: "#a78bfa",
          } // Purple
        : {
            bg: "rgba(139, 92, 246, 0.08)",
            border: "rgba(139, 92, 246, 0.4)",
            accent: "#8b5cf6",
          },
  },
  {
    key: "analytics",
    title: "Analytics",
    subtitle: "Insights & trends",
    tone:
      scheme === "dark"
        ? {
            bg: "rgba(236, 72, 153, 0.1)",
            border: "rgba(236, 72, 153, 0.5)",
            accent: "#f472b6",
          } // Pink
        : {
            bg: "rgba(236, 72, 153, 0.08)",
            border: "rgba(236, 72, 153, 0.4)",
            accent: "#ec4899",
          },
  },
];

export default function QuickActions({ onAction }: any) {
  // Pull the colors and scheme from your minimal theme context
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const actions = useMemo(() => buildActions(scheme), [scheme]);

  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Quick actions</Text>
        <Text style={styles.meta}>Swipe</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {actions.map((action) => (
          <Pressable
            key={action.key}
            style={[
              styles.card,
              {
                backgroundColor: action.tone.bg,
                borderColor: action.tone.border,
              },
            ]}
            onPress={() => onAction(action.key)}
          >
            <View
              style={[
                styles.accentBar,
                { backgroundColor: action.tone.accent },
              ]}
            />
            <Text style={styles.cardTitle}>{action.title}</Text>
            <Text style={styles.cardSub}>{action.subtitle}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

// Mapped dynamically to your global colors
const createStyles = (colors: any) =>
  StyleSheet.create({
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 2, // Slight indent alignment
    },
    title: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text1,
    },
    meta: {
      color: colors.text3,
      fontSize: 12,
      fontWeight: "500",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    row: {
      paddingTop: 12,
      gap: 12,
      paddingRight: 20, // Ensures the last item doesn't get cut off on scroll
    },
    card: {
      borderRadius: 18,
      padding: 16,
      minWidth: 140,
      borderWidth: 1, // Uses the 50% opacity colored borders from buildActions
      gap: 10,
    },
    accentBar: {
      width: 32,
      height: 4,
      borderRadius: 999,
      marginBottom: 4, // Pushes the text down slightly
    },
    cardTitle: {
      color: colors.text1,
      fontWeight: "700",
      fontSize: 15,
    },
    cardSub: {
      color: colors.text2,
      marginTop: 2,
      fontSize: 13,
    },
  });
