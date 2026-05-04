import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function HomeHeader({
  displayName,
  totalItems,
  lowStockCount,
  budgetStatus,
  onAddPress,
}) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.title}>Smart Grocery</Text>
          <Text style={styles.subtitle}>
            {displayName ? `Welcome, ${displayName}` : "Inventory dashboard"}
          </Text>
        </View>
        <Pressable style={styles.addButton} onPress={onAddPress}>
          <Text style={styles.addButtonText}>Add item</Text>
        </Pressable>
      </View>
      <View style={styles.divider} />
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#0E3A32",
    borderRadius: 20,
    padding: 22,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: {
    color: "#FDE7C6",
    fontSize: 26,
    fontWeight: "700",
  },
  subtitle: {
    color: "#F1F5F2",
    marginTop: 8,
    fontSize: 14,
  },
  addButton: {
    backgroundColor: "#FDE7C6",
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  addButtonText: {
    color: "#2D1D12",
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(253,231,198,0.2)",
    marginVertical: 14,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
  },
  summaryCard: {
    backgroundColor: "rgba(241,245,242,0.12)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flex: 1,
  },
  summaryLabel: {
    color: "#CFE3D9",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  summaryValue: {
    color: "#FDE7C6",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 4,
  },
});
