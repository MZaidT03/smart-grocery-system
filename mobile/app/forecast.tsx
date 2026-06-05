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
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  Activity,
  ArrowLeft,
  Box,
  BrainCircuit,
  ChartNoAxesCombined,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Gauge,
  History,
  PackageCheck,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
  Waves,
  X,
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
    prophet_points?: number[];
    method?: string;
  };
  smart_days_left?: number;
  message?: string;
};

type ForecastMode = "trend" | "seasonal" | "prophet";

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

  const [activeTab, setActiveTab] = useState<ForecastMode>("prophet");
  const [productSearch, setProductSearch] = useState("");

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

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();

    if (!query) return products;

    return products.filter((item) => {
      const searchable = `${item.name} ${item.category ?? ""} ${item.unit ?? ""
        }`.toLowerCase();

      return searchable.includes(query);
    });
  }, [products, productSearch]);

  const lowStockCount = useMemo(
    () =>
      products.filter(
        (item) =>
          item.days_left !== undefined &&
          item.days_left !== -1 &&
          item.days_left < 7,
      ).length,
    [products],
  );

  const chartData = useMemo(() => {
    if (!forecast?.success) return null;

    const history = forecast.history?.slice(-7) || [];
    const flatRate = Number(forecast.forecast?.daily_usage || 0);
    const seasonal = forecast.forecast?.seasonal_points || [];
    const prophetPoints = forecast.forecast?.prophet_points || [];

    const projected = Array.from({ length: 7 }, (_, index) => {
      if (activeTab === "prophet" && prophetPoints.length > index) {
        return Number(prophetPoints[index]) || 0;
      }

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
  const isWarning = smartDaysLeft > 3 && smartDaysLeft <= 7;
  const methodLabel = forecast?.forecast?.method || "Forecast model";

  const refreshSelectedForecast = () => {
    if (selectedProductId) {
      fetchForecast(selectedProductId, true);
    }
  };

  const handleSelectProduct = (productId: string) => {
    if (productId === selectedProductId) return;

    setSelectedProductId(productId);
    setForecast(null);
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
          <Text style={styles.loadingText}>Loading forecast data</Text>
        </View>
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
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
              <Text style={styles.title}>Smart Demand</Text>
            </View>

            <Pressable
              style={[
                styles.refreshButton,
                (!selectedProductId || loadingForecast) && styles.disabledBtn,
              ]}
              onPress={refreshSelectedForecast}
              disabled={!selectedProductId || loadingForecast}
            >
              {loadingForecast ? (
                <ActivityIndicator size="small" color={colors.accent1} />
              ) : (
                <RefreshCw size={18} color={colors.accent1} />
              )}
            </Pressable>
          </View>

          <View style={styles.heroCard}>
            <View style={styles.heroTop}>
              <View style={styles.heroIcon}>
                <BrainCircuit size={26} color={colors.accent1} />
              </View>

              <View style={styles.heroCopy}>
                <View style={styles.sourcePill}>
                  <Sparkles size={13} color={colors.accent1} />
                  <Text style={styles.sourceText}>AI Demand Model</Text>
                </View>

                <Text style={styles.heroTitle}>Know what will run out next</Text>

                <Text style={styles.heroText}>
                  Select a product, compare usage history, and view predicted
                  consumption before restocking.
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
                label="Need attention"
                value={String(lowStockCount)}
                danger={lowStockCount > 0}
              />

              <SummaryTile
                colors={colors}
                styles={styles}
                icon={Gauge}
                label="Mode"
                value={formatModeLabel(activeTab)}
              />
            </View>
          </View>

          <View style={styles.selectorPanel}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionKicker}>Step 1</Text>
                <Text style={styles.sectionTitle}>Choose product</Text>
              </View>

              <Text style={styles.sectionMeta}>{products.length} items</Text>
            </View>

            <View style={styles.searchWrap}>
              <Search size={18} color={colors.text3} />

              <TextInput
                value={productSearch}
                onChangeText={setProductSearch}
                placeholder="Search product or category"
                placeholderTextColor={colors.text3}
                style={styles.searchInput}
              />

              {!!productSearch && (
                <Pressable
                  style={styles.clearButton}
                  onPress={() => setProductSearch("")}
                >
                  <X size={15} color={colors.text2} />
                </Pressable>
              )}
            </View>

            {products.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Box size={40} color={colors.text3} />

                <Text style={styles.emptyTitle}>No products yet</Text>

                <Text style={styles.emptyBody}>
                  Add products to your inventory to generate forecasts.
                </Text>
              </View>
            ) : filteredProducts.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Search size={38} color={colors.text3} />

                <Text style={styles.emptyTitle}>No matching product</Text>

                <Text style={styles.emptyBody}>
                  Try another product name or category.
                </Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.productRow}
              >
                {filteredProducts.map((product) => {
                  const active = String(product.id) === selectedProductId;
                  const daysLeft =
                    product.days_left !== undefined && product.days_left !== -1
                      ? product.days_left
                      : null;

                  const productCritical =
                    typeof daysLeft === "number" && daysLeft <= 3;

                  return (
                    <Pressable
                      key={String(product.id)}
                      style={[
                        styles.productCard,
                        active && styles.productCardActive,
                      ]}
                      onPress={() => handleSelectProduct(String(product.id))}
                    >
                      <View style={styles.productCardTop}>
                        <View
                          style={[
                            styles.productIcon,
                            active && styles.productIconActive,
                          ]}
                        >
                          <PackageCheck
                            size={17}
                            color={active ? colors.bg : colors.accent1}
                          />
                        </View>

                        {active ? (
                          <CheckCircle2 size={20} color={colors.accent1} />
                        ) : null}
                      </View>

                      <Text
                        style={[
                          styles.productName,
                          active && styles.productNameActive,
                        ]}
                        numberOfLines={1}
                      >
                        {product.name}
                      </Text>

                      <Text
                        style={[
                          styles.productMeta,
                          active && styles.productMetaActive,
                        ]}
                        numberOfLines={1}
                      >
                        {product.quantity ?? 0} {product.unit || "units"}
                      </Text>

                      <View
                        style={[
                          styles.productDaysBadge,
                          productCritical && styles.productDaysBadgeCritical,
                        ]}
                      >
                        <Text
                          style={[
                            styles.productDaysText,
                            productCritical && styles.productDaysTextCritical,
                          ]}
                        >
                          {daysLeft === null
                            ? "No history"
                            : formatDaysLeft(daysLeft)}
                        </Text>
                      </View>
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
              <CircleAlert size={42} color={colors.warning} />

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
              <View
                style={[
                  styles.predictionCard,
                  isCritical && styles.predictionCardCritical,
                  isWarning && styles.predictionCardWarning,
                ]}
              >
                <View style={styles.predictionHeader}>
                  <View
                    style={[
                      styles.predictionIcon,
                      isCritical && styles.predictionIconCritical,
                      isWarning && styles.predictionIconWarning,
                    ]}
                  >
                    <Clock3
                      size={22}
                      color={
                        isCritical
                          ? colors.danger
                          : isWarning
                            ? colors.warning
                            : colors.accent1
                      }
                    />
                  </View>

                  <View style={styles.predictionCopy}>
                    <Text style={styles.predictionLabel}>
                      Prediction summary
                    </Text>

                    <Text style={styles.predictionTitle} numberOfLines={1}>
                      {forecast.product?.name || selectedProduct.name}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.daysBadge,
                      isCritical && styles.daysBadgeCritical,
                      isWarning && styles.daysBadgeWarning,
                    ]}
                  >
                    <Text
                      style={[
                        styles.daysBadgeText,
                        isCritical && styles.daysBadgeTextCritical,
                        isWarning && styles.daysBadgeTextWarning,
                      ]}
                    >
                      {formatDaysLeft(smartDaysLeft)}
                    </Text>
                  </View>
                </View>

                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      isCritical && styles.progressBarFillCritical,
                      isWarning && styles.progressBarFillWarning,
                      { width: `${runOutPercentage}%` },
                    ]}
                  />
                </View>

                <Text style={styles.predictionHint}>
                  {isCritical
                    ? "Critical stock level. Restock this item as soon as possible."
                    : isWarning
                      ? "This item may run out soon. Add it to your next grocery plan."
                      : "Stock level looks stable based on current usage."}
                </Text>
              </View>

              <View style={styles.modePanel}>
                <View style={styles.sectionHeader}>
                  <View>
                    <Text style={styles.sectionKicker}>Step 2</Text>
                    <Text style={styles.sectionTitle}>Choose model</Text>
                  </View>
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
                      size={14}
                      color={activeTab === "trend" ? colors.bg : colors.text2}
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
                      size={14}
                      color={
                        activeTab === "seasonal" ? colors.bg : colors.text2
                      }
                    />

                    <Text
                      style={[
                        styles.segmentText,
                        activeTab === "seasonal" && styles.segmentTextActive,
                      ]}
                    >
                      Seasonal
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.segmentBtn,
                      activeTab === "prophet" && styles.segmentBtnActive,
                    ]}
                    onPress={() => setActiveTab("prophet")}
                  >
                    <Activity
                      size={14}
                      color={activeTab === "prophet" ? colors.bg : colors.text2}
                    />

                    <Text
                      style={[
                        styles.segmentText,
                        activeTab === "prophet" && styles.segmentTextActive,
                      ]}
                    >
                      Prophet
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.chartPanel}>
                <View style={styles.chartHeader}>
                  <View style={styles.chartTitleWrap}>
                    <ChartNoAxesCombined size={18} color={colors.accent1} />
                    <Text style={styles.chartTitle}>Usage timeline</Text>
                  </View>

                  <Text style={styles.chartSubtitle}>
                    Last 7 days vs next 7 days
                  </Text>
                </View>

                <View style={styles.legendRow}>
                  <View style={styles.legendItem}>
                    <View style={styles.legendDotHistory} />
                    <Text style={styles.legendText}>History</Text>
                  </View>

                  <View style={styles.legendItem}>
                    <View
                      style={[
                        styles.legendDotForecast,
                        activeTab === "prophet" && styles.legendDotProphet,
                      ]}
                    />
                    <Text style={styles.legendText}>
                      {formatModeLabel(activeTab)}
                    </Text>
                  </View>
                </View>

                <View style={styles.chartBox}>
                  <ForecastBars
                    label="History"
                    data={chartData.historyBars}
                    max={chartData.max}
                    fillStyle={styles.barFillHistory}
                    styles={styles}
                  />

                  <View style={styles.chartDivider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>Now</Text>
                  </View>

                  <ForecastBars
                    label="Forecast"
                    data={chartData.projectedBars}
                    max={chartData.max}
                    fillStyle={
                      activeTab === "prophet"
                        ? styles.barFillProphet
                        : activeTab === "seasonal"
                          ? styles.barFillSeasonal
                          : styles.barFillTrend
                    }
                    styles={styles}
                  />
                </View>

                <View style={styles.contextBox}>
                  <Zap size={15} color={colors.accent1} />

                  <Text style={styles.contextText}>
                    {activeTab === "prophet"
                      ? "Prophet uses advanced recurring pattern detection for a smarter forecast."
                      : activeTab === "seasonal"
                        ? "Seasonal mode adjusts expected usage across the week."
                        : "Trend mode uses average daily consumption as a steady baseline."}
                  </Text>
                </View>
              </View>

              <View style={styles.metricsGrid}>
                <View style={styles.metricCard}>
                  <View style={styles.metricIcon}>
                    <History size={18} color={colors.accent1} />
                  </View>

                  <Text style={styles.metricLabel}>Average daily use</Text>

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
                      isWarning && styles.metricIconWarning,
                    ]}
                  >
                    <Clock3
                      size={18}
                      color={
                        isCritical
                          ? colors.danger
                          : isWarning
                            ? colors.warning
                            : colors.accent1
                      }
                    />
                  </View>

                  <Text style={styles.metricLabel}>Predicted run-out</Text>

                  <View style={styles.runOutRow}>
                    <Text
                      style={[
                        styles.runOutValue,
                        isCritical && styles.runOutValueCritical,
                        isWarning && styles.runOutValueWarning,
                      ]}
                    >
                      {smartDaysLeft}
                    </Text>

                    <Text style={styles.runOutSub}>days left</Text>
                  </View>

                  <Text style={styles.metricSubText}>
                    Based on selected forecast model
                  </Text>
                </View>
              </View>

              <View style={styles.insightCard}>
                <View style={styles.insightIcon}>
                  <BrainCircuit size={20} color="#8b5cf6" />
                </View>

                <View style={styles.insightTextWrap}>
                  <Text style={styles.insightTitle}>AI insight</Text>

                  <Text style={styles.insightBody}>
                    {activeTab === "prophet"
                      ? "Prophet analysis is best when your usage pattern changes across days or weeks."
                      : activeTab === "seasonal"
                        ? "Seasonal analysis is useful when consumption rises or drops on specific days."
                        : "Trend analysis is useful for simple items with steady daily consumption."}
                  </Text>
                </View>
              </View>
            </>
          )}
        </ScrollView>
        </KeyboardAvoidingView>
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
  danger,
}: {
  colors: any;
  styles: ReturnType<typeof createStyles>;
  icon: typeof PackageCheck;
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <View style={styles.summaryTile}>
      <View style={[styles.summaryIcon, danger && styles.summaryIconDanger]}>
        <Icon size={16} color={danger ? colors.danger : colors.accent1} />
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
      <Text style={styles.chartAxisLabel}>{label}</Text>

      <View style={styles.barsWrap}>
        {paddedData.map((item, index) => {
          const value = Number(item.value) || 0;
          const heightPercent = Math.max((value / max) * 100, 5);

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

const formatModeLabel = (mode: ForecastMode) => {
  if (mode === "prophet") return "Prophet";
  if (mode === "seasonal") return "Seasonal";
  return "Trend";
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

  const softWarning = isDark
    ? "rgba(234, 179, 8, 0.15)"
    : "rgba(245, 158, 11, 0.12)";

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

    disabledBtn: {
      opacity: 0.55,
    },

    titleBlock: {
      flex: 1,
    },

    eyebrow: {
      color: colors.accent1,
      fontSize: 11,
      fontWeight: "900",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },

    title: {
      color: colors.text1,
      fontSize: 29,
      fontWeight: "900",
      lineHeight: 34,
      marginTop: 2,
      letterSpacing: -0.8,
    },

    heroCard: {
      backgroundColor: colors.surface1,
      borderRadius: 30,
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

    heroTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: 13,
    },

    heroIcon: {
      width: 58,
      height: 58,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: softAccent,
      borderWidth: 1,
      borderColor: isDark ? "rgba(74, 222, 128, 0.22)" : "#ccebd8",
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
      fontSize: 20,
      fontWeight: "900",
      letterSpacing: -0.4,
    },

    heroText: {
      color: colors.text2,
      fontSize: 13,
      lineHeight: 19,
      marginTop: 4,
      fontWeight: "600",
    },

    summaryRow: {
      flexDirection: "row",
      gap: 10,
    },

    summaryTile: {
      flex: 1,
      minHeight: 98,
      borderRadius: 19,
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      justifyContent: "space-between",
    },

    summaryIcon: {
      width: 33,
      height: 33,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: softAccent,
    },

    summaryIconDanger: {
      backgroundColor: softDanger,
    },

    summaryValue: {
      color: colors.text1,
      fontSize: 17,
      fontWeight: "900",
    },

    summaryLabel: {
      color: colors.text3,
      fontSize: 10,
      fontWeight: "900",
      textTransform: "uppercase",
      lineHeight: 13,
    },

    selectorPanel: {
      backgroundColor: colors.surface1,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 15,
      gap: 13,
    },

    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },

    sectionKicker: {
      color: colors.accent1,
      fontSize: 10,
      fontWeight: "900",
      textTransform: "uppercase",
      letterSpacing: 0.7,
      marginBottom: 3,
    },

    sectionTitle: {
      color: colors.text1,
      fontSize: 20,
      fontWeight: "900",
      letterSpacing: -0.5,
    },

    sectionMeta: {
      color: colors.text3,
      fontSize: 12,
      fontWeight: "800",
      textTransform: "uppercase",
    },

    searchWrap: {
      minHeight: 50,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 17,
      paddingHorizontal: 13,
      gap: 9,
    },

    searchInput: {
      flex: 1,
      color: colors.text1,
      fontSize: 14.5,
      fontWeight: "700",
      paddingVertical: 0,
    },

    clearButton: {
      width: 28,
      height: 28,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface2,
    },

    productRow: {
      gap: 10,
      paddingRight: 4,
    },

    productCard: {
      width: 172,
      minHeight: 132,
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 22,
      padding: 13,
      gap: 9,
    },

    productCardActive: {
      backgroundColor: softAccent,
      borderColor: colors.accent1,
    },

    productCardTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    productIcon: {
      width: 38,
      height: 38,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: softAccent,
    },

    productIconActive: {
      backgroundColor: colors.accent1,
    },

    productName: {
      color: colors.text1,
      fontSize: 15,
      fontWeight: "900",
      letterSpacing: -0.2,
    },

    productNameActive: {
      color: colors.text1,
    },

    productMeta: {
      color: colors.text3,
      fontSize: 12,
      fontWeight: "700",
    },

    productMetaActive: {
      color: colors.text2,
    },

    productDaysBadge: {
      alignSelf: "flex-start",
      backgroundColor: colors.surface2,
      borderRadius: 999,
      paddingHorizontal: 9,
      paddingVertical: 6,
      marginTop: "auto",
    },

    productDaysBadgeCritical: {
      backgroundColor: softDanger,
    },

    productDaysText: {
      color: colors.text2,
      fontSize: 11,
      fontWeight: "900",
    },

    productDaysTextCritical: {
      color: colors.danger,
    },

    predictionCard: {
      backgroundColor: colors.surface1,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      gap: 14,
      shadowColor,
      shadowOpacity: isDark ? 0 : 0.07,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 10 },
      elevation: 3,
    },

    predictionCardCritical: {
      borderColor: isDark ? "rgba(239, 68, 68, 0.35)" : "rgba(239, 68, 68, 0.22)",
    },

    predictionCardWarning: {
      borderColor: isDark ? "rgba(234, 179, 8, 0.35)" : "rgba(245, 158, 11, 0.25)",
    },

    predictionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },

    predictionIcon: {
      width: 48,
      height: 48,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: softAccent,
    },

    predictionIconCritical: {
      backgroundColor: softDanger,
    },

    predictionIconWarning: {
      backgroundColor: softWarning,
    },

    predictionCopy: {
      flex: 1,
    },

    predictionLabel: {
      color: colors.text3,
      fontSize: 10,
      fontWeight: "900",
      textTransform: "uppercase",
    },

    predictionTitle: {
      color: colors.text1,
      fontSize: 17,
      fontWeight: "900",
      marginTop: 3,
    },

    daysBadge: {
      borderRadius: 999,
      backgroundColor: softAccent,
      paddingHorizontal: 11,
      paddingVertical: 8,
    },

    daysBadgeCritical: {
      backgroundColor: softDanger,
    },

    daysBadgeWarning: {
      backgroundColor: softWarning,
    },

    daysBadgeText: {
      color: colors.accent1,
      fontSize: 12,
      fontWeight: "900",
    },

    daysBadgeTextCritical: {
      color: colors.danger,
    },

    daysBadgeTextWarning: {
      color: colors.warning,
    },

    predictionHint: {
      color: colors.text2,
      fontSize: 13,
      fontWeight: "700",
      lineHeight: 19,
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

    progressBarFillWarning: {
      backgroundColor: colors.warning,
    },

    modePanel: {
      backgroundColor: colors.surface1,
      borderRadius: 24,
      padding: 15,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 13,
    },

    segmentedControl: {
      flexDirection: "row",
      backgroundColor: colors.bg,
      borderRadius: 17,
      padding: 4,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 4,
    },

    segmentBtn: {
      flex: 1,
      minHeight: 42,
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

    chartPanel: {
      backgroundColor: colors.surface1,
      borderRadius: 26,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 14,
    },

    chartHeader: {
      gap: 3,
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

    chartSubtitle: {
      color: colors.text3,
      fontSize: 12,
      fontWeight: "700",
      marginLeft: 26,
    },

    legendRow: {
      flexDirection: "row",
      gap: 14,
      alignItems: "center",
    },

    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },

    legendDotHistory: {
      width: 9,
      height: 9,
      borderRadius: 999,
      backgroundColor: colors.accent1,
    },

    legendDotForecast: {
      width: 9,
      height: 9,
      borderRadius: 999,
      backgroundColor: "#3b82f6",
    },

    legendDotProphet: {
      backgroundColor: "#f59e0b",
    },

    legendText: {
      color: colors.text2,
      fontSize: 12,
      fontWeight: "800",
    },

    chartBox: {
      flexDirection: "row",
      height: 260,
      alignItems: "flex-end",
      backgroundColor: colors.bg,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      paddingTop: 14,
      paddingBottom: 18,
    },

    chartHalf: {
      flex: 1,
      height: "100%",
      justifyContent: "flex-end",
    },

    chartAxisLabel: {
      color: colors.text3,
      fontSize: 10,
      textTransform: "uppercase",
      fontWeight: "900",
      letterSpacing: 0.5,
      marginBottom: 8,
    },

    barsWrap: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      height: "84%",
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
      fontSize: 9,
      fontWeight: "900",
      maxWidth: 34,
    },

    barTrack: {
      width: "100%",
      maxWidth: 22,
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: isDark ? "rgba(255,255,255,0.03)" : colors.surface3,
      borderRadius: 7,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
    },

    barDateLabel: {
      color: colors.text3,
      fontSize: 9,
      fontWeight: "800",
      width: 36,
      textAlign: "center",
    },

    barFillHistory: {
      width: "100%",
      backgroundColor: colors.accent1,
      borderTopLeftRadius: 6,
      borderTopRightRadius: 6,
      opacity: 0.9,
    },

    barFillTrend: {
      width: "100%",
      backgroundColor: "#3b82f6",
      borderTopLeftRadius: 6,
      borderTopRightRadius: 6,
    },

    barFillSeasonal: {
      width: "100%",
      backgroundColor: "#3b82f6",
      borderTopLeftRadius: 6,
      borderTopRightRadius: 6,
    },

    barFillProphet: {
      width: "100%",
      backgroundColor: "#f59e0b",
      borderTopLeftRadius: 6,
      borderTopRightRadius: 6,
    },

    chartDivider: {
      width: 34,
      height: "100%",
      alignItems: "center",
      justifyContent: "flex-end",
      paddingBottom: 22,
    },

    dividerLine: {
      position: "absolute",
      height: "78%",
      bottom: 34,
      width: 1,
      backgroundColor: colors.border,
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
      borderRadius: 17,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 8,
      alignItems: "flex-start",
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

    metricIconWarning: {
      backgroundColor: softWarning,
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
      lineHeight: 18,
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

    runOutValueWarning: {
      color: colors.warning,
    },

    runOutSub: {
      color: colors.text2,
      fontSize: 14,
      fontWeight: "800",
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