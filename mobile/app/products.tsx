import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { API_BASE_URL } from "@/constants/api";
import { useTheme } from "@/context/theme";
import {
  ArrowLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  PackageCheck,
  Search,
  ShoppingBasket,
  SlidersHorizontal,
  X,
  Camera,
} from "lucide-react-native";

type Product = {
  id: number | string;
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  days_left?: number;
  expiry_days?: number;
};

type FilterKey = "all" | "low" | "watch" | "stocked";

export default function ProductsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const router = useRouter();
  const params = useLocalSearchParams();
  const userId = Array.isArray(params.userId)
    ? params.userId[0]
    : params.userId;

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/products?userId=${userId}`);
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userId]);

  const lowStockCount = useMemo(
    () => products.filter((item) => isLowStock(item)).length,
    [products],
  );

  const watchCount = useMemo(
    () => products.filter((item) => isWatchItem(item)).length,
    [products],
  );

  const stockedCount = useMemo(
    () => products.filter((item) => isStocked(item)).length,
    [products],
  );

  const categoriesCount = useMemo(() => {
    const categories = products
      .map((item) => item.category?.trim())
      .filter(Boolean);
    return new Set(categories).size;
  }, [products]);

  const filters = useMemo(
    () => [
      { key: "all" as const, label: "All", count: products.length },
      { key: "low" as const, label: "Low", count: lowStockCount },
      { key: "watch" as const, label: "Watch", count: watchCount },
      { key: "stocked" as const, label: "Stocked", count: stockedCount },
    ],
    [lowStockCount, products.length, stockedCount, watchCount],
  );

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return products
      .filter((product) => {
        if (activeFilter === "low") return isLowStock(product);
        if (activeFilter === "watch") return isWatchItem(product);
        if (activeFilter === "stocked") return isStocked(product);
        return true;
      })
      .filter((product) => {
        if (!normalizedQuery) return true;
        const searchable = `${product.name} ${product.category ?? ""} ${product.unit
          }`.toLowerCase();
        return searchable.includes(normalizedQuery);
      })
      .sort((a, b) => urgencyScore(a) - urgencyScore(b));
  }, [activeFilter, products, query]);

  const openProduct = (product: Product) => {
    router.push({
      pathname: "/product",
      params: {
        userId: String(userId),
        productId: String(product.id),
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.iconButton}>
            <ArrowLeft size={20} color={colors.text1} />
          </Pressable>
          <View style={styles.titleBlock}>
            <Text style={styles.eyebrow}>Inventory</Text>
            <Text style={styles.title}>Pantry list</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{products.length}</Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroIcon}>
              <ShoppingBasket size={24} color={colors.accent1} />
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>All pantry items</Text>
              <Text style={styles.heroText}>
                Browse stock, catch low items, and open any product for consume
                or restock actions.
              </Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{lowStockCount}</Text>
              <Text style={styles.summaryLabel}>Low stock</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{watchCount}</Text>
              <Text style={styles.summaryLabel}>Watch list</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{categoriesCount}</Text>
              <Text style={styles.summaryLabel}>Categories</Text>
            </View>
          </View>
        </View>

        <View style={styles.searchPanel}>
          <View style={styles.searchBox}>
            <Search size={18} color={colors.text3} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search pantry"
              placeholderTextColor={colors.text3}
              style={styles.searchInput}
            />
            {!!query && (
              <Pressable onPress={() => setQuery("")} style={styles.clearButton}>
                <X size={16} color={colors.text2} />
              </Pressable>
            )}
          </View>

          <View style={styles.filterHeader}>
            <SlidersHorizontal size={15} color={colors.text2} />
            <Text style={styles.filterHeaderText}>Filter by status</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {filters.map((filter) => {
              const selected = activeFilter === filter.key;
              return (
                <Pressable
                  key={filter.key}
                  style={[styles.filterChip, selected && styles.filterChipActive]}
                  onPress={() => setActiveFilter(filter.key)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      selected && styles.filterTextActive,
                    ]}
                  >
                    {filter.label}
                  </Text>
                  <View
                    style={[
                      styles.filterCount,
                      selected && styles.filterCountActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterCountText,
                        selected && styles.filterCountTextActive,
                      ]}
                    >
                      {filter.count}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.accent1} />
            <Text style={styles.loadingText}>Loading pantry</Text>
          </View>
        ) : products.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <ShoppingBasket size={26} color={colors.accent1} />
            </View>
            <Text style={styles.emptyTitle}>No pantry items yet</Text>
            <Text style={styles.emptyBody}>
              Add items from the home screen and they will show up here.
            </Text>
          </View>
        ) : visibleProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Search size={26} color={colors.accent1} />
            </View>
            <Text style={styles.emptyTitle}>No matches found</Text>
            <Text style={styles.emptyBody}>
              Try another search term or switch the active filter.
            </Text>
          </View>
        ) : (
          <View style={styles.listSection}>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Items</Text>
              <Text style={styles.listMeta}>{visibleProducts.length} shown</Text>
            </View>

            <View style={styles.list}>
              {visibleProducts.map((product) => {
                const tone = toneForProduct(product, colors);
                const StatusIcon = tone.urgent ? CircleAlert : PackageCheck;

                return (
                  <Pressable
                    key={product.id}
                    style={styles.card}
                    onPress={() => openProduct(product)}
                  >
                    <View
                      style={[
                        styles.productIcon,
                        { backgroundColor: tone.background },
                      ]}
                    >
                      <StatusIcon size={20} color={tone.foreground} />
                    </View>

                    <View style={styles.cardBody}>
                      <View style={styles.cardTopLine}>
                        <Text style={styles.cardTitle} numberOfLines={1}>
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

                      <View style={styles.cardMetaLine}>
                        <Text style={styles.cardSubtitle} numberOfLines={1}>
                          {product.category || "Uncategorized"}
                        </Text>
                        <Text style={styles.cardQty} numberOfLines={1}>
                          {product.quantity} {product.unit}
                        </Text>
                      </View>

                      <View style={styles.daysLine}>
                        <Clock3 size={13} color={colors.text3} />
                        <Text style={styles.daysText}>{daysLeftLabel(product)}</Text>
                      </View>
                    </View>

                    <ChevronRight size={18} color={colors.text3} />
                  </Pressable>
                );
              })}
              </View>
            </View>
          )}
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const isKnownDays = (product: Product) =>
  product.days_left !== undefined &&
  product.days_left !== null &&
  product.days_left !== -1;

const isLowStock = (product: Product) =>
  isKnownDays(product) && Number(product.days_left) < 3;

const isWatchItem = (product: Product) =>
  isKnownDays(product) && Number(product.days_left) >= 3 && Number(product.days_left) < 7;

const isStocked = (product: Product) =>
  !isKnownDays(product) || Number(product.days_left) >= 7;

const urgencyScore = (product: Product) => {
  if (isLowStock(product)) return 0;
  if (isWatchItem(product)) return 1;
  if (isKnownDays(product)) return 2;
  return 3;
};

const daysLeftLabel = (product: Product) => {
  if (!isKnownDays(product)) return "Forecast unavailable";
  if (Number(product.days_left) === 0) return "Runs out today";
  if (Number(product.days_left) === 1) return "1 day remaining";
  return `${product.days_left} days remaining`;
};

const toneForProduct = (product: Product, colors: any) => {
  const isDark = colors.bg === "#000000";
  const softAccent = isDark ? "rgba(74, 222, 128, 0.14)" : "#eaf7ef";

  if (!isKnownDays(product)) {
    return {
      label: "Unknown",
      foreground: colors.text2,
      background: colors.surface2,
      urgent: false,
    };
  }

  if (isLowStock(product)) {
    return {
      label: "Low",
      foreground: colors.danger,
      background: isDark
        ? "rgba(239, 68, 68, 0.14)"
        : "rgba(220, 38, 38, 0.08)",
      urgent: true,
    };
  }

  if (isWatchItem(product)) {
    return {
      label: "Watch",
      foreground: colors.warning,
      background: isDark
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
  const shadowColor = isDark ? "#000000" : "#102116";

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    content: {
      paddingHorizontal: 18,
      paddingTop: 16,
      paddingBottom: 34,
      gap: 18,
    },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    iconButton: {
      width: 44,
      height: 44,
      borderRadius: 15,
      backgroundColor: colors.surface1,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    titleBlock: {
      flex: 1,
    },
    eyebrow: {
      color: colors.accent1,
      fontSize: 11,
      fontWeight: "900",
      textTransform: "uppercase",
    },
    title: {
      fontSize: 28,
      lineHeight: 33,
      fontWeight: "900",
      color: colors.text1,
      marginTop: 2,
    },
    countBadge: {
      minWidth: 44,
      height: 44,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: softAccent,
      borderWidth: 1,
      borderColor: isDark ? "rgba(74, 222, 128, 0.28)" : "#ccebd8",
      paddingHorizontal: 10,
    },
    countText: {
      color: colors.accent1,
      fontWeight: "900",
      fontSize: 16,
    },
    heroCard: {
      backgroundColor: colors.surface1,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 18,
      gap: 16,
      shadowColor,
      shadowOpacity: isDark ? 0 : 0.08,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 12 },
      elevation: 3,
    },
    heroHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 13,
    },
    heroIcon: {
      width: 54,
      height: 54,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: softAccent,
    },
    heroCopy: {
      flex: 1,
    },
    heroTitle: {
      color: colors.text1,
      fontSize: 18,
      fontWeight: "900",
    },
    heroText: {
      color: colors.text2,
      fontSize: 13,
      lineHeight: 19,
      marginTop: 4,
    },
    summaryRow: {
      flexDirection: "row",
      gap: 10,
    },
    summaryCard: {
      flex: 1,
      minHeight: 76,
      borderRadius: 17,
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      justifyContent: "space-between",
    },
    summaryValue: {
      color: colors.text1,
      fontSize: 21,
      fontWeight: "900",
    },
    summaryLabel: {
      color: colors.text3,
      fontSize: 10,
      fontWeight: "800",
      textTransform: "uppercase",
    },
    searchPanel: {
      backgroundColor: colors.surface1,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      gap: 12,
    },
    searchBox: {
      minHeight: 50,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bg,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 13,
      gap: 9,
    },
    searchInput: {
      flex: 1,
      color: colors.text1,
      fontSize: 15,
      fontWeight: "700",
      paddingVertical: 0,
    },
    clearButton: {
      width: 30,
      height: 30,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface2,
    },
    filterHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 2,
    },
    filterHeaderText: {
      color: colors.text2,
      fontSize: 12,
      fontWeight: "800",
      textTransform: "uppercase",
    },
    filterRow: {
      gap: 10,
      paddingRight: 4,
    },
    filterChip: {
      minHeight: 38,
      borderRadius: 999,
      paddingLeft: 13,
      paddingRight: 6,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bg,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    filterChipActive: {
      borderColor: colors.accent1,
      backgroundColor: softAccent,
    },
    filterText: {
      color: colors.text2,
      fontSize: 13,
      fontWeight: "800",
    },
    filterTextActive: {
      color: colors.text1,
    },
    filterCount: {
      minWidth: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface2,
      paddingHorizontal: 8,
    },
    filterCountActive: {
      backgroundColor: colors.accent1,
    },
    filterCountText: {
      color: colors.text2,
      fontSize: 11,
      fontWeight: "900",
    },
    filterCountTextActive: {
      color: colors.bg,
    },
    loadingWrap: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 44,
      gap: 10,
    },
    loadingText: {
      color: colors.text2,
      fontSize: 13,
      fontWeight: "800",
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: 40,
      paddingHorizontal: 22,
      gap: 10,
    },
    emptyIcon: {
      width: 58,
      height: 58,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: softAccent,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "900",
      color: colors.text1,
    },
    emptyBody: {
      color: colors.text2,
      textAlign: "center",
      lineHeight: 20,
      fontSize: 14,
    },
    listSection: {
      gap: 12,
    },
    listHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 2,
    },
    listTitle: {
      color: colors.text1,
      fontSize: 20,
      fontWeight: "900",
    },
    listMeta: {
      color: colors.text3,
      fontSize: 12,
      fontWeight: "800",
      textTransform: "uppercase",
    },
    list: {
      gap: 10,
    },
    card: {
      minHeight: 88,
      backgroundColor: colors.surface1,
      borderRadius: 20,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    productIcon: {
      width: 48,
      height: 48,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    cardBody: {
      flex: 1,
      gap: 7,
    },
    cardTopLine: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    cardTitle: {
      flex: 1,
      fontSize: 16,
      fontWeight: "900",
      color: colors.text1,
    },
    statusText: {
      fontSize: 11,
      fontWeight: "900",
      textTransform: "uppercase",
    },
    cardMetaLine: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    cardSubtitle: {
      flex: 1,
      fontSize: 13,
      color: colors.text2,
      fontWeight: "700",
    },
    cardQty: {
      fontSize: 13,
      fontWeight: "900",
      color: colors.text1,
    },
    daysLine: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    daysText: {
      color: colors.text3,
      fontSize: 12,
      fontWeight: "700",
    },
  });
};
