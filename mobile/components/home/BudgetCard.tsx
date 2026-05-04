import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export default function BudgetCard({
  budget,
  budgetLimit,
  onBudgetLimitChange,
  onSaveBudget,
}) {
  const percent =
    budget?.status === "active"
      ? Math.min(100, Math.max(0, Math.round(budget.percent ?? 0)))
      : 0;

  const accent = (() => {
    if (!budget?.color) return "#0E3A32";
    if (budget.color === "red") return "#B42318";
    if (budget.color === "orange") return "#B54708";
    return "#0E3A32";
  })();

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Budget Guard</Text>
      {budget?.status === "active" ? (
        <>
          <Text style={styles.body}>Limit: Rs {budget.limit}</Text>
          <Text style={styles.body}>Spent: Rs {budget.spent}</Text>
          <Text style={styles.body}>Remaining: Rs {budget.remaining}</Text>
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
          <Text style={styles.body}>Set a monthly budget</Text>
          <TextInput
            value={budgetLimit}
            onChangeText={onBudgetLimitChange}
            placeholder="Budget limit"
            placeholderTextColor="#9C9085"
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E0D6CC",
    gap: 8,
  },
  title: {
    color: "#2C2C2C",
    fontWeight: "700",
    marginBottom: 6,
  },
  body: {
    color: "#2C2C2C",
  },
  meta: {
    color: "#6B5E55",
    fontSize: 12,
  },
  track: {
    height: 8,
    backgroundColor: "#F1E8DD",
    borderRadius: 999,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 999,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D8CEC4",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    color: "#1F2A24",
  },
  primaryButton: {
    backgroundColor: "#0E3A32",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FDE7C6",
    fontSize: 14,
    fontWeight: "600",
  },
});
