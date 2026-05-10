import { API_BASE_URL } from "@/constants/api";
import { useTheme } from "@/context/theme";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  ArrowLeft,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  Tag,
  BarChart3,
} from "lucide-react-native";

type Product = {
  id: number | string;
  name: string;
  category?: string;
  price?: number;
};

type CategoryStat = {
  name: string;
  avgPrice: number;
};

type RangeStat = {
  name: string;
  count: number;
};

export default function MarketPriceScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const params = useLocalSearchParams();
  const userId = Array.isArray(params.userId)
    ? params.userId[0]
    : params.userId;

  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScraping, setIsScraping] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPrices = async (isRefresh = false) => {
    if (!userId) {
      setLoading(false);
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/products?userId=${userId}`);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, [userId]);

  const stats = useMemo(() => {
    const validItems = items.filter((item) => Number(item.price) > 0);
    if (!validItems.length) {
      return null;
    }

    const totalValue = validItems.reduce(
      (sum, item) => sum + Number(item.price),
      0,
    );
    const avgPrice = totalValue / validItems.length;
    const mostExpensive = [...validItems].sort(
      (a, b) => Number(b.price) - Number(a.price),
    )[0];

    const groupedByCategory: Record<string, { sum: number; count: number }> =
      {};
    validItems.forEach((item) => {
      const key = item.category || "Other";
      if (!groupedByCategory[key]) {
        groupedByCategory[key] = { sum: 0, count: 0 };
      }
      groupedByCategory[key].sum += Number(item.price);
      groupedByCategory[key].count += 1;
    });

    const categoryData: CategoryStat[] = Object.keys(groupedByCategory)
      .map((name) => ({
        name,
        avgPrice: Math.round(
          groupedByCategory[name].sum / groupedByCategory[name].count,
        ),
      }))
      .sort((a, b) => b.avgPrice - a.avgPrice)
      .slice(0, 6); // Limit to top 6 for a cleaner UI

    const ranges: RangeStat[] = [
      { name: "0-300", count: 0 },
      { name: "300-800", count: 0 },
      { name: "800-1500", count: 0 },
      { name: "1500+", count: 0 },
    ];

    validItems.forEach((item) => {
      const price = Number(item.price);
      if (price < 300) ranges[0].count += 1;
      else if (price < 800) ranges[1].count += 1;
      else if (price < 1500) ranges[2].count += 1;
      else ranges[3].count += 1;
    });

    return {
      totalValue,
      avgPrice,
      mostExpensive,
      categoryData,
      ranges,
    };
  }, [items]);

  const handleLiveUpdate = () => {
    if (!userId || isScraping) return;

    Alert.alert(
      "Scrape Live Prices?",
      "This will scan the market for updated prices on your current products.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Scan Market",
          onPress: async () => {
            setIsScraping(true);
            try {
              const res = await fetch(
                `${API_BASE_URL}/analytics/fetch-live-prices`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ userId }),
                },
              );
              const data = await res.json();
              if (data?.success) {
                fetchPrices(true);
              } else {
                Alert.alert(
                  "Update failed",
                  data?.message || "Please try again.",
                );
              }
            } catch (err) {
              Alert.alert("Update failed", "Could not fetch live prices.");
            } finally {
              setIsScraping(false);
            }
          },
        },
      ],
    );
  };

  if (!userId) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyState}>
          <AlertCircle size={48} color={colors.text3} />
          <Text style={styles.emptyTitle}>Session expired</Text>
          <Text style={styles.emptyBody}>Please log in again to continue.</Text>
          <Pressable
            style={styles.primaryButton}
            onPress={() => router.replace("/login")}
          >
            <Text style={styles.primaryButtonText}>Go to login</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}>
          <ArrowLeft size={24} color={colors.text1} />
        </Pressable>
        <Text style={styles.title}>Market Intelligence</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.accent1} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchPrices(true)}
              tintColor={colors.accent1}
            />
          }
        >
          {stats ? (
            <>
              {/* Hero Dashboard */}
              <View style={styles.heroCard}>
                <Text style={styles.heroLabel}>Total Basket Value</Text>
                <Text style={styles.heroValue}>
                  Rs {Math.round(stats.totalValue).toLocaleString()}
                </Text>

                <Pressable
                  style={[
                    styles.scrapeButton,
                    isScraping && styles.disabledButton,
                  ]}
                  onPress={handleLiveUpdate}
                  disabled={isScraping}
                >
                  <RefreshCw
                    size={18}
                    color={colors.bg}
                    style={isScraping ? styles.spinningIcon : {}}
                  />
                  <Text style={styles.scrapeButtonText}>
                    {isScraping ? "Scanning Market..." : "Scrape Live Prices"}
                  </Text>
                </Pressable>
              </View>

              {/* Quick Stats Grid */}
              <View style={styles.kpiRow}>
                <View style={styles.kpiBox}>
                  <View style={styles.kpiIconWrap}>
                    <TrendingUp size={16} color={colors.accent1} />
                  </View>
                  <Text style={styles.kpiLabel}>Average Price</Text>
                  <Text style={styles.kpiValue}>
                    Rs {Math.round(stats.avgPrice).toLocaleString()}
                  </Text>
                </View>

                <View style={styles.kpiBox}>
                  <View style={styles.kpiIconWrap}>
                    <Tag size={16} color={colors.accent1} />
                  </View>
                  <Text style={styles.kpiLabel}>Most Expensive</Text>
                  <Text style={styles.kpiValue} numberOfLines={1}>
                    Rs{" "}
                    {Number(stats.mostExpensive?.price || 0).toLocaleString()}
                  </Text>
                  <Text style={styles.kpiSubText} numberOfLines={1}>
                    {stats.mostExpensive?.name}
                  </Text>
                </View>
              </View>

              {/* Proper Vertical Column Chart (Price Distribution) */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <BarChart3 size={20} color={colors.text1} />
                  <Text style={styles.sectionTitle}>Price Distribution</Text>
                </View>
                <View style={styles.columnChartContainer}>
                  {stats.ranges.map((bucket) => {
                    const max = Math.max(
                      ...stats.ranges.map((item) => item.count),
                      1,
                    );
                    const heightPercent = (bucket.count / max) * 100;
                    return (
                      <View key={bucket.name} style={styles.columnWrap}>
                        <Text style={styles.columnValue}>{bucket.count}</Text>
                        <View style={styles.columnTrack}>
                          <View
                            style={[
                              styles.columnFill,
                              { height: `${heightPercent}%` },
                            ]}
                          />
                        </View>
                        <Text style={styles.columnLabel}>{bucket.name}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Horizontal Bar Chart (Categories) */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>
                  Average Price by Category
                </Text>
                <View style={styles.barChartContainer}>
                  {stats.categoryData.map((row) => {
                    const max = Math.max(
                      ...stats.categoryData.map((item) => item.avgPrice),
                      1,
                    );
                    const widthPercent = Math.max(
                      (row.avgPrice / max) * 100,
                      2,
                    ); // min 2% so it's visible
                    return (
                      <View key={row.name} style={styles.barChartRow}>
                        <View style={styles.barChartLabels}>
                          <Text
                            style={styles.barCategoryLabel}
                            numberOfLines={1}
                          >
                            {row.name}
                          </Text>
                          <Text style={styles.barPriceLabel}>
                            Rs {row.avgPrice}
                          </Text>
                        </View>
                        <View style={styles.barTrack}>
                          <View
                            style={[
                              styles.barFill,
                              { width: `${widthPercent}%` },
                            ]}
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            </>
          ) : (
            <View style={styles.emptyStateCard}>
              <BarChart3 size={48} color={colors.surface3} />
              <Text style={styles.emptyTitle}>No insights available</Text>
              <Text style={styles.emptyBody}>
                Add products to your inventory and run live scraping to generate
                analytics.
              </Text>
              <Pressable
                style={styles.primaryButton}
                onPress={handleLiveUpdate}
                disabled={isScraping}
              >
                <Text style={styles.primaryButtonText}>
                  {isScraping ? "Scanning..." : "Scrape Market Now"}
                </Text>
              </Pressable>
            </View>
          )}

          {/* Table / List */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Live Price Feed</Text>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.headerCell, styles.nameCell]}>Item</Text>
              <Text style={[styles.headerCell, styles.priceCell]}>
                Market Price
              </Text>
            </View>

            {items.length === 0 ? (
              <View style={styles.emptyListWrap}>
                <Text style={styles.emptyBody}>No products tracked yet.</Text>
              </View>
            ) : (
              items.map((item, index) => (
                <View
                  key={String(item.id)}
                  style={[
                    styles.tableRow,
                    index === items.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <View style={styles.nameCell}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemCategory}>
                      {item.category || "Uncategorized"}
                    </Text>
                  </View>
                  <Text style={styles.itemPrice}>
                    Rs {Number(item.price || 0).toLocaleString()}
                  </Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.bg,
    },
    iconButton: {
      padding: 8,
      marginLeft: -8,
    },
    title: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text1,
      letterSpacing: -0.5,
    },
    headerSpacer: {
      width: 40,
    },
    content: {
      padding: 20,
      gap: 20,
      paddingBottom: 40,
    },
    loadingWrap: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    // Hero Section
    heroCard: {
      backgroundColor: colors.surface1,
      borderRadius: 24,
      padding: 24,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    heroLabel: {
      color: colors.text2,
      fontSize: 14,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 8,
    },
    heroValue: {
      color: colors.text1,
      fontSize: 42,
      fontWeight: "800",
      letterSpacing: -1,
      marginBottom: 24,
    },
    scrapeButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accent1,
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 100, // Pill shape
      width: "100%",
      gap: 8,
    },
    scrapeButtonText: {
      color: colors.bg,
      fontSize: 16,
      fontWeight: "700",
    },
    spinningIcon: {
      // In a real app, add a react-native-reanimated rotation here
      opacity: 0.8,
    },
    disabledButton: {
      opacity: 0.6,
    },
    // KPI Row
    kpiRow: {
      flexDirection: "row",
      gap: 16,
    },
    kpiBox: {
      flex: 1,
      backgroundColor: colors.surface1,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    kpiIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: colors.surface2,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    kpiLabel: {
      color: colors.text2,
      fontSize: 13,
      fontWeight: "600",
      marginBottom: 4,
    },
    kpiValue: {
      color: colors.text1,
      fontSize: 20,
      fontWeight: "700",
    },
    kpiSubText: {
      color: colors.accent1,
      fontSize: 12,
      fontWeight: "600",
      marginTop: 2,
    },
    // Section Cards
    sectionCard: {
      backgroundColor: colors.surface1,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 16,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    sectionTitle: {
      color: colors.text1,
      fontSize: 18,
      fontWeight: "700",
      letterSpacing: -0.3,
    },
    // Column Chart (Vertical Bars)
    columnChartContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      height: 180,
      marginTop: 10,
      paddingHorizontal: 10,
    },
    columnWrap: {
      alignItems: "center",
      flex: 1,
      height: "100%",
      justifyContent: "flex-end",
      gap: 8,
    },
    columnValue: {
      color: colors.text2,
      fontSize: 12,
      fontWeight: "700",
    },
    columnTrack: {
      width: 36,
      flex: 1,
      backgroundColor: colors.surface2,
      borderRadius: 8,
      justifyContent: "flex-end",
      overflow: "hidden",
    },
    columnFill: {
      width: "100%",
      backgroundColor: colors.accent1,
      borderRadius: 8,
    },
    columnLabel: {
      color: colors.text2,
      fontSize: 11,
      fontWeight: "600",
    },
    // Bar Chart (Horizontal Bars)
    barChartContainer: {
      gap: 16,
      marginTop: 4,
    },
    barChartRow: {
      gap: 8,
    },
    barChartLabels: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    barCategoryLabel: {
      color: colors.text1,
      fontSize: 14,
      fontWeight: "600",
      flex: 1,
    },
    barPriceLabel: {
      color: colors.text2,
      fontSize: 13,
      fontWeight: "600",
    },
    barTrack: {
      height: 10,
      backgroundColor: colors.surface2,
      borderRadius: 999,
      overflow: "hidden",
    },
    barFill: {
      height: "100%",
      backgroundColor: colors.accent1,
      borderRadius: 999,
    },
    // Table styling
    tableHeaderRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingBottom: 10,
      marginTop: 4,
    },
    headerCell: {
      color: colors.text3,
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    tableRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottomWidth: 1,
      borderBottomColor: colors.surface2,
      paddingVertical: 14,
    },
    nameCell: {
      flex: 1,
      paddingRight: 16,
    },
    priceCell: {
      width: 100,
      textAlign: "right",
    },
    itemName: {
      color: colors.text1,
      fontSize: 15,
      fontWeight: "600",
    },
    itemCategory: {
      color: colors.text3,
      fontSize: 12,
      marginTop: 4,
    },
    itemPrice: {
      color: colors.text1,
      fontSize: 15,
      fontWeight: "700",
      textAlign: "right",
    },
    // Empty & Buttons
    emptyStateCard: {
      backgroundColor: colors.surface1,
      borderRadius: 20,
      padding: 32,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12,
    },
    emptyListWrap: {
      paddingVertical: 24,
      alignItems: "center",
    },
    emptyState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      paddingHorizontal: 32,
    },
    emptyTitle: {
      color: colors.text1,
      fontSize: 20,
      fontWeight: "700",
      textAlign: "center",
      marginTop: 8,
    },
    emptyBody: {
      color: colors.text2,
      fontSize: 15,
      textAlign: "center",
      lineHeight: 22,
      marginBottom: 12,
    },
    primaryButton: {
      backgroundColor: colors.accent1,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 24,
      width: "100%",
      alignItems: "center",
    },
    primaryButtonText: {
      color: colors.bg,
      fontWeight: "700",
      fontSize: 16,
    },
  });
