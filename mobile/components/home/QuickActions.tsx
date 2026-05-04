import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const ACTIONS = [
  { key: "recipes", title: "Recipes", subtitle: "Smart cook" },
  { key: "prices", title: "Prices", subtitle: "Market trends" },
  { key: "shopping", title: "Shopping", subtitle: "Auto list" },
  { key: "forecast", title: "Forecast", subtitle: "Usage trend" },
];

export default function QuickActions({ onAction }) {
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
        {ACTIONS.map((action) => (
          <Pressable
            key={action.key}
            style={styles.card}
            onPress={() => onAction(action.key)}
          >
            <Text style={styles.cardTitle}>{action.title}</Text>
            <Text style={styles.cardSub}>{action.subtitle}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C2C2C",
  },
  meta: {
    color: "#8C7C71",
    fontSize: 12,
  },
  row: {
    paddingTop: 10,
    gap: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    minWidth: 140,
    borderWidth: 1,
    borderColor: "#E0D6CC",
  },
  cardTitle: {
    color: "#1F2A24",
    fontWeight: "700",
    fontSize: 14,
  },
  cardSub: {
    color: "#8C7C71",
    marginTop: 4,
    fontSize: 12,
  },
});
