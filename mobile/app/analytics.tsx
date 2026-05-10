import { API_BASE_URL } from "@/constants/api";
import { useTheme } from "@/context/theme";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
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
  Activity,
  TrendingUp,
  Zap,
  Sun,
  AlertCircle,
  ListOrdered,
  PieChart,
} from "lucide-react-native";

type InsightItem = {
  text: string;
};

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

  const fetchAnalytics = async (isRefresh = false) => {
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
      const res = await fetch(
        `${API_BASE_URL}/analytics/dashboard?userId=${userId}`,
      );
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error("Analytics fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [userId]);

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
            <Activity size={20} color={colors.accent1} />
            <Text style={styles.title}>Data Analytics</Text>
          </View>
          <Text style={styles.subtitle}>Insights & consumption patterns</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.accent1} />
          <Text style={styles.loadingText}>Loading Analytics...</Text>
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
          {/* Smart Insights (AI Card) */}
          {data?.insights && data.insights.length > 0 && (
            <View style={styles.insightCard}>
              <Zap size={24} color="#8B5CF6" />
              <View style={styles.insightTextWrap}>
                <Text style={styles.insightTitle}>Pattern Recognition</Text>
                {data.insights.map((insight, idx) => (
                  <View key={idx} style={styles.insightListItem}>
                    <View style={styles.insightDot} />
                    <Text style={styles.insightBody}>{insight}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Consumption Velocity (Vertical Column Chart) */}
          {data?.consumption_trend && data.consumption_trend.length > 0 && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <TrendingUp size={20} color={colors.text1} />
                <Text style={styles.sectionTitle}>Consumption Velocity</Text>
              </View>
              <Text style={styles.sectionSubtitle}>
                Total items consumed per month
              </Text>

              <View style={styles.columnChartContainer}>
                {data.consumption_trend.map((item, idx) => {
                  const maxVal = Math.max(
                    ...data.consumption_trend.map((i) => i.items),
                    1,
                  );
                  const heightPct = Math.max((item.items / maxVal) * 100, 5);

                  return (
                    <View key={idx} style={styles.columnWrap}>
                      <Text style={styles.columnValue}>{item.items}</Text>
                      <View style={styles.columnTrack}>
                        <View
                          style={[
                            styles.columnFill,
                            { height: `${heightPct}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.columnLabel}>{item.month}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Top Items (Horizontal Bar Chart) */}
          {data?.top_items && data.top_items.length > 0 && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <ListOrdered size={20} color={colors.text1} />
                <Text style={styles.sectionTitle}>Most Consumed Items</Text>
              </View>
              <Text style={styles.sectionSubtitle}>
                Your top {Math.min(5, data.top_items.length)} items
              </Text>

              <View style={styles.barChartContainer}>
                {data.top_items.map((item, idx) => {
                  const maxCount = Math.max(
                    ...data.top_items.map((i) => i.count),
                    1,
                  );
                  const widthPercent = Math.max(
                    (item.count / maxCount) * 100,
                    2,
                  );

                  return (
                    <View key={idx} style={styles.barChartRow}>
                      <View style={styles.barChartLabels}>
                        <Text style={styles.barCategoryLabel} numberOfLines={1}>
                          {idx + 1}. {item.name}
                        </Text>
                        <Text style={styles.barPriceLabel}>{item.count}x</Text>
                      </View>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFillAlt,
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

          {/* Seasonal Trends (Horizontal Bar Chart) */}
          {data?.seasonal_trends && data.seasonal_trends.length > 0 && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Sun size={20} color={colors.text1} />
                <Text style={styles.sectionTitle}>Seasonal Trends</Text>
              </View>
              <Text style={styles.sectionSubtitle}>
                Consumption intensity by season
              </Text>

              <View style={styles.barChartContainer}>
                {data.seasonal_trends.map((season, idx) => {
                  const maxValue = Math.max(
                    ...data.seasonal_trends.map((s) => s.value),
                    1,
                  );
                  const percentage = Math.max(
                    (season.value / maxValue) * 100,
                    2,
                  );

                  return (
                    <View key={idx} style={styles.barChartRow}>
                      <View style={styles.barChartLabels}>
                        <Text style={styles.barCategoryLabel}>
                          {season.name}
                        </Text>
                        <Text style={styles.barPriceLabel}>{season.value}</Text>
                      </View>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFillWarning,
                            { width: `${percentage}%` },
                          ]}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Dietary Composition (Vertical Column Chart) */}
          {data?.dietaryComposition && data.dietaryComposition.length > 0 && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <PieChart size={20} color={colors.text1} />
                <Text style={styles.sectionTitle}>Dietary Composition</Text>
              </View>
              <Text style={styles.sectionSubtitle}>
                Nutritional breakdown of your stock
              </Text>

              <View style={styles.columnChartContainer}>
                {data.dietaryComposition.map((item, idx) => {
                  const maxValue = Math.max(
                    ...data.dietaryComposition.map((d) => d.A),
                    1,
                  );
                  const percentage = Math.max((item.A / maxValue) * 100, 5);

                  return (
                    <View key={idx} style={styles.columnWrap}>
                      <Text style={styles.columnValue}>{item.A}</Text>
                      <View style={styles.columnTrack}>
                        <View
                          style={[
                            styles.barFillSuccess,
                            { height: `${percentage}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.columnLabel} numberOfLines={1}>
                        {item.subject}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    // Header
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
    headerCenter: {
      flex: 1,
      alignItems: "center",
    },
    headerTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    headerSpacer: {
      width: 40,
    },
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
    loadingWrap: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      color: colors.text2,
      fontSize: 14,
      fontWeight: "500",
      marginTop: 12,
    },
    content: {
      padding: 20,
      gap: 20,
      paddingBottom: 40,
    },

    // AI Insight Card
    insightCard: {
      flexDirection: "row",
      backgroundColor: "rgba(139, 92, 246, 0.1)",
      borderWidth: 1,
      borderColor: "rgba(139, 92, 246, 0.2)",
      borderRadius: 20,
      padding: 20,
      gap: 16,
      alignItems: "flex-start",
    },
    insightTextWrap: {
      flex: 1,
    },
    insightTitle: {
      color: "#A78BFA",
      fontSize: 15,
      fontWeight: "700",
      marginBottom: 8,
    },
    insightListItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
      marginBottom: 6,
    },
    insightDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: "#8B5CF6",
      marginTop: 6,
    },
    insightBody: {
      color: colors.text1,
      fontSize: 13,
      lineHeight: 20,
      opacity: 0.9,
      flex: 1,
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
      fontSize: 17,
      fontWeight: "700",
      letterSpacing: -0.3,
    },
    sectionSubtitle: {
      color: colors.text2,
      fontSize: 13,
      marginTop: -8,
      marginBottom: 4,
    },

    // Column Chart (Vertical Bars)
    columnChartContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      height: 160,
      paddingHorizontal: 4,
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
      fontSize: 11,
      fontWeight: "700",
    },
    columnTrack: {
      width: 28,
      flex: 1,
      backgroundColor: colors.surface2,
      borderRadius: 6,
      justifyContent: "flex-end",
      overflow: "hidden",
    },
    columnFill: {
      width: "100%",
      backgroundColor: colors.accent1,
      borderRadius: 6,
    },
    barFillSuccess: {
      width: "100%",
      backgroundColor: "#10B981", // Success green
      borderRadius: 6,
    },
    columnLabel: {
      color: colors.text2,
      fontSize: 10,
      fontWeight: "600",
      textAlign: "center",
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
      paddingRight: 10,
    },
    barPriceLabel: {
      color: colors.text1,
      fontSize: 13,
      fontWeight: "700",
    },
    barTrack: {
      height: 8,
      backgroundColor: colors.surface2,
      borderRadius: 999,
      overflow: "hidden",
    },
    barFillAlt: {
      height: "100%",
      backgroundColor: "#3B82F6", // Blue
      borderRadius: 999,
    },
    barFillWarning: {
      height: "100%",
      backgroundColor: "#F59E0B", // Amber/Warning
      borderRadius: 999,
    },

    // Empty State
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
};
