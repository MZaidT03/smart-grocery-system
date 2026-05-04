import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function ProductPreview({
  loading,
  products,
  onViewAll,
  onPressProduct,
}) {
  const toneForDays = (daysLeft) => {
    if (daysLeft === -1 || daysLeft === undefined || daysLeft === null) {
      return { label: "Unknown", fg: "#6B5E55", bg: "#EFE7DC" };
    }
    if (daysLeft < 3) {
      return { label: "Low", fg: "#B42318", bg: "#FEE4E2" };
    }
    if (daysLeft < 7) {
      return { label: "Watch", fg: "#B54708", bg: "#FFE7D0" };
    }
    return { label: "OK", fg: "#0E3A32", bg: "#DDF3E4" };
  };

  const previewItems = products.slice(0, 4);
  const columns = useMemo(() => {
    const result = [];
    for (let i = 0; i < previewItems.length; i += 2) {
      result.push(previewItems.slice(i, i + 2));
    }
    return result;
  }, [previewItems]);

  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Your products</Text>
        <Pressable onPress={onViewAll}>
          <Text style={styles.link}>View all</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#0E3A32" />
        </View>
      ) : previewItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No items yet</Text>
          <Text style={styles.emptyBody}>Add a product to get started.</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          {columns.map((col, index) => (
            <View key={`col-${index}`} style={styles.column}>
              {col.map((product) => {
                const tone = toneForDays(product.days_left);
                return (
                  <Pressable
                    key={product.id}
                    style={styles.card}
                    onPress={() => onPressProduct(product)}
                  >
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {product.name}
                    </Text>
                    <Text style={styles.cardQty}>
                      {product.quantity} {product.unit}
                    </Text>
                    <View
                      style={[styles.statusBadge, { backgroundColor: tone.bg }]}
                    >
                      <Text
                        style={[styles.statusBadgeText, { color: tone.fg }]}
                      >
                        {tone.label}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </ScrollView>
      )}
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
  link: {
    color: "#0E3A32",
    fontWeight: "600",
  },
  row: {
    paddingTop: 10,
    gap: 12,
  },
  column: {
    gap: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    width: 160,
    height: 160,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E0D6CC",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2C2C2C",
  },
  cardQty: {
    color: "#6B5E55",
    fontSize: 12,
  },
  statusBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  loadingWrap: {
    paddingVertical: 30,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C2C2C",
  },
  emptyBody: {
    color: "#6B5E55",
    marginTop: 6,
  },
});
