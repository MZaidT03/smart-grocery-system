import { API_BASE_URL } from "@/constants/api";
import { useTheme } from "@/context/theme";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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
  RefreshCw,
  TrendingUp,
  AlertCircle,
  Tag,
  BarChart3,
  Search,
  CheckCircle2,
  Circle,
  DollarSign,
} from "lucide-react-native";
import PricePreviewModal, { PricePreviewItem } from "@/components/market-price/PricePreviewModal";
import ScrapeOptionsModal from "@/components/market-price/ScrapeOptionsModal";

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
  const userId = Array.isArray(params.userId) ? params.userId[0] : params.userId;

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

  const fetchPrices = async (isRefresh = false) => {
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
    if (!validItems.length) return null;

    const totalValue = validItems.reduce((sum, item) => sum + Number(item.price), 0);
    const avgPrice = totalValue / validItems.length;
    const mostExpensive = [...validItems].sort((a, b) => Number(b.price) - Number(a.price))[0];

    const groupedByCategory: Record<string, { sum: number; count: number }> = {};
    validItems.forEach((item) => {
      const key = item.category || "Other";
      if (!groupedByCategory[key]) groupedByCategory[key] = { sum: 0, count: 0 };
      groupedByCategory[key].sum += Number(item.price);
      groupedByCategory[key].count += 1;
    });

    const categoryData: CategoryStat[] = Object.keys(groupedByCategory)
      .map((name) => ({
        name,
        avgPrice: Math.round(groupedByCategory[name].sum / groupedByCategory[name].count),
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

    return { totalValue, avgPrice, mostExpensive, categoryData, ranges };
  }, [items]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    return items.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [items, searchQuery]);

  const toggleSelection = (id: number) => {
    setSelectedItemIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleLiveUpdate = () => {
    if (!userId || isScraping) return;
    setOptionsModalVisible(true);
  };

  const performScrape = async (zeroPriceOnly: boolean, itemIds: number[]) => {
    setIsScraping(true);
    setOptionsModalVisible(false);
    try {
      const res = await fetch(`${API_BASE_URL}/analytics/fetch-live-prices-preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, itemIds, zeroPriceOnly }),
      });
      const data = await res.json();
      if (data?.success) {
        setPreviewResults(data.results || []);
        if (data.results?.length > 0) {
          setPreviewModalVisible(true);
        } else {
          Alert.alert("No results", "Could not find market prices for the requested products.");
        }
      } else {
        Alert.alert("Scan failed", data?.message || "Could not fetch prices.");
      }
    } catch (err) {
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
    } catch (err) {
      Alert.alert("Error", "Server error while saving.");
    } finally {
      setSavingPrices(false);
    }
  };

  if (!userId) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyState}>
          <AlertCircle size={48} color={colors.text3} />
          <Text style={styles.emptyTitle}>Session expired</Text>
          <Text style={styles.emptyBody}>Please log in again to continue.</Text>
          <Pressable style={styles.primaryButton} onPress={() => router.replace("/login")}>
            <Text style={styles.primaryButtonText}>Go to login</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const renderDashboardHeader = () => (
    <View style={styles.dashboardHeader}>
      {/* Intro & Scrape Button */}
      <View style={styles.introWrap}>
        <Text style={styles.introSubtitle}>Live pricing data & analytics from</Text>
        <Text style={styles.introHighlight}>Al-Fatah Online</Text>

        <Pressable
          style={[styles.scrapeButton, isScraping && styles.disabledButton]}
          onPress={handleLiveUpdate}
          disabled={isScraping}
        >
          <RefreshCw size={18} color="#fff" style={isScraping ? styles.spinningIcon : {}} />
          <Text style={styles.scrapeButtonText}>
            {isScraping ? "Scanning Market..." : "Scrape Live Prices"}
          </Text>
        </Pressable>
      </View>

      {stats ? (
        <>
          {/* Quick Stats Grid */}
          <View style={styles.kpiGrid}>
            <View style={styles.kpiRow}>
              <View style={styles.kpiBox}>
                <View style={styles.kpiHeader}>
                  <Tag size={14} color={colors.text3} />
                  <Text style={styles.kpiLabel}>AVG. ITEM PRICE</Text>
                </View>
                <Text style={styles.kpiValue}>Rs {Math.round(stats.avgPrice).toLocaleString()}</Text>
              </View>

              <View style={styles.kpiBox}>
                <View style={styles.kpiHeader}>
                  <TrendingUp size={14} color={colors.text3} />
                  <Text style={styles.kpiLabel}>MOST EXPENSIVE</Text>
                </View>
                <Text style={styles.kpiValueName} numberOfLines={1}>{stats.mostExpensive?.name}</Text>
                <Text style={styles.kpiValueSmall}>Rs {Number(stats.mostExpensive?.price || 0).toLocaleString()}</Text>
              </View>
            </View>

            <View style={styles.kpiHeroBox}>
              <View style={styles.kpiHeader}>
                <BarChart3 size={14} color={colors.text3} />
                <Text style={styles.kpiLabel}>MARKET BASKET VALUE</Text>
              </View>
              <Text style={styles.kpiValueEmerald}>Rs {Math.round(stats.totalValue).toLocaleString()}</Text>
              <Text style={styles.kpiSubText}>Total cost to buy 1 of everything</Text>
            </View>
          </View>

          {/* Chart 1: Average Price by Category */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Average Price by Category</Text>
            <View style={styles.barChartContainer}>
              {stats.categoryData.map((row) => {
                const max = Math.max(...stats.categoryData.map((item) => item.avgPrice), 1);
                const widthPercent = Math.max((row.avgPrice / max) * 100, 2);
                return (
                  <View key={row.name} style={styles.barChartRow}>
                    <View style={styles.barChartLabels}>
                      <Text style={styles.barCategoryLabel} numberOfLines={1}>{row.name}</Text>
                      <Text style={styles.barPriceLabel}>Rs {row.avgPrice}</Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFillEmerald, { width: `${widthPercent}%` }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Chart 2: Price Distribution (Histogram) */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Price Distribution</Text>
            <View style={styles.columnChartContainer}>
              {stats.ranges.map((bucket) => {
                const max = Math.max(...stats.ranges.map((item) => item.count), 1);
                const heightPercent = Math.max((bucket.count / max) * 100, 2); // Min 2% so empty bars show slightly
                return (
                  <View key={bucket.name} style={styles.columnWrap}>
                    <Text style={styles.columnValue}>{bucket.count}</Text>
                    <View style={styles.columnTrack}>
                      <View style={[styles.columnFillAmber, { height: `${heightPercent}%` }]} />
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
          <BarChart3 size={48} color={colors.surface3} />
          <Text style={styles.emptyTitle}>No insights available</Text>
          <Text style={styles.emptyBody}>
            Add products to your inventory and run live scraping to generate analytics.
          </Text>
        </View>
      )}

      {/* List Header & Search Bar */}
      <View style={styles.listHeaderWrap}>
        <View style={styles.listHeaderTitleRow}>
          <Text style={styles.sectionTitle}>Live Price Feed</Text>
          {selectedItemIds.length > 0 && (
            <Text style={styles.selectedCountText}>{selectedItemIds.length} selected</Text>
          )}
        </View>
        <View style={styles.searchWrap}>
          <Search size={18} color={colors.text3} style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search items..."
            placeholderTextColor={colors.text3}
            style={styles.searchInput}
          />
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* App Header (Fixed) */}
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}>
          <ArrowLeft size={24} color={colors.text1} />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <DollarSign size={20} color="#10B981" />
          <Text style={styles.title}>Market Intelligence</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.flatListContent}
          showsVerticalScrollIndicator={true}
          indicatorStyle="white"
          ListHeaderComponent={renderDashboardHeader}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchPrices(true)} tintColor="#10B981" />
          }
          renderItem={({ item }) => {
            const itemId = Number(item.id);
            const isSelected = selectedItemIds.includes(itemId);

            return (
              <Pressable
                style={[styles.itemCard, isSelected && styles.itemCardSelected]}
                onPress={() => toggleSelection(itemId)}
              >
                <View style={styles.selectionIconWrap}>
                  {isSelected ? (
                    <CheckCircle2 size={22} color="#10B981" />
                  ) : (
                    <Circle size={22} color={colors.text3} />
                  )}
                </View>

                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemCategory}>{item.category || "Uncategorized"}</Text>
                </View>

                <View style={styles.itemPriceWrap}>
                  <Text style={styles.itemPriceLabel}>Market</Text>
                  <Text style={styles.itemPriceEmerald}>
                    Rs {Number(item.price || 0).toLocaleString()}
                  </Text>
                  <Text style={styles.itemPriceDate}>{item.price ? "Today" : "Never"}</Text>
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyListWrap}>
              <Text style={styles.emptyBody}>
                {searchQuery ? "No matching items found." : "No products tracked yet."}
              </Text>
            </View>
          }
        />
      )}

      {/* Modals */}
      <ScrapeOptionsModal
        visible={optionsModalVisible}
        onClose={() => setOptionsModalVisible(false)}
        selectedCount={selectedItemIds.length}
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
      zIndex: 10,
    },
    iconButton: {
      padding: 8,
      marginLeft: -8,
    },
    headerTitleWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    title: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.text1,
      letterSpacing: -0.5,
    },
    headerSpacer: {
      width: 40,
    },
    loadingWrap: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },

    // FlatList container
    flatListContent: {
      padding: 20,
      paddingBottom: 40,
    },
    dashboardHeader: {
      gap: 20,
      paddingBottom: 8,
    },

    // Intro & Scrape Button
    introWrap: {
      marginBottom: 4,
    },
    introSubtitle: {
      color: colors.text2,
      fontSize: 14,
    },
    introHighlight: {
      color: "#10B981", // Emerald
      fontSize: 14,
      fontWeight: "700",
      marginBottom: 16,
    },
    scrapeButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#059669", // Emerald 600
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 14,
      width: "100%",
      gap: 8,
      shadowColor: "#10B981",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    scrapeButtonText: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "700",
    },
    spinningIcon: {
      opacity: 0.8,
    },
    disabledButton: {
      opacity: 0.6,
    },

    // KPI Grid
    kpiGrid: {
      gap: 12,
    },
    kpiRow: {
      flexDirection: "row",
      gap: 12,
    },
    kpiBox: {
      flex: 1,
      backgroundColor: colors.surface1,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    kpiHeroBox: {
      backgroundColor: colors.surface1,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    kpiHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 10,
    },
    kpiLabel: {
      color: colors.text3,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.5,
    },
    kpiValue: {
      color: colors.text1,
      fontSize: 22,
      fontWeight: "800",
    },
    kpiValueName: {
      color: colors.text1,
      fontSize: 16,
      fontWeight: "700",
    },
    kpiValueSmall: {
      color: "#10B981", // Emerald
      fontSize: 13,
      fontWeight: "700",
      marginTop: 2,
    },
    kpiValueEmerald: {
      color: "#10B981",
      fontSize: 32,
      fontWeight: "800",
    },
    kpiSubText: {
      color: colors.text3,
      fontSize: 12,
      marginTop: 4,
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
    sectionTitle: {
      color: colors.text1,
      fontSize: 17,
      fontWeight: "700",
    },

    // Column Chart (Vertical Bars / Histogram)
    columnChartContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      height: 160,
      marginTop: 10,
      paddingHorizontal: 4,
    },
    columnWrap: {
      alignItems: "center",
      flex: 1,
      height: "100%",
      justifyContent: "flex-end",
      gap: 6,
    },
    columnValue: {
      color: colors.text2,
      fontSize: 11,
      fontWeight: "700",
    },
    columnTrack: {
      width: "100%",
      maxWidth: 32,
      flex: 1,
      backgroundColor: colors.surface2,
      borderRadius: 6,
      justifyContent: "flex-end",
      overflow: "hidden",
    },
    columnFillAmber: {
      width: "100%",
      backgroundColor: "#F59E0B", // Amber
      borderRadius: 6,
    },
    columnLabel: {
      color: colors.text3,
      fontSize: 10,
      fontWeight: "600",
    },

    // Bar Chart (Horizontal Bars)
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
    },
    barCategoryLabel: {
      color: colors.text1,
      fontSize: 13,
      fontWeight: "600",
      flex: 1,
    },
    barPriceLabel: {
      color: colors.text2,
      fontSize: 12,
      fontWeight: "600",
    },
    barTrack: {
      height: 12,
      backgroundColor: colors.surface2,
      borderRadius: 999,
      overflow: "hidden",
    },
    barFillEmerald: {
      height: "100%",
      backgroundColor: "#10B981", // Emerald
      borderRadius: 999,
    },

    // List Header & Search
    listHeaderWrap: {
      marginTop: 8,
      gap: 12,
      marginBottom: 8,
    },
    listHeaderTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    selectedCountText: {
      color: "#10B981",
      fontSize: 13,
      fontWeight: "700",
    },
    searchWrap: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      paddingHorizontal: 16,
    },
    searchIcon: {
      marginRight: 10,
    },
    searchInput: {
      flex: 1,
      height: 52,
      color: colors.text1,
      fontSize: 15,
      fontWeight: "500",
    },

    // Individual Card Items
    itemCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 16,
      marginBottom: 10,
    },
    itemCardSelected: {
      borderColor: "#10B981",
      backgroundColor: "rgba(16, 185, 129, 0.08)",
    },
    selectionIconWrap: {
      marginRight: 14,
    },
    itemInfo: {
      flex: 1,
      paddingRight: 16,
    },
    itemName: {
      color: colors.text1,
      fontSize: 15,
      fontWeight: "600",
      marginBottom: 4,
    },
    itemCategory: {
      color: colors.text3,
      fontSize: 11,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    itemPriceWrap: {
      alignItems: "flex-end",
    },
    itemPriceLabel: {
      color: colors.text3,
      fontSize: 10,
      textTransform: "uppercase",
      fontWeight: "700",
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    itemPriceEmerald: {
      color: "#10B981",
      fontSize: 16,
      fontWeight: "800",
    },
    itemPriceDate: {
      color: colors.text3,
      fontSize: 11,
      marginTop: 2,
    },

    // Empty States
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
      paddingVertical: 32,
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