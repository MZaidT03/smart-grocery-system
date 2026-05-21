import { API_BASE_URL } from "@/constants/api";
import { useTheme } from "@/context/theme";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  Activity,
  ArrowLeft,
  Box,
  BrainCircuit,
  ChartNoAxesCombined,
  ChevronRight,
  CircleAlert,
  Clock3,
  Gauge,
  History,
  PackageCheck,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Waves,
  Zap,
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
  history?: { date: string; quantity: number }[];
  forecast?: {
    daily_usage?: number;
    seasonal_points?: number[];
    method?: string;
  };
  smart_days_left?: number;
  message?: string;
};

type ForecastMode = "trend" | "seasonal";

type ChartBarItem = {
  value: number;
  label: string;
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
  const [activeTab, setActiveTab] = useState<ForecastMode>("seasonal");

  const fetchProducts = useCallback(async () => {
    if (!userId) {
      setLoadingProducts(false);
      return;
    }

    setLoadingProducts(true);

    try {
      const res = await fetch(`${API_BASE_URL}/products?userId=${userId}`);
      const data = await res.json();
      const list: Product[] = Array.isArray(data) ? data : [];

      setProducts(list);

      if (!selectedProductId && list.length > 0) {
        const defaultProduct =
          list.find(
            (item) => item.days_left !== undefined && item.days_left !== -1,
          ) ?? list[0];

        setSelectedProductId(String(defaultProduct.id));
      }
    } catch {
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, [selectedProductId, userId]);

  const fetchForecast = useCallback(
    async (productId: string, isRefresh = false) => {
      if (!productId) return;

      if (isRefresh) setRefreshing(true);
      else setLoadingForecast(true);

      try {
        const res = await fetch(
          `${API_BASE_URL}/analytics/forecast/${productId}`,
        );
        const data: ForecastResponse = await res.json();

        setForecast(data);
      } catch {
        setForecast(null);
        Alert.alert("Forecast failed", "Could not load forecast data.");
      } finally {
        setLoadingForecast(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (!selectedProductId) return;

    fetchForecast(selectedProductId);
  }, [fetchForecast, selectedProductId]);

  const selectedProduct = useMemo(
    () => products.find((item) => String(item.id) === selectedProductId),
    [products, selectedProductId],
  );

  const chartData = useMemo(() => {
    if (!forecast?.success) return null;

    const history = forecast.history?.slice(-7) || [];
    const flatRate = Number(forecast.forecast?.daily_usage || 0);
    const seasonal = forecast.forecast?.seasonal_points || [];

    const projected = Array.from({ length: 7 }, (_, index) => {
      if (activeTab === "seasonal" && seasonal.length > index) {
        return Number(seasonal[index]) || 0;
      }

      return flatRate;
    });

    const allValues = [
      ...history.map((item) => Number(item.quantity) || 0),
      ...projected,
    ];

    const max = Math.max(...allValues, 1);

    const lastHistoryDate =
      history.length > 0
        ? new Date(history[history.length - 1].date)
        : new Date();

    const historyBars: ChartBarItem[] = history.map((item) => ({
      value: Number(item.quantity) || 0,
      label: formatChartDate(item.date),
    }));

    const projectedBars: ChartBarItem[] = projected.map((value, index) => {
      const nextDate = new Date(lastHistoryDate);
      nextDate.setDate(lastHistoryDate.getDate() + index + 1);

      return {
        value,
        label: formatChartDate(nextDate.toISOString()),
      };
    });

    return { historyBars, projectedBars, max };
  }, [activeTab, forecast]);

  const usagePerDay = Number(forecast?.forecast?.daily_usage || 0);
  const smartDaysLeft = Math.max(0, Number(forecast?.smart_days_left ?? 0));
  const runOutPercentage = Math.min((smartDaysLeft / 14) * 100, 100);
  const isCritical = smartDaysLeft <= 3;

  const lowStockCount = products.filter(
    (item) =>
      item.days_left !== undefined &&
      item.days_left !== -1 &&
      item.days_left < 7,
  ).length;

  const methodLabel = forecast?.forecast?.method || "Forecast model";

  const refreshSelectedForecast = () => {
    if (selectedProductId) {
      fetchForecast(selectedProductId, true);
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

  return (
    <SafeAreaView style={styles.safeArea}>
      {loadingProducts ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.accent1} />
          <Text style={styles.loadingText}>Loading forecasts</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refreshSelectedForecast}
              tintColor={colors.accent1}
            />
          }
        >
          <View style={styles.topBar}>
            <Pressable onPress={() => router.back()} style={styles.iconButton}>
              <ArrowLeft size={20} color={colors.text1} />
            </Pressable>

            <View style={styles.titleBlock}>
              <Text style={styles.eyebrow}>Forecasting</Text>
              <Text style={styles.title}>Smart forecast</Text>
            </View>

            <Pressable
              style={styles.refreshButton}
              onPress={refreshSelectedForecast}
              disabled={!selectedProductId || loadingForecast}
            >
              <RefreshCw size={18} color={colors.accent1} />
            </Pressable>
          </View>

          <View style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <View style={styles.heroIcon}>
                <BrainCircuit size={25} color={colors.accent1} />
              </View>

              <View style={styles.heroCopy}>
                <View style={styles.sourcePill}>
                  <Sparkles size={13} color={colors.accent1} />
                  <Text style={styles.sourceText}>Demand model</Text>
                </View>

                <Text style={styles.heroTitle}>Predict pantry demand</Text>

                <Text style={styles.heroText}>
                  Compare usage history with projected consumption to plan
                  restocks before items run out.
                </Text>
              </View>
            </View>

            <View style={styles.summaryRow}>
              <SummaryTile
                colors={colors}
                styles={styles}
                icon={PackageCheck}
                label="Tracked"
                value={String(products.length)}
              />

              <SummaryTile
                colors={colors}
                styles={styles}
                icon={CircleAlert}
                label="Watch"
                value={String(lowStockCount)}
              />

              <SummaryTile
                colors={colors}
                styles={styles}
                icon={Gauge}
                label="Model"
                value={activeTab === "seasonal" ? "Seasonal" : "Trend"}
              />
            </View>
          </View>

          <View style={styles.selectorPanel}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Choose item</Text>
              <Text style={styles.sectionMeta}>{products.length} products</Text>
            </View>

            {products.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Box size={40} color={colors.text3} />

                <Text style={styles.emptyTitle}>No products yet</Text>

                <Text style={styles.emptyBody}>
                  Add products to your inventory to generate forecasts.
                </Text>
              </View>
            ) : (
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
                      <View
                        style={[
                          styles.productPillIcon,
                          active && styles.productPillIconActive,
                        ]}
                      >
                        <PackageCheck
                          size={15}
                          color={active ? colors.bg : colors.accent1}
                        />
                      </View>

                      <View style={styles.productPillCopy}>
                        <Text
                          style={[
                            styles.productPillText,
                            active && styles.productPillTextActive,
                          ]}
                          numberOfLines={1}
                        >
                          {product.name}
                        </Text>

                        <Text
                          style={[
                            styles.productPillMeta,
                            active && styles.productPillMetaActive,
                          ]}
                          numberOfLines={1}
                        >
                          {product.quantity ?? 0} {product.unit || "units"}
                        </Text>
                      </View>

                      {active && (
                        <ChevronRight size={16} color={colors.accent1} />
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </View>

          {!selectedProduct ? null : loadingForecast ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color={colors.accent1} />
              <Text style={styles.loadingText}>Running forecast model</Text>
            </View>
          ) : !forecast?.success || !chartData ? (
            <View style={styles.emptyStateCard}>
              <CircleAlert size={40} color={colors.warning} />

              <Text style={styles.emptyTitle}>Forecast unavailable</Text>

              <Text style={styles.emptyBody}>
                {forecast?.message ||
                  "This item needs more consumption history to generate a reliable prediction."}
              </Text>

              <Pressable
                style={styles.secondaryButton}
                onPress={refreshSelectedForecast}
              >
                <RefreshCw size={16} color={colors.text1} />
                <Text style={styles.secondaryButtonText}>Try again</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.selectedCard}>
                <View style={styles.selectedIcon}>
                  <Clock3
                    size={20}
                    color={isCritical ? colors.danger : colors.accent1}
                  />
                </View>

                <View style={styles.selectedCopy}>
                  <Text style={styles.selectedLabel}>Selected forecast</Text>

                  <Text style={styles.selectedTitle} numberOfLines={1}>
                    {forecast.product?.name || selectedProduct.name}
                  </Text>
                </View>

                <View
                  style={[
                    styles.daysBadge,
                    isCritical && styles.daysBadgeCritical,
                  ]}
                >
                  <Text
                    style={[
                      styles.daysBadgeText,
                      isCritical && styles.daysBadgeTextCritical,
                    ]}
                  >
                    {formatDaysLeft(smartDaysLeft)}
                  </Text>
                </View>
              </View>

              <View style={styles.chartPanel}>
                <View style={styles.chartHeader}>
                  <View style={styles.chartTitleWrap}>
                    <ChartNoAxesCombined size={18} color={colors.accent1} />
                    <Text style={styles.chartTitle}>Usage timeline</Text>
                  </View>

                  <View style={styles.segmentedControl}>
                    <Pressable
                      style={[
                        styles.segmentBtn,
                        activeTab === "trend" && styles.segmentBtnActive,
                      ]}
                      onPress={() => setActiveTab("trend")}
                    >
                      <TrendingUp
                        size={13}
                        color={
                          activeTab === "trend" ? colors.bg : colors.text2
                        }
                      />

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
                        activeTab === "seasonal" && styles.segmentBtnActive,
                      ]}
                      onPress={() => setActiveTab("seasonal")}
                    >
                      <Waves
                        size={13}
                        color={
                          activeTab === "seasonal" ? colors.bg : colors.text2
                        }
                      />

                      <Text
                        style={[
                          styles.segmentText,
                          activeTab === "seasonal" &&
                          styles.segmentTextActive,
                        ]}
                      >
                        Seasonal
                      </Text>
                    </Pressable>
                  </View>
                </View>

                <View style={styles.barChartContainer}>
                  <ForecastBars
                    label="History"
                    data={chartData.historyBars}
                    max={chartData.max}
                    fillStyle={styles.barFillHistory}
                    styles={styles}
                  />

                  <View style={styles.chartDivider}>
                    <Text style={styles.dividerText}>-</Text>
                  </View>

                  <ForecastBars
                    label="Forecast"
                    data={chartData.projectedBars}
                    max={chartData.max}
                    fillStyle={
                      activeTab === "seasonal"
                        ? styles.barFillSeasonal
                        : styles.barFillTrend
                    }
                    styles={styles}
                  />
                </View>

                <View style={styles.contextBox}>
                  <Activity size={15} color={colors.text2} />

                  <Text style={styles.contextText}>
                    {activeTab === "seasonal"
                      ? "Seasonal mode adjusts the forecast when usage patterns rise or dip across the week."
                      : "Trend mode uses your average daily consumption as a steady baseline."}
                  </Text>
                </View>
              </View>

              <View style={styles.metricsGrid}>
                <View style={styles.metricCard}>
                  <View style={styles.metricIcon}>
                    <History size={18} color={colors.accent1} />
                  </View>

                  <Text style={styles.metricLabel}>Avg daily use</Text>

                  <Text style={styles.metricValue}>
                    {usagePerDay.toFixed(2)}
                    <Text style={styles.metricUnit}>
                      {" "}
                      {forecast.product?.unit || "units"}
                    </Text>
                  </Text>

                  <Text style={styles.metricSubText}>{methodLabel}</Text>
                </View>

                <View style={styles.metricCard}>
                  <View
                    style={[
                      styles.metricIcon,
                      isCritical && styles.metricIconCritical,
                    ]}
                  >
                    <Clock3
                      size={18}
                      color={isCritical ? colors.danger : colors.accent1}
                    />
                  </View>

                  <Text style={styles.metricLabel}>Predicted run-out</Text>

                  <View style={styles.runOutRow}>
                    <Text
                      style={[
                        styles.runOutValue,
                        isCritical && styles.runOutValueCritical,
                      ]}
                    >
                      {smartDaysLeft}
                    </Text>

                    <Text style={styles.runOutSub}>days left</Text>
                  </View>

                  <View style={styles.progressBarTrack}>
                    <View
                      style={[
                        styles.progressBarFill,
                        isCritical && styles.progressBarFillCritical,
                        { width: `${runOutPercentage}%` },
                      ]}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.insightCard}>
                <View style={styles.insightIcon}>
                  <Zap size={20} color="#8b5cf6" />
                </View>

                <View style={styles.insightTextWrap}>
                  <Text style={styles.insightTitle}>AI insight</Text>

                  <Text style={styles.insightBody}>
                    {activeTab === "seasonal"
                      ? "Seasonal analysis is active, so the next seven days can vary instead of repeating one flat rate."
                      : "Trend analysis is active, so the forecast is using a stable daily consumption rate."}
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

function SummaryTile({
  colors,
  styles,
  icon: Icon,
  label,
  value,
}: {
  colors: any;
  styles: ReturnType<typeof createStyles>;
  icon: typeof PackageCheck;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.summaryTile}>
      <View style={styles.summaryIcon}>
        <Icon size={16} color={colors.accent1} />
      </View>

      <Text style={styles.summaryValue} numberOfLines={1}>
        {value}
      </Text>

      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function ForecastBars({
  label,
  data,
  max,
  fillStyle,
  styles,
}: {
  label: string;
  data: ChartBarItem[];
  max: number;
  fillStyle: any;
  styles: ReturnType<typeof createStyles>;
}) {
  const paddedData =
    data.length > 0
      ? data
      : Array.from({ length: 7 }, (_, index) => ({
        value: 0,
        label: `D${index + 1}`,
      }));

  return (
    <View style={styles.chartHalf}>
      <View style={styles.chartGroupHeader}>
        <Text style={styles.chartAxisLabel}>{label}</Text>

        <Text style={styles.chartAxisHint}>
          {label === "History" ? "Actual used" : "Expected use"}
        </Text>
      </View>

      <View style={styles.barsWrap}>
        {paddedData.map((item, index) => {
          const value = Number(item.value) || 0;
          const heightPercent = Math.max((value / max) * 100, 6);

          return (
            <View key={`${label}-${index}`} style={styles.barCol}>
              <Text style={styles.barValue} numberOfLines={1}>
                {value % 1 === 0 ? value : value.toFixed(1)}
              </Text>

              <View style={styles.barTrack}>
                <View style={[fillStyle, { height: `${heightPercent}%` }]} />
              </View>

              <Text style={styles.barDateLabel} numberOfLines={1}>
                {item.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const formatDaysLeft = (days: number) => {
  if (days <= 0) return "Today";
  if (days === 1) return "1 day";
  return `${days} days`;
};

const formatChartDate = (dateString: string) => {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "--";

  return `${date.getMonth() + 1}/${date.getDate()}`;
};

const createStyles = (colors: any) => {
  const isDark = colors.bg === "#000000";

  const softAccent = isDark ? "rgba(74, 222, 128, 0.14)" : "#eaf7ef";

  const softDanger = isDark
    ? "rgba(239, 68, 68, 0.14)"
    : "rgba(220, 38, 38, 0.08)";

  const softPurple = isDark
    ? "rgba(139, 92, 246, 0.16)"
    : "rgba(139, 92, 246, 0.1)";

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

    refreshButton: {
      width: 44,
      height: 44,
      borderRadius: 15,
      backgroundColor: softAccent,
      borderWidth: 1,
      borderColor: isDark ? "rgba(74, 222, 128, 0.28)" : "#ccebd8",
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
      fontSize: 28,
      fontWeight: "900",
      lineHeight: 33,
      marginTop: 2,
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

    summaryRow: {
      flexDirection: "row",
      gap: 10,
    },

    summaryTile: {
      flex: 1,
      minHeight: 98,
      borderRadius: 18,
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      justifyContent: "space-between",
    },

    summaryIcon: {
      width: 32,
      height: 32,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: softAccent,
    },

    summaryValue: {
      color: colors.text1,
      fontSize: 16,
      fontWeight: "900",
    },

    summaryLabel: {
      color: colors.text3,
      fontSize: 10,
      fontWeight: "900",
      textTransform: "uppercase",
    },

    selectorPanel: {
      backgroundColor: colors.surface1,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      gap: 12,
    },

    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },

    sectionTitle: {
      color: colors.text1,
      fontSize: 20,
      fontWeight: "900",
    },

    sectionMeta: {
      color: colors.text3,
      fontSize: 12,
      fontWeight: "800",
      textTransform: "uppercase",
    },

    pillRow: {
      gap: 10,
      paddingRight: 4,
    },

    productPill: {
      width: 188,
      minHeight: 70,
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 18,
      padding: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },

    productPillActive: {
      backgroundColor: softAccent,
      borderColor: colors.accent1,
    },

    productPillIcon: {
      width: 36,
      height: 36,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: softAccent,
    },

    productPillIconActive: {
      backgroundColor: colors.accent1,
    },

    productPillCopy: {
      flex: 1,
      gap: 3,
    },

    productPillText: {
      color: colors.text1,
      fontWeight: "900",
      fontSize: 14,
    },

    productPillTextActive: {
      color: colors.text1,
    },

    productPillMeta: {
      color: colors.text3,
      fontWeight: "700",
      fontSize: 12,
    },

    productPillMetaActive: {
      color: colors.text2,
    },

    selectedCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.surface1,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
    },

    selectedIcon: {
      width: 44,
      height: 44,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: softAccent,
    },

    selectedCopy: {
      flex: 1,
    },

    selectedLabel: {
      color: colors.text3,
      fontSize: 10,
      fontWeight: "900",
      textTransform: "uppercase",
    },

    selectedTitle: {
      color: colors.text1,
      fontSize: 16,
      fontWeight: "900",
      marginTop: 2,
    },

    daysBadge: {
      borderRadius: 999,
      backgroundColor: softAccent,
      paddingHorizontal: 11,
      paddingVertical: 7,
    },

    daysBadgeCritical: {
      backgroundColor: softDanger,
    },

    daysBadgeText: {
      color: colors.accent1,
      fontSize: 12,
      fontWeight: "900",
    },

    daysBadgeTextCritical: {
      color: colors.danger,
    },

    chartPanel: {
      backgroundColor: colors.surface1,
      borderRadius: 24,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 16,
    },

    chartHeader: {
      gap: 14,
    },

    chartTitleWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },

    chartTitle: {
      color: colors.text1,
      fontSize: 20,
      fontWeight: "900",
    },

    segmentedControl: {
      flexDirection: "row",
      backgroundColor: colors.bg,
      borderRadius: 16,
      padding: 4,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 4,
    },

    segmentBtn: {
      flex: 1,
      minHeight: 40,
      borderRadius: 13,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },

    segmentBtnActive: {
      backgroundColor: colors.accent1,
    },

    segmentText: {
      color: colors.text2,
      fontSize: 13,
      fontWeight: "900",
    },

    segmentTextActive: {
      color: colors.bg,
    },

    barChartContainer: {
      flexDirection: "row",
      height: 250,
      alignItems: "flex-end",
      backgroundColor: colors.bg,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      paddingTop: 16,
      paddingBottom: 20,
      shadowColor: shadowColor,
      shadowOpacity: isDark ? 0 : 0.04,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 2,
    },

    chartHalf: {
      flex: 1,
      height: "100%",
      justifyContent: "flex-end",
    },

    chartGroupHeader: {
      marginBottom: 12,
      gap: 2,
    },

    chartAxisLabel: {
      color: colors.text1,
      fontSize: 12,
      textTransform: "uppercase",
      fontWeight: "900",
      letterSpacing: 0.5,
    },

    chartAxisHint: {
      color: colors.text3,
      fontSize: 10,
      fontWeight: "700",
    },

    barsWrap: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      height: "76%",
      gap: 3,
    },

    barCol: {
      flex: 1,
      alignItems: "center",
      height: "100%",
      justifyContent: "flex-end",
      gap: 5,
    },

    barValue: {
      color: colors.text2,
      fontSize: 10,
      fontWeight: "800",
      maxWidth: 34,
      marginBottom: 2,
    },

    barTrack: {
      width: "100%",
      maxWidth: 22,
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: isDark ? "rgba(255,255,255,0.03)" : colors.surface3,
      borderRadius: 6,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
    },

    barDateLabel: {
      color: colors.text3,
      fontSize: 9,
      fontWeight: "800",
      transform: [{ rotate: "-45deg" }, { translateX: -4 }, { translateY: 4 }],
      width: 44,
      textAlign: "center",
      marginTop: 8,
    },

    barFillHistory: {
      width: "100%",
      backgroundColor: colors.accent1,
      borderTopLeftRadius: 4,
      borderTopRightRadius: 4,
      opacity: 0.85,
    },

    barFillTrend: {
      width: "100%",
      backgroundColor: "#3b82f6",
      borderTopLeftRadius: 4,
      borderTopRightRadius: 4,
    },

    barFillSeasonal: {
      width: "100%",
      backgroundColor: "#f59e0b",
      borderTopLeftRadius: 4,
      borderTopRightRadius: 4,
    },

    chartDivider: {
      width: 28,
      height: "100%",
      alignItems: "center",
      justifyContent: "flex-end",
      paddingBottom: 40,
    },

    dividerLine: {
      position: "absolute",
      height: "75%",
      bottom: 28,
      width: 0,
      borderLeftWidth: 1,
      borderLeftColor: colors.border,
      borderStyle: "dashed",
    },

    dividerText: {
      color: colors.text3,
      backgroundColor: colors.surface1,
      fontSize: 10,
      fontWeight: "900",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },

    contextBox: {
      flexDirection: "row",
      backgroundColor: colors.bg,
      padding: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 8,
    },

    contextText: {
      flex: 1,
      color: colors.text2,
      fontSize: 12,
      lineHeight: 18,
      fontWeight: "700",
    },

    metricsGrid: {
      gap: 12,
    },

    metricCard: {
      backgroundColor: colors.surface1,
      borderRadius: 24,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 10,
    },

    metricIcon: {
      width: 42,
      height: 42,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: softAccent,
    },

    metricIconCritical: {
      backgroundColor: softDanger,
    },

    metricLabel: {
      color: colors.text3,
      fontSize: 11,
      fontWeight: "900",
      textTransform: "uppercase",
    },

    metricValue: {
      color: colors.text1,
      fontSize: 34,
      fontWeight: "900",
    },

    metricUnit: {
      color: colors.text3,
      fontSize: 15,
      fontWeight: "800",
    },

    metricSubText: {
      color: colors.text2,
      fontSize: 13,
      fontWeight: "700",
    },

    runOutRow: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: 8,
    },

    runOutValue: {
      color: colors.accent1,
      fontSize: 36,
      fontWeight: "900",
    },

    runOutValueCritical: {
      color: colors.danger,
    },

    runOutSub: {
      color: colors.text2,
      fontSize: 14,
      fontWeight: "800",
    },

    progressBarTrack: {
      width: "100%",
      height: 9,
      backgroundColor: colors.surface3,
      borderRadius: 999,
      overflow: "hidden",
    },

    progressBarFill: {
      height: "100%",
      borderRadius: 999,
      backgroundColor: colors.accent1,
    },

    progressBarFillCritical: {
      backgroundColor: colors.danger,
    },

    insightCard: {
      flexDirection: "row",
      backgroundColor: softPurple,
      borderWidth: 1,
      borderColor: isDark
        ? "rgba(139, 92, 246, 0.34)"
        : "rgba(139, 92, 246, 0.22)",
      borderRadius: 22,
      padding: 16,
      gap: 12,
      alignItems: "center",
    },

    insightIcon: {
      width: 42,
      height: 42,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.bg,
    },

    insightTextWrap: {
      flex: 1,
    },

    insightTitle: {
      color: isDark ? "#c4b5fd" : "#6d28d9",
      fontSize: 14,
      fontWeight: "900",
      marginBottom: 3,
    },

    insightBody: {
      color: colors.text1,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: "700",
    },

    loadingWrap: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      gap: 10,
    },

    loadingCard: {
      backgroundColor: colors.surface1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 24,
      padding: 34,
      alignItems: "center",
      gap: 12,
    },

    loadingText: {
      color: colors.text2,
      fontSize: 14,
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
      marginBottom: 8,
    },

    primaryButton: {
      marginTop: 8,
      backgroundColor: colors.accent1,
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: 20,
      width: "100%",
      alignItems: "center",
    },

    primaryButtonText: {
      color: colors.bg,
      fontWeight: "900",
      fontSize: 15,
    },

    secondaryButton: {
      flexDirection: "row",
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 999,
      paddingVertical: 12,
      paddingHorizontal: 18,
      alignItems: "center",
      gap: 8,
    },

    secondaryButtonText: {
      color: colors.text1,
      fontWeight: "900",
      fontSize: 14,
    },
  });
};