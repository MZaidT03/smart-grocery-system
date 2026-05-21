import { API_BASE_URL } from "@/constants/api";
import { useTheme } from "@/context/theme";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
  BrainCircuit,
  CalendarDays,
  ChartColumn,
  ChartNoAxesCombined,
  ChartPie,
  CircleAlert,
  ListOrdered,
  RefreshCw,
  Sparkles,
  Sun,
  Trophy,
  Utensils,
  Zap,
} from "lucide-react-native";

type ConsumptionTrend = {
  month: string;
  items: number;
};

type SeasonalTrend = {
  name: string;
  value: number;
};

type TopItem = {
  name: string;
  count: number;
};

type DietaryData = {
  subject: string;
  A: number;
  fullMark: number;
};

type AnalyticsData = {
  success: boolean;
  consumption_trend: ConsumptionTrend[];
  seasonal_trends: SeasonalTrend[];
  top_items: TopItem[];
  dietaryComposition: DietaryData[];
  insights: string[];
};

export default function AnalyticsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const params = useLocalSearchParams();
  const userId = Array.isArray(params.userId)
    ? params.userId[0]
    : params.userId;

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = useCallback(
    async (isRefresh = false) => {
      if (!userId) {
        setLoading(false);
        return;
      }

      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const res = await fetch(
          `${API_BASE_URL}/analytics/dashboard?userId=${userId}`,
        );
        const json = await res.json();
        setData(json?.success ? json : null);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userId],
  );

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const analyticsSummary = useMemo(() => {
    const totalConsumed =
      data?.consumption_trend?.reduce((sum, item) => sum + item.items, 0) ?? 0;
    const peakMonth = [...(data?.consumption_trend ?? [])].sort(
      (a, b) => b.items - a.items,
    )[0];
    const topItem = data?.top_items?.[0];
    const peakSeason = [...(data?.seasonal_trends ?? [])].sort(
      (a, b) => b.value - a.value,
    )[0];
    const dietTotal =
      data?.dietaryComposition?.reduce((sum, item) => sum + item.A, 0) ?? 0;

    return {
      totalConsumed,
      peakMonth,
      topItem,
      peakSeason,
      dietTotal,
      insightCount: data?.insights?.length ?? 0,
    };
  }, [data]);

  const hasAnalytics =
    !!data &&
    (data.consumption_trend.length > 0 ||
      data.top_items.length > 0 ||
      data.seasonal_trends.length > 0 ||
      data.dietaryComposition.length > 0 ||
      data.insights.length > 0);

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
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.accent1} />
          <Text style={styles.loadingText}>Loading analytics</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchAnalytics(true)}
              tintColor={colors.accent1}
            />
          }
        >
          <View style={styles.topBar}>
            <Pressable onPress={() => router.back()} style={styles.iconButton}>
              <ArrowLeft size={20} color={colors.text1} />
            </Pressable>
            <View style={styles.titleBlock}>
              <Text style={styles.eyebrow}>Analytics</Text>
              <Text style={styles.title}>Data insights</Text>
            </View>
            <Pressable
              style={styles.refreshButton}
              onPress={() => fetchAnalytics(true)}
              disabled={refreshing}
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
                  <Text style={styles.sourceText}>Pattern engine</Text>
                </View>
                <Text style={styles.heroTitle}>Understand grocery behavior</Text>
                <Text style={styles.heroText}>
                  Track consumption velocity, top items, seasonal behavior, and
                  stock composition in one scan-friendly dashboard.
                </Text>
              </View>
            </View>

            <View style={styles.summaryRow}>
              <SummaryTile
                colors={colors}
                styles={styles}
                icon={Activity}
                label="Consumed"
                value={String(analyticsSummary.totalConsumed)}
              />
              <SummaryTile
                colors={colors}
                styles={styles}
                icon={Zap}
                label="Insights"
                value={String(analyticsSummary.insightCount)}
              />
              <SummaryTile
                colors={colors}
                styles={styles}
                icon={Utensils}
                label="Stock mix"
                value={String(analyticsSummary.dietTotal)}
              />
            </View>
          </View>

          {!hasAnalytics ? (
            <View style={styles.emptyStateCard}>
              <ChartNoAxesCombined size={44} color={colors.text3} />
              <Text style={styles.emptyTitle}>No analytics yet</Text>
              <Text style={styles.emptyBody}>
                Consume items and keep inventory updated to generate meaningful
                patterns.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.kpiGrid}>
                <View style={styles.kpiRow}>
                  <MetricCard
                    colors={colors}
                    styles={styles}
                    icon={CalendarDays}
                    label="Peak month"
                    value={analyticsSummary.peakMonth?.month ?? "None"}
                    subText={
                      analyticsSummary.peakMonth
                        ? `${analyticsSummary.peakMonth.items} events`
                        : "No monthly data"
                    }
                  />
                  <MetricCard
                    colors={colors}
                    styles={styles}
                    icon={Trophy}
                    label="Top item"
                    value={analyticsSummary.topItem?.name ?? "None"}
                    subText={
                      analyticsSummary.topItem
                        ? `${analyticsSummary.topItem.count} consumed`
                        : "No item data"
                    }
                  />
                </View>

                <View style={styles.highlightCard}>
                  <View style={styles.highlightIcon}>
                    <Sun size={20} color="#f59e0b" />
                  </View>
                  <View style={styles.highlightCopy}>
                    <Text style={styles.highlightLabel}>Seasonal peak</Text>
                    <Text style={styles.highlightTitle}>
                      {analyticsSummary.peakSeason?.name ?? "Not enough data"}
                    </Text>
                  </View>
                  <Text style={styles.highlightValue}>
                    {analyticsSummary.peakSeason?.value ?? 0}
                  </Text>
                </View>
              </View>

              {!!data?.insights?.length && (
                <View style={styles.insightCard}>
                  <View style={styles.insightIcon}>
                    <Zap size={20} color="#8b5cf6" />
                  </View>
                  <View style={styles.insightTextWrap}>
                    <Text style={styles.insightTitle}>AI insight</Text>
                    {data.insights.map((insight, index) => (
                      <View key={`${insight}-${index}`} style={styles.insightListItem}>
                        <View style={styles.insightDot} />
                        <Text style={styles.insightBody}>{cleanInsight(insight)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {!!data?.consumption_trend?.length && (
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeader}>
                    <ChartColumn size={18} color={colors.accent1} />
                    <View>
                      <Text style={styles.sectionTitle}>
                        Consumption velocity
                      </Text>
                      <Text style={styles.sectionSubtitle}>
                        Items consumed by month
                      </Text>
                    </View>
                  </View>

                  <ColumnChart
                    data={data.consumption_trend.map((item) => ({
                      label: item.month,
                      value: item.items,
                    }))}
                    fillStyle={styles.columnFill}
                    styles={styles}
                  />
                </View>
              )}

              {!!data?.top_items?.length && (
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeader}>
                    <ListOrdered size={18} color={colors.accent1} />
                    <View>
                      <Text style={styles.sectionTitle}>
                        Most consumed items
                      </Text>
                      <Text style={styles.sectionSubtitle}>
                        Top pantry usage frequency
                      </Text>
                    </View>
                  </View>

                  <BarChart
                    data={data.top_items.map((item, index) => ({
                      label: `${index + 1}. ${item.name}`,
                      value: item.count,
                      suffix: "x",
                    }))}
                    fillStyle={styles.barFillBlue}
                    styles={styles}
                  />
                </View>
              )}

              {!!data?.seasonal_trends?.length && (
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeader}>
                    <Sun size={18} color={colors.accent1} />
                    <View>
                      <Text style={styles.sectionTitle}>Seasonal trends</Text>
                      <Text style={styles.sectionSubtitle}>
                        Usage intensity by season
                      </Text>
                    </View>
                  </View>

                  <BarChart
                    data={data.seasonal_trends.map((item) => ({
                      label: item.name,
                      value: item.value,
                    }))}
                    fillStyle={styles.barFillWarning}
                    styles={styles}
                  />
                </View>
              )}

              {!!data?.dietaryComposition?.length && (
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeader}>
                    <ChartPie size={18} color={colors.accent1} />
                    <View>
                      <Text style={styles.sectionTitle}>
                        Dietary composition
                      </Text>
                      <Text style={styles.sectionSubtitle}>
                        Nutritional category mix in stock
                      </Text>
                    </View>
                  </View>

                  <ColumnChart
                    data={data.dietaryComposition.map((item) => ({
                      label: item.subject,
                      value: item.A,
                    }))}
                    fillStyle={styles.columnFillGreen}
                    styles={styles}
                  />
                </View>
              )}
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
  icon: typeof Activity;
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
  icon: typeof CalendarDays;
  label: string;
  value: string;
  subText: string;
}) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricIcon}>
        <Icon size={17} color={colors.accent1} />
      </View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.metricSubText}>{subText}</Text>
    </View>
  );
}

function ColumnChart({
  data,
  fillStyle,
  styles,
}: {
  data: { label: string; value: number }[];
  fillStyle: any;
  styles: ReturnType<typeof createStyles>;
}) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <View style={styles.columnChartContainer}>
      {data.map((item, index) => {
        const heightPercent = Math.max((item.value / maxValue) * 100, 5);
        return (
          <View key={`${item.label}-${index}`} style={styles.columnWrap}>
            <Text style={styles.columnValue}>{item.value}</Text>
            <View style={styles.columnTrack}>
              <View style={[fillStyle, { height: `${heightPercent}%` }]} />
            </View>
            <Text style={styles.columnLabel} numberOfLines={1}>
              {item.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function BarChart({
  data,
  fillStyle,
  styles,
}: {
  data: { label: string; value: number; suffix?: string }[];
  fillStyle: any;
  styles: ReturnType<typeof createStyles>;
}) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <View style={styles.barChartContainer}>
      {data.map((item, index) => {
        const widthPercent = Math.max((item.value / maxValue) * 100, 4);
        return (
          <View key={`${item.label}-${index}`} style={styles.barChartRow}>
            <View style={styles.barChartLabels}>
              <Text style={styles.barCategoryLabel} numberOfLines={1}>
                {item.label}
              </Text>
              <Text style={styles.barValueLabel}>
                {item.value}
                {item.suffix ?? ""}
              </Text>
            </View>
            <View style={styles.barTrack}>
              <View style={[fillStyle, { width: `${widthPercent}%` }]} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const cleanInsight = (insight: string) =>
  insight.replace(/^[^\w']+\s*/u, "").trim();

const createStyles = (colors: any) => {
  const isDark = colors.bg === "#000000";
  const softAccent = isDark ? "rgba(74, 222, 128, 0.14)" : "#eaf7ef";
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
    kpiGrid: {
      gap: 12,
    },
    kpiRow: {
      flexDirection: "row",
      gap: 12,
    },
    metricCard: {
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
    metricLabel: {
      color: colors.text3,
      fontSize: 10,
      fontWeight: "900",
      textTransform: "uppercase",
    },
    metricValue: {
      color: colors.text1,
      fontSize: 19,
      fontWeight: "900",
    },
    metricSubText: {
      color: colors.text2,
      fontSize: 12,
      fontWeight: "700",
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
      backgroundColor: isDark
        ? "rgba(245, 158, 11, 0.16)"
        : "rgba(245, 158, 11, 0.1)",
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
    highlightValue: {
      color: "#f59e0b",
      fontSize: 18,
      fontWeight: "900",
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
      alignItems: "flex-start",
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
      marginBottom: 8,
    },
    insightListItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
      marginBottom: 6,
    },
    insightDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: "#8b5cf6",
      marginTop: 6,
    },
    insightBody: {
      color: colors.text1,
      fontSize: 13,
      lineHeight: 20,
      flex: 1,
      fontWeight: "700",
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
      gap: 10,
    },
    sectionTitle: {
      color: colors.text1,
      fontSize: 20,
      fontWeight: "900",
    },
    sectionSubtitle: {
      color: colors.text2,
      fontSize: 12,
      fontWeight: "700",
      marginTop: 2,
    },
    columnChartContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      height: 154,
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
      maxWidth: 32,
      flex: 1,
      backgroundColor: colors.surface3,
      borderRadius: 10,
      justifyContent: "flex-end",
      overflow: "hidden",
    },
    columnFill: {
      width: "100%",
      backgroundColor: colors.accent1,
      borderRadius: 10,
    },
    columnFillGreen: {
      width: "100%",
      backgroundColor: "#10b981",
      borderRadius: 10,
    },
    columnLabel: {
      color: colors.text3,
      fontSize: 10,
      fontWeight: "800",
      textAlign: "center",
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
    barValueLabel: {
      color: colors.text2,
      fontSize: 12,
      fontWeight: "900",
    },
    barTrack: {
      height: 10,
      backgroundColor: colors.surface3,
      borderRadius: 999,
      overflow: "hidden",
    },
    barFillBlue: {
      height: "100%",
      backgroundColor: "#3b82f6",
      borderRadius: 999,
    },
    barFillWarning: {
      height: "100%",
      backgroundColor: "#f59e0b",
      borderRadius: 999,
    },
    loadingWrap: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      gap: 10,
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
  });
};
