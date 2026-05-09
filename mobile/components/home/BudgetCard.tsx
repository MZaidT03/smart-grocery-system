import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useTheme } from "@/context/theme"; // Using your updated theme context

export default function BudgetCard({
  budget,
  budgetLimit,
  onBudgetLimitChange,
  onSaveBudget,
}: any) {
  // Pull the pure black/white/green minimal colors directly from the context
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const percent =
    budget?.status === "active"
      ? Math.min(100, Math.max(0, Math.round(budget.percent ?? 0)))
      : 0;

  // Map the backend color flags directly to your minimal theme palette
  const accent = (() => {
    if (!budget?.color) return colors.accent1; // Default to Brand Green
    if (budget.color === "red") return colors.danger;
    if (budget.color === "orange") return colors.warning;
    return colors.accent1;
  })();

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Budget Guard</Text>
        <View
          style={[
            styles.statusPill,
            budget?.status === "active"
              ? styles.statusActive
              : styles.statusInactive,
          ]}
        >
          <Text style={styles.statusText}>
            {budget?.status === "active" ? "Active" : "Not set"}
          </Text>
        </View>
      </View>

      {budget?.status === "active" ? (
        <>
          <View style={styles.metricRow}>
            <View style={styles.metricBlock}>
              <Text style={styles.metricLabel}>Limit</Text>
              <Text style={styles.metricValue}>Rs {budget.limit}</Text>
            </View>
            <View style={styles.metricBlock}>
              <Text style={styles.metricLabel}>Spent</Text>
              <Text style={styles.metricValue}>Rs {budget.spent}</Text>
            </View>
            <View style={styles.metricBlock}>
              <Text style={styles.metricLabel}>Remaining</Text>
              <Text style={styles.metricValue}>Rs {budget.remaining}</Text>
            </View>
          </View>
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                { width: `${percent}%`, backgroundColor: accent },
              ]}
            />
          </View>
          <Text style={styles.meta}>{budget.advice}</Text>
        </>
      ) : (
        <>
          <Text style={styles.body}>
            Set a monthly budget to track your spending
          </Text>
          <TextInput
            value={budgetLimit}
            onChangeText={onBudgetLimitChange}
            placeholder="Enter limit (e.g. 5000)"
            placeholderTextColor={colors.text3}
            keyboardType="number-pad"
            style={styles.input}
          />
          <Pressable style={styles.primaryButton} onPress={onSaveBudget}>
            <Text style={styles.primaryButtonText}>Save budget</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

// Map everything to the new dynamic colors context
const createStyles = (colors: any) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface1,
      borderRadius: 20,
      padding: 20, // Slightly increased padding for elegance
      borderWidth: 1,
      borderColor: colors.border,
      gap: 16, // Better spacing between elements
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    title: {
      color: colors.text1,
      fontWeight: "700",
      fontSize: 16,
    },
    statusPill: {
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statusActive: {
      backgroundColor: colors.surface2,
    },
    statusInactive: {
      backgroundColor: colors.surface2,
    },
    statusText: {
      color: colors.text1,
      fontSize: 10,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    body: {
      color: colors.text2,
      fontSize: 14,
      marginTop: -4,
    },
    metricRow: {
      flexDirection: "row",
      gap: 12,
    },
    metricBlock: {
      flex: 1,
      backgroundColor: colors.surface2, // Use secondary surface for internal blocks
      borderRadius: 14,
      padding: 12, // Increased touch/visual target
      borderWidth: 1,
      borderColor: colors.border,
    },
    metricLabel: {
      color: colors.text2,
      fontSize: 10,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      fontWeight: "600",
    },
    metricValue: {
      color: colors.text1,
      fontWeight: "700",
      fontSize: 14,
      marginTop: 4,
    },
    meta: {
      color: colors.text2,
      fontSize: 13,
      fontStyle: "italic", // Adds a nice editorial touch for advice
    },
    track: {
      height: 6, // Thinner, more elegant progress bar
      backgroundColor: colors.surface3, // Distinct empty state track
      borderRadius: 999,
      overflow: "hidden",
    },
    fill: {
      height: "100%",
      borderRadius: 999,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 14, // Taller inputs
      backgroundColor: colors.surface1,
      color: colors.text1,
      fontSize: 15,
    },
    primaryButton: {
      backgroundColor: colors.accent1, // Brand Green
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: "center",
    },
    primaryButtonText: {
      color: colors.bg, // Dynamic contrast (black or white)
      fontSize: 15,
      fontWeight: "700",
    },
  });
