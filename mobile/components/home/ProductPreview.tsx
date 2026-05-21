import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTheme } from "@/context/theme";
import {
  ArrowRight,
  CircleAlert,
  PackageCheck,
  ShoppingBasket,
} from "lucide-react-native";

type Product = {
  id: number | string;
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  days_left?: number;
};

type ProductPreviewProps = {
  loading: boolean;
  products: Product[];
  onViewAll: () => void;
  onPressProduct: (product: Product) => void;
};

export default function ProductPreview({
  loading,
  products,
  onViewAll,
  onPressProduct,
}: ProductPreviewProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const previewItems = products.slice(0, 5);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.eyebrow}>Inventory</Text>
          <Text style={styles.title}>Pantry list</Text>
        </View>
        <Pressable onPress={onViewAll} style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>View all</Text>
          <ArrowRight size={14} color={colors.text1} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.accent1} />
          <Text style={styles.loadingText}>Loading products</Text>
        </View>
      ) : previewItems.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <ShoppingBasket size={24} color={colors.accent1} />
          </View>
          <Text style={styles.emptyTitle}>No pantry items yet</Text>
          <Text style={styles.emptyBody}>
            Add your staples and the dashboard will start tracking stock.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {previewItems.map((product) => {
            const tone = toneForDays(product.days_left, colors);
            const StatusIcon = tone.urgent ? CircleAlert : PackageCheck;
            return (
              <Pressable
                key={product.id}
                style={styles.row}
                onPress={() => onPressProduct(product)}
              >
                <View
                  style={[
                    styles.productIcon,
                    { backgroundColor: tone.background },
                  ]}
                >
                  <StatusIcon size={18} color={tone.foreground} />
                </View>

                <View style={styles.productCopy}>
                  <View style={styles.productTitleRow}>
                    <Text style={styles.productName} numberOfLines={1}>
                      {product.name}
                    </Text>
                    <Text
                      style={[
                        styles.statusText,
                        { color: tone.foreground },
                      ]}
                    >
                      {tone.label}
                    </Text>
                  </View>
                  <Text style={styles.productMeta} numberOfLines={1}>
                    {product.quantity} {product.unit}
                    {product.category ? ` | ${product.category}` : ""}
                  </Text>
                </View>

                <ArrowRight size={16} color={colors.text3} />
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const toneForDays = (
  daysLeft: number | null | undefined,
  colors: any,
) => {
  const softAccent =
    colors.bg === "#000000" ? "rgba(74, 222, 128, 0.14)" : "#eaf7ef";
  if (daysLeft === -1 || daysLeft === undefined || daysLeft === null) {
    return {
      label: "Unknown",
      foreground: colors.text2,
      background: colors.surface2,
      urgent: false,
    };
  }
  if (daysLeft < 3) {
    return {
      label: `${daysLeft}d left`,
      foreground: colors.danger,
      background:
        colors.bg === "#000000"
          ? "rgba(239, 68, 68, 0.14)"
          : "rgba(220, 38, 38, 0.08)",
      urgent: true,
    };
  }
  if (daysLeft < 7) {
    return {
      label: `${daysLeft}d left`,
      foreground: colors.warning,
      background:
        colors.bg === "#000000"
          ? "rgba(234, 179, 8, 0.14)"
          : "rgba(202, 138, 4, 0.1)",
      urgent: false,
    };
  }
  return {
    label: "Stocked",
    foreground: colors.accent1,
    background: softAccent,
    urgent: false,
  };
};

const createStyles = (colors: any) => {
  const isDark = colors.bg === "#000000";
  const softAccent = isDark ? "rgba(74, 222, 128, 0.14)" : "#eaf7ef";

  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface1,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 18,
      gap: 16,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
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
    viewAllButton: {
      minHeight: 38,
      backgroundColor: colors.bg,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    viewAllText: {
      color: colors.text1,
      fontWeight: "800",
      fontSize: 12,
    },
    loadingWrap: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 32,
      gap: 10,
    },
    loadingText: {
      color: colors.text2,
      fontSize: 13,
      fontWeight: "700",
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: 28,
      gap: 9,
    },
    emptyIcon: {
      width: 54,
      height: 54,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: softAccent,
    },
    emptyTitle: {
      fontSize: 17,
      fontWeight: "900",
      color: colors.text1,
    },
    emptyBody: {
      color: colors.text2,
      textAlign: "center",
      fontSize: 13,
      lineHeight: 19,
      maxWidth: 260,
    },
    list: {
      gap: 10,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      minHeight: 72,
      borderRadius: 18,
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    productIcon: {
      width: 44,
      height: 44,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
    },
    productCopy: {
      flex: 1,
      gap: 5,
    },
    productTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    productName: {
      flex: 1,
      fontSize: 15,
      fontWeight: "900",
      color: colors.text1,
    },
    statusText: {
      fontSize: 11,
      fontWeight: "900",
      textTransform: "uppercase",
    },
    productMeta: {
      color: colors.text2,
      fontSize: 13,
      fontWeight: "600",
    },
  });
};
