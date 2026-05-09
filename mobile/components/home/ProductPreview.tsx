import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTheme } from "@/context/theme"; // Using your updated theme context

export default function ProductPreview({
  loading,
  products,
  onViewAll,
  onPressProduct,
}: any) {
  // Pull the pure black/white/green minimal colors directly from the context
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Updated to map directly to your minimal theme values
  const toneForDays = (daysLeft: number | null | undefined) => {
    if (daysLeft === -1 || daysLeft === undefined || daysLeft === null) {
      return { label: "Unknown", fg: colors.text2, bg: colors.surface2 };
    }
    if (daysLeft < 3) {
      return { label: "Low", fg: colors.danger, bg: colors.surface2 };
    }
    if (daysLeft < 7) {
      return { label: "Watch", fg: colors.warning, bg: colors.surface2 };
    }
    return { label: "OK", fg: colors.accent1, bg: colors.surface2 };
  };

  const previewItems = products.slice(0, 4);

  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Your products</Text>
        <Pressable onPress={onViewAll} style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>View all</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.accent1} />
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
          {previewItems.map((product: any) => {
            const tone = toneForDays(product.days_left);
            return (
              <Pressable
                key={product.id}
                style={styles.card}
                onPress={() => onPressProduct(product)}
              >
                <View style={styles.cardTop}>
                  <View style={styles.cardAccent} />
                  <View
                    style={[styles.statusBadge, { backgroundColor: tone.bg }]}
                  >
                    <Text style={[styles.statusBadgeText, { color: tone.fg }]}>
                      {tone.label}
                    </Text>
                  </View>
                </View>

                <View>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {product.name}
                  </Text>
                  <Text style={styles.cardQty}>
                    {product.quantity} {product.unit}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

// Map everything to the new dynamic colors context
const createStyles = (colors: any) =>
  StyleSheet.create({
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 2,
    },

    title: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text1,
    },

    viewAllButton: {
      backgroundColor: colors.surface2, // Minimal secondary surface
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },

    viewAllText: {
      color: colors.text1, // High contrast text instead of loud accent color
      fontWeight: "600",
      fontSize: 12,
    },

    row: {
      paddingTop: 12,
      gap: 12,
      paddingRight: 20, // Prevents cutoff on horizontal scroll
    },

    card: {
      backgroundColor: colors.surface1,
      borderRadius: 18,
      padding: 16,
      width: 150,
      height: 140, // Slightly more compact and squarish for a modern grid feel
      justifyContent: "space-between",
      borderWidth: 1,
      borderColor: colors.border,
    },

    cardTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },

    cardAccent: {
      width: 24,
      height: 4,
      borderRadius: 999,
      backgroundColor: colors.accent1, // Brand Green
      marginTop: 8,
    },

    cardTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.text1,
      marginBottom: 2,
    },

    cardQty: {
      color: colors.text2,
      fontSize: 13,
      fontWeight: "500",
    },

    statusBadge: {
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: colors.border, // Crisp border for the badge
    },

    statusBadgeText: {
      fontSize: 10,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },

    loadingWrap: {
      paddingVertical: 40,
    },

    emptyState: {
      alignItems: "center",
      paddingTop: 30,
      paddingBottom: 10,
    },

    emptyTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text1,
    },

    emptyBody: {
      color: colors.text2,
      marginTop: 6,
      fontSize: 14,
    },
  });
