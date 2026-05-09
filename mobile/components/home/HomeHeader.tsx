import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/context/theme"; // Using your updated theme context

export default function HomeHeader({
  displayName,
  totalItems,
  lowStockCount,
  budgetStatus,
  onAddPress,
}: any) {
  // Pull the pure black/white/green minimal colors directly from the context
  const { mode, setMode, scheme, colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const toggleMode = () => {
    if (mode === "system") {
      setMode("dark");
      return;
    }
    setMode(mode === "dark" ? "light" : "dark");
  };

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.kicker}>Smart Grocery</Text>
          <Text style={styles.title}>
            {displayName ? `Welcome, ${displayName}` : "Inventory dashboard"}
          </Text>
          <Text style={styles.subtitle}>Your daily pantry snapshot</Text>
        </View>

        <View style={styles.actionColumn}>
          <Pressable style={styles.iconButton} onPress={toggleMode}>
            <Feather
              name={scheme === "dark" ? "moon" : "sun"}
              size={18}
              color={colors.text1} // Adapts perfectly to theme
            />
          </Pressable>
          <Pressable style={styles.addButton} onPress={onAddPress}>
            <Text style={styles.addButtonText}>Add item</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total items</Text>
          <Text style={styles.summaryValue}>{totalItems}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Low stock</Text>
          <Text style={styles.summaryValue}>{lowStockCount}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Budget</Text>
          <Text style={styles.summaryValue}>
            {budgetStatus === "active" ? "Active" : "Not set"}
          </Text>
        </View>
      </View>
    </View>
  );
}

// Map everything to the new dynamic colors context
const createStyles = (colors: any) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface1,
      borderRadius: 20,
      padding: 22,
      borderWidth: 1,
      borderColor: colors.border,
      // Removed glow effects to maintain the flat, clean, minimal aesthetic
    },
    topRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 12,
    },
    titleBlock: {
      flex: 1,
    },
    kicker: {
      color: colors.text3,
      textTransform: "uppercase",
      letterSpacing: 1.2,
      fontSize: 10,
      fontWeight: "700",
    },
    title: {
      color: colors.text1,
      fontSize: 24, // Increased size for modern editorial feel
      fontWeight: "800",
      letterSpacing: -0.5, // Tighter tracking
      marginTop: 6,
    },
    subtitle: {
      color: colors.text2,
      marginTop: 6,
      fontSize: 14,
    },
    actionColumn: {
      alignItems: "flex-end",
      gap: 12,
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    addButton: {
      backgroundColor: colors.accent1, // Single pop of Brand Green
      borderRadius: 14,
      paddingVertical: 10,
      paddingHorizontal: 16,
      alignSelf: "flex-start",
    },
    addButtonText: {
      color: colors.bg, // Automatically flips to black/white for perfect contrast
      fontWeight: "700",
      fontSize: 13,
    },
    summaryRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 24, // Added a bit more breathing room
    },
    summaryCard: {
      backgroundColor: colors.surface2,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 14,
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
    },
    summaryLabel: {
      color: colors.text2,
      fontSize: 10,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      fontWeight: "600",
    },
    summaryValue: {
      color: colors.text1,
      fontSize: 18,
      fontWeight: "700",
      marginTop: 6,
    },
  });
