import { API_BASE_URL } from "@/constants/api";
import PricePreviewModal, {
  PricePreviewItem,
} from "@/components/market-price/PricePreviewModal";
import ScrapeOptionsModal from "@/components/market-price/ScrapeOptionsModal";
import { useTheme } from "@/context/theme";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  ArrowLeft,
  BadgeDollarSign,
  ChartNoAxesCombined,
  CheckCircle2,
  Circle,
  CircleAlert,
  PackageCheck,
  RefreshCw,
  Search,
  Sparkles,
  Store,
  Tag,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react-native";

type Product = {
  id: number | string;
  name: string;
  category?: string;
  price?: number;
  quantity?: number;
  unit?: string;
};

type CategoryStat = {
  name: string;
  avgPrice: number;
};

type RangeStat = {
  name: string;
  count: number;
};

type MarketStats = {
  totalValue: number;
  avgPrice: number;
  mostExpensive?: Product;
  pricedCount: number;
  missingPriceCount: number;
  categoryData: CategoryStat[];
  ranges: RangeStat[];
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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewResults, setPreviewResults] = useState<PricePreviewItem[]>([]);
  const [savingPrices, setSavingPrices] = useState(false);

  const fetchPrices = useCallback(
    async (isRefresh = false) => {
      if (!userId) {
        setLoading(false);
        return;
      }

      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const res = await fetch(`${API_BASE_URL}/products?userId=${userId}`);
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userId],
  );

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  const stats = useMemo<MarketStats | null>(() => {
    const validItems = items.filter((item) => Number(item.price) > 0);
    if (!items.length) return null;

    const totalValue = validItems.reduce(
      (sum, item) => sum + Number(item.price),
      0,
    );
    const avgPrice = validItems.length ? totalValue / validItems.length : 0;
    const mostExpensive = [...validItems].sort(
      (a, b) => Number(b.price) - Number(a.price),
    )[0];

    const groupedByCategory: Record<string, { sum: number; count: number }> =
      {};
    validItems.forEach((item) => {
      const key = item.category || "Other";
      if (!groupedByCategory[key]) groupedByCategory[key] = { sum: 0, count: 0 };
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
      .slice(0, 6);

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
      pricedCount: validItems.length,
      missingPriceCount: items.length - validItems.length,
      categoryData,
      ranges,
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return items;
    return items.filter((item) => {
      const searchable = `${item.name} ${item.category ?? ""} ${
        item.unit ?? ""
      }`.toLowerCase();
      return searchable.includes(normalizedQuery);
    });
  }, [items, searchQuery]);

  const selectedCount = selectedItemIds.length;

  const toggleSelection = (id: number) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id],
    );
  };

  const handleLiveUpdate = () => {
    if (!userId || isScraping) return;
    setOptionsModalVisible(true);
  };

  const performScrape = async (zeroPriceOnly: boolean, itemIds: number[]) => {
    setIsScraping(true);
    setOptionsModalVisible(false);
    try {
      const res = await fetch(
        `${API_BASE_URL}/analytics/fetch-live-prices-preview`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, itemIds, zeroPriceOnly }),
        },
      );
      const data = await res.json();
      if (data?.success) {
        setPreviewResults(data.results || []);
        if (data.results?.length > 0) {
          setPreviewModalVisible(true);
        } else {
          Alert.alert(
            "No results",
            "Could not find market prices for the requested products.",
          );
        }
      } else {
        Alert.alert("Scan failed", data?.message || "Could not fetch prices.");
      }
    } catch {
      Alert.alert("Error", "Server error. Try again.");
    } finally {
      setIsScraping(false);
    }
  };

  const handleSavePrices = async (updates: PricePreviewItem[]) => {
    setSavingPrices(true);
    try {
      const res = await fetch(`${API_BASE_URL}/analytics/save-live-prices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, updates }),
      });
      const data = await res.json();
      if (data?.success) {
        setPreviewModalVisible(false);
        setSelectedItemIds([]);
        fetchPrices(true);
      } else {
        Alert.alert("Save failed", data?.message || "Could not save prices.");
      }
    } catch {
      Alert.alert("Error", "Server error while saving.");
    } finally {
      setSavingPrices(false);
    }
  };

  if (!userId) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyState}>
          <CircleAlert size={48} color={colors.text3} />
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

  const renderDashboardHeader = () => (
    <View style={styles.dashboardHeader}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}>
          <ArrowLeft size={20} color={colors.text1} />
        </Pressable>
        <View style={styles.titleBlock}>
          <Text style={styles.eyebrow}>Market</Text>
          <Text style={styles.title}>Prices</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{items.length}</Text>
        </View>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View style={styles.heroIcon}>
            <Store size={24} color={colors.accent1} />
          </View>
          <View style={styles.heroCopy}>
            <View style={styles.sourcePill}>
              <Sparkles size={13} color={colors.accent1} />
              <Text style={styles.sourceText}>Al-Fatah Online</Text>
            </View>
            <Text style={styles.heroTitle}>Market price scan</Text>
            <Text style={styles.heroText}>
              Refresh grocery prices, review changes, and save clean market
              values back into your pantry.
            </Text>
          </View>
        </View>

        <Pressable
          style={[styles.scanButton, isScraping && styles.disabledButton]}
          onPress={handleLiveUpdate}
          disabled={isScraping}
        >
          <RefreshCw size={18} color={colors.bg} />
          <Text style={styles.scanButtonText}>
            {isScraping ? "Scanning market..." : "Scan live prices"}
          </Text>
        </Pressable>
      </View>

      {stats ? (
        <>
          <View style={styles.kpiGrid}>
            <View style={styles.kpiRow}>
              <MetricCard
                colors={colors}
                styles={styles}
                icon={Tag}
                label="Average"
                value={formatRupees(stats.avgPrice)}
                subText={`${stats.pricedCount} priced`}
              />
              <MetricCard
                colors={colors}
                styles={styles}
                icon={CircleAlert}
                label="Missing"
                value={String(stats.missingPriceCount)}
                subText="need scan"
              />
            </View>

            <View style={styles.valueCard}>
              <View style={styles.valueIcon}>
                <Wallet size={20} color={colors.accent1} />
              </View>
              <View style={styles.valueCopy}>
                <Text style={styles.valueLabel}>Market basket value</Text>
                <Text style={styles.valueAmount}>
                  {formatRupees(stats.totalValue)}
                </Text>
                <Text style={styles.valueSubText}>
                  Cost to buy one of every priced item
                </Text>
              </View>
            </View>

            {!!stats.mostExpensive && (
              <View style={styles.highlightCard}>
                <View style={styles.highlightIcon}>
                  <TrendingUp size={20} color={colors.accent1} />
                </View>
                <View style={styles.highlightCopy}>
                  <Text style={styles.highlightLabel}>Highest item</Text>
                  <Text style={styles.highlightTitle} numberOfLines={1}>
                    {stats.mostExpensive.name}
                  </Text>
                </View>
                <Text style={styles.highlightPrice}>
                  {formatRupees(stats.mostExpensive.price)}
                </Text>
              </View>
            )}
          </View>

          {stats.categoryData.length > 0 && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <ChartNoAxesCombined size={18} color={colors.accent1} />
                <Text style={styles.sectionTitle}>Average by category</Text>
              </View>
              <View style={styles.barChartContainer}>
                {stats.categoryData.map((row) => {
                  const max = Math.max(
                    ...stats.categoryData.map((item) => item.avgPrice),
                    1,
                  );
                  const widthPercent = Math.max((row.avgPrice / max) * 100, 4);
                  return (
                    <View key={row.name} style={styles.barChartRow}>
                      <View style={styles.barChartLabels}>
                        <Text style={styles.barCategoryLabel} numberOfLines={1}>
                          {row.name}
                        </Text>
                        <Text style={styles.barPriceLabel}>
                          {formatRupees(row.avgPrice)}
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
          )}

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <BadgeDollarSign size={18} color={colors.accent1} />
              <Text style={styles.sectionTitle}>Price distribution</Text>
            </View>
            <View style={styles.columnChartContainer}>
              {stats.ranges.map((bucket) => {
                const max = Math.max(
                  ...stats.ranges.map((item) => item.count),
                  1,
                );
                const heightPercent = Math.max((bucket.count / max) * 100, 4);
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
        </>
      ) : (
        <View style={styles.emptyStateCard}>
          <ChartNoAxesCombined size={44} color={colors.text3} />
          <Text style={styles.emptyTitle}>No price insights yet</Text>
          <Text style={styles.emptyBody}>
            Add products to your pantry, then run a scan to build market
            analytics.
          </Text>
        </View>
      )}

      <View style={styles.searchPanel}>
        <View style={styles.listHeaderTitleRow}>
          <View>
            <Text style={styles.eyebrow}>Feed</Text>
            <Text style={styles.sectionTitle}>Live price feed</Text>
          </View>
          {selectedCount > 0 && (
            <View style={styles.selectedPill}>
              <Text style={styles.selectedPillText}>
                {selectedCount} selected
              </Text>
            </View>
          )}
        </View>

        <View style={styles.searchWrap}>
          <Search size={18} color={colors.text3} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search item or category"
            placeholderTextColor={colors.text3}
            style={styles.searchInput}
          />
          {!!searchQuery && (
            <Pressable
              onPress={() => setSearchQuery("")}
              style={styles.clearButton}
            >
              <X size={16} color={colors.text2} />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.accent1} />
          <Text style={styles.loadingText}>Loading prices</Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.flatListContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderDashboardHeader}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchPrices(true)}
              tintColor={colors.accent1}
            />
          }
          renderItem={({ item }) => {
            const itemId = Number(item.id);
            const isSelected = selectedItemIds.includes(itemId);
            const hasPrice = Number(item.price) > 0;

            return (
              <Pressable
                style={[styles.itemCard, isSelected && styles.itemCardSelected]}
                onPress={() => toggleSelection(itemId)}
              >
                <View style={styles.selectionIconWrap}>
                  {isSelected ? (
                    <CheckCircle2 size={22} color={colors.accent1} />
                  ) : (
                    <Circle size={22} color={colors.text3} />
                  )}
                </View>

                <View
                  style={[
                    styles.itemIcon,
                    hasPrice ? styles.itemIconPriced : styles.itemIconMissing,
                  ]}
                >
                  {hasPrice ? (
                    <PackageCheck size={18} color={colors.accent1} />
                  ) : (
                    <CircleAlert size={18} color={colors.warning} />
                  )}
                </View>

                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.itemCategory} numberOfLines={1}>
                    {item.category || "Uncategorized"}
                    {item.quantity && item.unit
                      ? ` | ${item.quantity} ${item.unit}`
                      : ""}
                  </Text>
                </View>

                <View style={styles.itemPriceWrap}>
                  <Text style={styles.itemPriceLabel}>
                    {hasPrice ? "Market" : "Missing"}
                  </Text>
                  <Text
                    style={[
                      styles.itemPrice,
                      !hasPrice && styles.itemPriceMissing,
                    ]}
                  >
                    {hasPrice ? formatRupees(item.price) : "Scan"}
                  </Text>
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyListWrap}>
              <Search size={28} color={colors.text3} />
              <Text style={styles.emptyTitle}>
                {searchQuery ? "No matching prices" : "No products tracked yet"}
              </Text>
              <Text style={styles.emptyBody}>
                {searchQuery
                  ? "Try another item name or category."
                  : "Add products to your pantry first."}
              </Text>
            </View>
          }
        />
      )}

      <ScrapeOptionsModal
        visible={optionsModalVisible}
        onClose={() => setOptionsModalVisible(false)}
        selectedCount={selectedCount}
        onScrapeSelected={() => performScrape(false, selectedItemIds)}
        onScrapeAll={() => performScrape(false, [])}
      />

      <PricePreviewModal
        visible={previewModalVisible}
        onClose={() => setPreviewModalVisible(false)}
        results={previewResults}
        onSave={handleSavePrices}
        saving={savingPrices}
      />
    </SafeAreaView>
  );
}

function MetricCard({
  colors,
  styles,
  icon: Icon,
  label,
  value,
  subText,
}: {
  colors: any;
  styles: ReturnType<typeof createStyles>;
  icon: typeof Tag;
  label: string;
  value: string;
  subText: string;
}) {
  return (
    <View style={styles.kpiBox}>
      <View style={styles.metricIcon}>
        <Icon size={17} color={colors.accent1} />
      </View>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.kpiSubText}>{subText}</Text>
    </View>
  );
}

const formatRupees = (value?: number) => {
  if (typeof value !== "number" || Number.isNaN(value)) return "Rs 0";
  return `Rs ${Math.round(value).toLocaleString("en-PK")}`;
};

const createStyles = (colors: any) => {
  const isDark = colors.bg === "#000000";
  const softAccent = isDark ? "rgba(74, 222, 128, 0.14)" : "#eaf7ef";
  const softWarning = isDark
    ? "rgba(234, 179, 8, 0.14)"
    : "rgba(202, 138, 4, 0.1)";
  const shadowColor = isDark ? "#000000" : "#102116";

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    flatListContent: {
      paddingHorizontal: 18,
      paddingTop: 16,
      paddingBottom: 34,
    },
    dashboardHeader: {
      gap: 18,
      paddingBottom: 12,
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
      color: colors.text1,
      fontSize: 30,
      fontWeight: "900",
      lineHeight: 34,
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
      borderRadius: 28,
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
      width: 56,
      height: 56,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: softAccent,
    },
    heroCopy: {
      flex: 1,
    },
    sourcePill: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      borderRadius: 999,
      paddingHorizontal: 9,
      paddingVertical: 5,
      backgroundColor: softAccent,
      marginBottom: 8,
    },
    sourceText: {
      color: colors.accent1,
      fontSize: 11,
      fontWeight: "900",
      textTransform: "uppercase",
    },
    heroTitle: {
      color: colors.text1,
      fontSize: 19,
      fontWeight: "900",
    },
    heroText: {
      color: colors.text2,
      fontSize: 13,
      lineHeight: 19,
      marginTop: 4,
    },
    scanButton: {
      minHeight: 54,
      borderRadius: 18,
      backgroundColor: colors.accent1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    scanButtonText: {
      color: colors.bg,
      fontSize: 15,
      fontWeight: "900",
    },
    disabledButton: {
      opacity: 0.65,
    },
    kpiGrid: {
      gap: 12,
    },
    kpiRow: {
      flexDirection: "row",
      gap: 12,
    },
    kpiBox: {
      flex: 1,
      minHeight: 136,
      backgroundColor: colors.surface1,
      borderRadius: 22,
      padding: 15,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: "space-between",
    },
    metricIcon: {
      width: 38,
      height: 38,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: softAccent,
    },
    kpiLabel: {
      color: colors.text3,
      fontSize: 10,
      fontWeight: "900",
      textTransform: "uppercase",
    },
    kpiValue: {
      color: colors.text1,
      fontSize: 20,
      fontWeight: "900",
    },
    kpiSubText: {
      color: colors.text2,
      fontSize: 12,
      fontWeight: "700",
    },
    valueCard: {
      backgroundColor: colors.surface1,
      borderRadius: 24,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
      gap: 13,
    },
    valueIcon: {
      width: 50,
      height: 50,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: softAccent,
    },
    valueCopy: {
      flex: 1,
    },
    valueLabel: {
      color: colors.text2,
      fontSize: 12,
      fontWeight: "800",
      textTransform: "uppercase",
    },
    valueAmount: {
      color: colors.text1,
      fontSize: 28,
      fontWeight: "900",
      marginTop: 3,
    },
    valueSubText: {
      color: colors.text3,
      fontSize: 12,
      fontWeight: "700",
      marginTop: 2,
    },
    highlightCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.surface1,
      borderRadius: 22,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    highlightIcon: {
      width: 42,
      height: 42,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: softAccent,
    },
    highlightCopy: {
      flex: 1,
    },
    highlightLabel: {
      color: colors.text3,
      fontSize: 10,
      fontWeight: "900",
      textTransform: "uppercase",
    },
    highlightTitle: {
      color: colors.text1,
      fontSize: 15,
      fontWeight: "900",
      marginTop: 2,
    },
    highlightPrice: {
      color: colors.accent1,
      fontSize: 14,
      fontWeight: "900",
    },
    sectionCard: {
      backgroundColor: colors.surface1,
      borderRadius: 24,
      padding: 18,
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
      fontSize: 20,
      fontWeight: "900",
    },
    barChartContainer: {
      gap: 14,
    },
    barChartRow: {
      gap: 8,
    },
    barChartLabels: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 10,
    },
    barCategoryLabel: {
      color: colors.text1,
      fontSize: 13,
      fontWeight: "800",
      flex: 1,
    },
    barPriceLabel: {
      color: colors.text2,
      fontSize: 12,
      fontWeight: "800",
    },
    barTrack: {
      height: 10,
      backgroundColor: colors.surface3,
      borderRadius: 999,
      overflow: "hidden",
    },
    barFill: {
      height: "100%",
      backgroundColor: colors.accent1,
      borderRadius: 999,
    },
    columnChartContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      height: 150,
      paddingHorizontal: 2,
    },
    columnWrap: {
      flex: 1,
      height: "100%",
      justifyContent: "flex-end",
      alignItems: "center",
      gap: 6,
    },
    columnValue: {
      color: colors.text2,
      fontSize: 11,
      fontWeight: "900",
    },
    columnTrack: {
      width: "100%",
      maxWidth: 34,
      flex: 1,
      backgroundColor: colors.surface3,
      borderRadius: 10,
      justifyContent: "flex-end",
      overflow: "hidden",
    },
    columnFill: {
      width: "100%",
      backgroundColor: "#f59e0b",
      borderRadius: 10,
    },
    columnLabel: {
      color: colors.text3,
      fontSize: 10,
      fontWeight: "800",
    },
    searchPanel: {
      backgroundColor: colors.surface1,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      gap: 12,
    },
    listHeaderTitleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
    },
    selectedPill: {
      borderRadius: 999,
      backgroundColor: softAccent,
      paddingHorizontal: 11,
      paddingVertical: 7,
    },
    selectedPillText: {
      color: colors.accent1,
      fontSize: 12,
      fontWeight: "900",
    },
    searchWrap: {
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
    itemCard: {
      minHeight: 82,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.surface1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 20,
      padding: 12,
      marginBottom: 10,
    },
    itemCardSelected: {
      borderColor: colors.accent1,
      backgroundColor: softAccent,
    },
    selectionIconWrap: {
      width: 24,
      alignItems: "center",
    },
    itemIcon: {
      width: 42,
      height: 42,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
    },
    itemIconPriced: {
      backgroundColor: softAccent,
    },
    itemIconMissing: {
      backgroundColor: softWarning,
    },
    itemInfo: {
      flex: 1,
      gap: 5,
    },
    itemName: {
      color: colors.text1,
      fontSize: 15,
      fontWeight: "900",
    },
    itemCategory: {
      color: colors.text2,
      fontSize: 12,
      fontWeight: "700",
    },
    itemPriceWrap: {
      alignItems: "flex-end",
      minWidth: 76,
    },
    itemPriceLabel: {
      color: colors.text3,
      fontSize: 10,
      textTransform: "uppercase",
      fontWeight: "900",
      marginBottom: 3,
    },
    itemPrice: {
      color: colors.accent1,
      fontSize: 14,
      fontWeight: "900",
    },
    itemPriceMissing: {
      color: colors.warning,
    },
    loadingWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
    loadingText: {
      color: colors.text2,
      fontSize: 13,
      fontWeight: "800",
    },
    emptyStateCard: {
      backgroundColor: colors.surface1,
      borderRadius: 24,
      padding: 28,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
      gap: 10,
    },
    emptyListWrap: {
      alignItems: "center",
      paddingVertical: 40,
      paddingHorizontal: 22,
      gap: 10,
    },
    emptyState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      paddingHorizontal: 32,
      backgroundColor: colors.bg,
    },
    emptyTitle: {
      color: colors.text1,
      fontSize: 19,
      fontWeight: "900",
      textAlign: "center",
    },
    emptyBody: {
      color: colors.text2,
      fontSize: 14,
      textAlign: "center",
      lineHeight: 20,
    },
    primaryButton: {
      marginTop: 8,
      backgroundColor: colors.accent1,
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: 20,
      alignItems: "center",
      width: "100%",
    },
    primaryButtonText: {
      color: colors.bg,
      fontWeight: "900",
      fontSize: 15,
    },
  });
};
