import { API_BASE_URL } from "@/constants/api";
import { useTheme } from "@/context/theme";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  ArrowLeft,
  TrendingUp,
  Calendar,
  Activity,
  Zap,
  Waves,
  Box,
  AlertCircle,
  RefreshCw,
} from "lucide-react-native";

type Product = {
  id: number | string;
  name: string;
  unit?: string;
  quantity?: number;
  category?: string;
  days_left?: number;
};

type ForecastResponse = {
  success?: boolean;
  product?: {
    id: number;
    name: string;
    unit?: string;
    stock?: number;
  };
  history?: Array<{ date: string; quantity: number }>;
  forecast?: {
    daily_usage?: number;
    seasonal_points?: number[];
    method?: string;
  };
  smart_days_left?: number;
  message?: string;
};

export default function ForecastScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const params = useLocalSearchParams();
  const userId = Array.isArray(params.userId)
    ? params.userId[0]
    : params.userId;

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);

  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // NEW: Tab State ('trend' or 'seasonal')
  const [activeTab, setActiveTab] = useState<"trend" | "seasonal">("seasonal");

  const fetchProducts = async () => {
    if (!userId) {
      setLoadingProducts(false);
      return;
    }
    setLoadingProducts(true);
    try {
      const res = await fetch(`${API_BASE_URL}/products?userId=${userId}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setProducts(list);

      if (!selectedProductId && list.length > 0) {
        const defaultProduct =
          list.find(
            (item) => item.days_left !== undefined && item.days_left !== -1,
          ) ?? list[0];
        setSelectedProductId(String(defaultProduct.id));
      }
    } catch (err) {
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchForecast = async (productId: string, isRefresh = false) => {
    if (!productId) return;
    if (isRefresh) setRefreshing(true);
    else setLoadingForecast(true);

    try {
      const res = await fetch(
        `${API_BASE_URL}/analytics/forecast/${productId}`,
      );
      const data: ForecastResponse = await res.json();
      setForecast(data);
    } catch (err) {
      setForecast(null);
      Alert.alert("Forecast failed", "Could not load forecast data.");
    } finally {
      setLoadingForecast(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [userId]);

  useEffect(() => {
    if (!selectedProductId) return;
    fetchForecast(selectedProductId);
  }, [selectedProductId]);

  const selectedProduct = useMemo(
    () => products.find((item) => String(item.id) === selectedProductId),
    [products, selectedProductId],
  );

  // Process Chart Data (History vs Forecast based on Tab)
  const chartData = useMemo(() => {
    if (!forecast || !forecast.success) return null;

    // Get last 7 days of history for mobile view
    const history = forecast.history?.slice(-7) || [];

    // Generate 7 days of forecast
    const projected = [];
    const flatRate = forecast.forecast?.daily_usage || 0;
    const seasonal = forecast.forecast?.seasonal_points || [];

    for (let i = 0; i < 7; i++) {
      let val = flatRate;
      if (activeTab === "seasonal" && seasonal.length > i) {
        val = seasonal[i];
      }
      projected.push(val);
    }

    const allValues = [
      ...history.map((h) => Number(h.quantity) || 0),
      ...projected.map(Number),
    ];
    const max = Math.max(...allValues, 1);

    return { history, projected, max };
  }, [forecast, activeTab]);

  const usagePerDay = Number(forecast?.forecast?.daily_usage || 0);
  const smartDaysLeft = Number(forecast?.smart_days_left ?? 0);

  // Calculate progress bar percentage (assuming 14 days is "100% full health")
  const runOutPercentage = Math.min((smartDaysLeft / 14) * 100, 100);
  const isCritical = smartDaysLeft <= 3;

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
        <View style={styles.headerCenter}>
          <View style={styles.headerTitleRow}>
            <TrendingUp size={20} color="#F59E0B" />
            <Text style={styles.title}>Smart Forecast</Text>
          </View>
          <Text style={styles.subtitle}>Predicting your future needs</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {loadingProducts ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.accent1} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Horizontal Product Selector */}
          <View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pillRow}
            >
              {products.map((product) => {
                const active = String(product.id) === selectedProductId;
                return (
                  <Pressable
                    key={String(product.id)}
                    style={[
                      styles.productPill,
                      active && styles.productPillActive,
                    ]}
                    onPress={() => setSelectedProductId(String(product.id))}
                  >
                    <Text
                      style={[
                        styles.productPillText,
                        active && styles.productPillTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {product.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {!selectedProduct ? (
            <View style={styles.emptyStateCard}>
              <Box size={40} color={colors.surface3} />
              <Text style={styles.emptyTitle}>No product selected</Text>
              <Text style={styles.emptyBody}>
                Add products to your inventory to generate forecasts.
              </Text>
            </View>
          ) : loadingForecast ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color={colors.accent1} />
              <Text style={styles.loadingText}>
                running @analysis_engine...
              </Text>
            </View>
          ) : !forecast?.success || !chartData ? (
            <View style={styles.emptyStateCard}>
              <AlertCircle size={40} color={colors.warning} />
              <Text style={styles.emptyTitle}>Forecast unavailable</Text>
              <Text style={styles.emptyBody}>
                {forecast?.message ||
                  "This item needs more consumption history to generate a reliable prediction."}
              </Text>
              <Pressable
                style={styles.secondaryButton}
                onPress={() =>
                  selectedProductId && fetchForecast(selectedProductId, true)
                }
              >
                <RefreshCw size={16} color={colors.text1} />
                <Text style={styles.secondaryButtonText}>Try again</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {/* Main Chart Panel */}
              <View style={styles.chartPanel}>
                <View style={styles.chartHeader}>
                  <View style={styles.chartTitleWrap}>
                    <Calendar size={18} color="#3B82F6" />
                    <Text style={styles.chartTitle}>Timeline</Text>
                  </View>

                  {/* Segmented Control */}
                  <View style={styles.segmentedControl}>
                    <Pressable
                      style={[
                        styles.segmentBtn,
                        activeTab === "trend" && styles.segmentBtnActive,
                      ]}
                      onPress={() => setActiveTab("trend")}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          activeTab === "trend" && styles.segmentTextActive,
                        ]}
                      >
                        Trend
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.segmentBtn,
                        activeTab === "seasonal" && styles.segmentBtnActiveAlt,
                      ]}
                      onPress={() => setActiveTab("seasonal")}
                    >
                      <Waves
                        size={12}
                        color={
                          activeTab === "seasonal" ? "#F59E0B" : colors.text2
                        }
                      />
                      <Text
                        style={[
                          styles.segmentText,
                          activeTab === "seasonal" &&
                            styles.segmentTextActiveAlt,
                        ]}
                      >
                        Seasonal
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {/* Custom Bar Chart Visualization */}
                <View style={styles.barChartContainer}>
                  {/* Left Side: History */}
                  <View style={styles.chartHalf}>
                    <Text style={styles.chartAxisLabel}>History</Text>
                    <View style={styles.barsWrap}>
                      {chartData.history.map((pt, idx) => {
                        const hPct = Math.max(
                          (Number(pt.quantity) / chartData.max) * 100,
                          4,
                        );
                        return (
                          <View key={`hist-${idx}`} style={styles.barCol}>
                            <View style={styles.barTrack}>
                              <View
                                style={[
                                  styles.barFillHistory,
                                  { height: `${hPct}%` },
                                ]}
                              />
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>

                  {/* Divider */}
                  <View style={styles.chartDivider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>Now</Text>
                  </View>

                  {/* Right Side: Forecast */}
                  <View style={styles.chartHalf}>
                    <Text style={styles.chartAxisLabel}>Forecast</Text>
                    <View style={styles.barsWrap}>
                      {chartData.projected.map((val, idx) => {
                        const hPct = Math.max(
                          (Number(val) / chartData.max) * 100,
                          4,
                        );
                        return (
                          <View key={`proj-${idx}`} style={styles.barCol}>
                            <View style={styles.barTrack}>
                              <View
                                style={[
                                  activeTab === "seasonal"
                                    ? styles.barFillSeasonal
                                    : styles.barFillTrend,
                                  { height: `${hPct}%` },
                                ]}
                              />
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                </View>

                {/* Context Box */}
                <View style={styles.contextBox}>
                  <Activity
                    size={14}
                    color={colors.text2}
                    style={{ marginTop: 2 }}
                  />
                  <Text style={styles.contextText}>
                    {activeTab === "seasonal"
                      ? "The Seasonal Model detects patterns (e.g., weekends) to predict variable daily needs."
                      : "The Average Trend Model assumes constant daily usage based on your weighted history."}
                  </Text>
                </View>
              </View>

              {/* Metrics Grid */}
              <View style={styles.metricsGrid}>
                {/* Consumption Card */}
                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>Avg Daily Consumption</Text>
                  <Text style={styles.metricValue}>
                    {usagePerDay.toFixed(2)}{" "}
                    <Text style={styles.metricUnit}>
                      {forecast.product?.unit || "units"}
                    </Text>
                  </Text>
                  <View style={styles.metricBadge}>
                    <Text style={styles.metricBadgeText}>30-day history</Text>
                  </View>
                </View>

                {/* Run-Out Card */}
                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>Predicted Run-Out</Text>
                  <View style={styles.runOutRow}>
                    <Text
                      style={[
                        styles.runOutValue,
                        isCritical
                          ? { color: "#EF4444" }
                          : { color: "#10B981" },
                      ]}
                    >
                      {smartDaysLeft}
                    </Text>
                    <Text style={styles.runOutSub}>days left</Text>
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.progressBarTrack}>
                    <View
                      style={[
                        styles.progressBarFill,
                        isCritical
                          ? { backgroundColor: "#EF4444" }
                          : { backgroundColor: "#10B981" },
                        { width: `${runOutPercentage}%` },
                      ]}
                    />
                  </View>
                </View>
              </View>

              {/* AI Insight Card */}
              <View style={styles.insightCard}>
                <Zap size={24} color="#8B5CF6" />
                <View style={styles.insightTextWrap}>
                  <Text style={styles.insightTitle}>AI Insight</Text>
                  <Text style={styles.insightBody}>
                    {activeTab === "seasonal"
                      ? "Analysis complete. Detected a recurring usage pattern (Seasonality) in your history."
                      : "Analysis complete. Your consumption is relatively stable over the last 30 days."}
                  </Text>
                </View>
              </View>
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.bg },
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
    iconButton: { padding: 8, marginLeft: -8 },
    headerCenter: { flex: 1, alignItems: "center" },
    headerTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    headerSpacer: { width: 40 },
    title: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.text1,
      letterSpacing: -0.5,
    },
    subtitle: {
      color: colors.text2,
      fontSize: 12,
      fontWeight: "500",
      marginTop: 2,
    },
    loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
    content: { padding: 20, gap: 20, paddingBottom: 40 },

    // Selectors
    pillRow: { gap: 10, paddingVertical: 4 },
    productPill: {
      backgroundColor: colors.surface1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 16,
    },
    productPillActive: {
      backgroundColor: colors.surface2,
      borderColor: colors.accent1,
    },
    productPillText: { color: colors.text2, fontWeight: "600", fontSize: 14 },
    productPillTextActive: { color: colors.text1, fontWeight: "700" },

    // Main Chart Panel
    chartPanel: {
      backgroundColor: colors.surface1,
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 20,
    },
    chartHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    chartTitleWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
    chartTitle: { color: colors.text1, fontSize: 16, fontWeight: "700" },

    // Segmented Control
    segmentedControl: {
      flexDirection: "row",
      backgroundColor: colors.bg,
      borderRadius: 8,
      padding: 4,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 4,
    },
    segmentBtn: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 6,
      gap: 4,
    },
    segmentBtnActive: { backgroundColor: colors.surface2 },
    segmentBtnActiveAlt: {
      backgroundColor: "rgba(245, 158, 11, 0.15)",
      borderWidth: 1,
      borderColor: "rgba(245, 158, 11, 0.3)",
    },
    segmentText: { color: colors.text2, fontSize: 12, fontWeight: "600" },
    segmentTextActive: { color: colors.text1 },
    segmentTextActiveAlt: { color: "#F59E0B" },

    // Bar Chart
    barChartContainer: {
      flexDirection: "row",
      height: 180,
      alignItems: "flex-end",
    },
    chartHalf: { flex: 1, height: "100%", justifyContent: "flex-end" },
    barsWrap: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      height: "100%",
      paddingTop: 20,
    },
    chartAxisLabel: {
      position: "absolute",
      top: -10,
      left: 0,
      color: colors.text3,
      fontSize: 10,
      textTransform: "uppercase",
      fontWeight: "700",
      letterSpacing: 0.5,
    },
    barCol: { flex: 1, alignItems: "center", paddingHorizontal: 2 },
    barTrack: {
      width: "100%",
      maxWidth: 16,
      height: "100%",
      justifyContent: "flex-end",
    },
    barFillHistory: {
      width: "100%",
      backgroundColor: "#10B981",
      borderRadius: 4,
      opacity: 0.7,
    },
    barFillTrend: {
      width: "100%",
      backgroundColor: "#3B82F6",
      borderRadius: 4,
    },
    barFillSeasonal: {
      width: "100%",
      backgroundColor: "#F59E0B",
      borderRadius: 4,
    },

    chartDivider: {
      width: 40,
      height: "100%",
      alignItems: "center",
      justifyContent: "flex-end",
      paddingBottom: 10,
    },
    dividerLine: {
      position: "absolute",
      height: "100%",
      width: 1,
      backgroundColor: colors.border,
      borderStyle: "dashed",
    },
    dividerText: {
      backgroundColor: colors.surface1,
      color: colors.text3,
      fontSize: 10,
      paddingVertical: 2,
      paddingHorizontal: 4,
      fontWeight: "700",
    },

    // Context Box
    contextBox: {
      flexDirection: "row",
      backgroundColor: colors.bg,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 8,
    },
    contextText: { flex: 1, color: colors.text2, fontSize: 12, lineHeight: 18 },

    // Metrics
    metricsGrid: { gap: 16 },
    metricCard: {
      backgroundColor: colors.surface1,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    metricLabel: {
      color: colors.text2,
      fontSize: 11,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: 8,
    },
    metricValue: {
      color: colors.text1,
      fontSize: 32,
      fontWeight: "800",
      fontFamily: "System",
    },
    metricUnit: { color: colors.text3, fontSize: 16, fontWeight: "600" },
    metricBadge: {
      alignSelf: "flex-start",
      backgroundColor: "rgba(16, 185, 129, 0.1)",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      marginTop: 8,
    },
    metricBadgeText: { color: "#10B981", fontSize: 10, fontWeight: "700" },

    runOutRow: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: 8,
      marginBottom: 12,
    },
    runOutValue: { fontSize: 36, fontWeight: "800", fontFamily: "System" },
    runOutSub: { color: colors.text2, fontSize: 14, fontWeight: "600" },
    progressBarTrack: {
      width: "100%",
      height: 8,
      backgroundColor: colors.surface2,
      borderRadius: 999,
      overflow: "hidden",
    },
    progressBarFill: { height: "100%", borderRadius: 999 },

    // Insight Card
    insightCard: {
      flexDirection: "row",
      backgroundColor: "rgba(139, 92, 246, 0.1)",
      borderWidth: 1,
      borderColor: "rgba(139, 92, 246, 0.2)",
      borderRadius: 20,
      padding: 20,
      gap: 16,
      alignItems: "center",
    },
    insightTextWrap: { flex: 1 },
    insightTitle: {
      color: "#A78BFA",
      fontSize: 14,
      fontWeight: "700",
      marginBottom: 4,
    },
    insightBody: {
      color: colors.text1,
      fontSize: 13,
      lineHeight: 20,
      opacity: 0.9,
    },

    // Empty & Loading
    emptyStateCard: {
      backgroundColor: colors.surface1,
      borderRadius: 20,
      padding: 32,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12,
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
      fontSize: 18,
      fontWeight: "700",
      textAlign: "center",
    },
    emptyBody: {
      color: colors.text2,
      fontSize: 14,
      textAlign: "center",
      lineHeight: 22,
      marginBottom: 8,
    },
    loadingCard: {
      backgroundColor: colors.surface1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 20,
      padding: 32,
      alignItems: "center",
      gap: 16,
    },
    loadingText: {
      color: colors.text2,
      fontSize: 14,
      fontWeight: "500",
      fontFamily: "System",
    },

    // Buttons
    primaryButton: {
      backgroundColor: colors.accent1,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 24,
      width: "100%",
      alignItems: "center",
    },
    primaryButtonText: { color: colors.bg, fontWeight: "700", fontSize: 16 },
    secondaryButton: {
      flexDirection: "row",
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 100,
      paddingVertical: 12,
      paddingHorizontal: 20,
      alignItems: "center",
      gap: 8,
    },
    secondaryButtonText: {
      color: colors.text1,
      fontWeight: "600",
      fontSize: 14,
    },
  });
