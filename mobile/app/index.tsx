import { Link } from "expo-router";
import React, { useMemo } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import ThemeToggle from "@/components/theme-toggle";
import { useTheme } from "@/context/theme";
import {
  ArrowRight,
  BarChart3,
  BellRing,
  CheckCircle2,
  Clock3,
  Leaf,
  LineChart,
  ListChecks,
  PackageCheck,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react-native";

const pantryItems = [
  {
    name: "Rice",
    amount: "12 kg",
    status: "Healthy",
    fill: "84%",
    type: "success",
  },
  {
    name: "Milk",
    amount: "2 packs",
    status: "2 days left",
    fill: "38%",
    type: "warning",
  },
  {
    name: "Tomatoes",
    amount: "1.4 kg",
    status: "Use today",
    fill: "18%",
    type: "danger",
  },
] as const;

const stats = [
  {
    icon: Leaf,
    value: "40%",
    label: "Less waste",
  },
  {
    icon: LineChart,
    value: "95%",
    label: "Forecast fit",
  },
  {
    icon: Wallet,
    value: "$200",
    label: "Monthly savings",
  },
] as const;

const features = [
  {
    icon: PackageCheck,
    title: "Live Pantry Control",
    body: "Track stock, expiry, usage, and restock signals in one elegant dashboard.",
  },
  {
    icon: TrendingUp,
    title: "Demand Forecasting",
    body: "Predict what you need next using smart consumption patterns.",
  },
  {
    icon: ListChecks,
    title: "Smart Shopping Lists",
    body: "Automatically convert low-stock items into focused grocery plans.",
  },
] as const;

export default function LandingScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const getToneColor = (type: string) => {
    if (type === "danger") return colors.danger;
    if (type === "warning") return colors.warning;
    return colors.success;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandWrap}>
            <View style={styles.brandIcon}>
              <ShoppingCart size={21} color={colors.bg} strokeWidth={2.7} />
            </View>

            <View>
              <Text style={styles.brandName}>SmartGrocer</Text>
              <Text style={styles.brandTagline}>AI Grocery Intelligence</Text>
            </View>
          </View>

          <ThemeToggle />
        </View>

        {/* Hero */}
        <View style={styles.heroCard}>
          <View style={styles.blurCircleOne} />
          <View style={styles.blurCircleTwo} />

          <View style={styles.topBadge}>
            <Sparkles size={14} color={colors.accent1} strokeWidth={2.5} />
            <Text style={styles.topBadgeText}>CodeInn Tech Product</Text>
          </View>

          <Text style={styles.heroTitle}>
            Smarter groceries. Cleaner spending. Less waste.
          </Text>

          <Text style={styles.heroDescription}>
            SmartGrocer connects pantry tracking, demand forecasting, market
            prices, and shopping lists into one intelligent grocery experience.
          </Text>

          <View style={styles.buttonRow}>
            <Link href="/register" asChild>
              <Pressable style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Start Free</Text>
                <ArrowRight size={18} color={colors.bg} strokeWidth={2.8} />
              </Pressable>
            </Link>

            <Link href="/login" asChild>
              <Pressable style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Login</Text>
              </Pressable>
            </Link>
          </View>

          <View style={styles.heroTrustRow}>
            <View style={styles.trustItem}>
              <ShieldCheck size={15} color={colors.success} strokeWidth={2.5} />
              <Text style={styles.trustText}>Organized pantry</Text>
            </View>

            <View style={styles.trustDivider} />

            <View style={styles.trustItem}>
              <Zap size={15} color={colors.accent1} strokeWidth={2.5} />
              <Text style={styles.trustText}>Instant insights</Text>
            </View>
          </View>

          {/* Dashboard Preview */}
          <View style={styles.dashboardCard}>
            <View style={styles.dashboardHeader}>
              <View>
                <Text style={styles.dashboardMiniText}>Live dashboard</Text>
                <Text style={styles.dashboardTitle}>Today’s Pantry</Text>
              </View>

              <View style={styles.alertBadge}>
                <BellRing size={13} color={colors.accent1} strokeWidth={2.4} />
                <Text style={styles.alertBadgeText}>3 alerts</Text>
              </View>
            </View>

            <View style={styles.metricStrip}>
              <View style={styles.metricBox}>
                <Text style={styles.metricValue}>24</Text>
                <Text style={styles.metricLabel}>Items</Text>
              </View>

              <View style={styles.metricDivider} />

              <View style={styles.metricBox}>
                <Text style={styles.metricValue}>6</Text>
                <Text style={styles.metricLabel}>Restock</Text>
              </View>

              <View style={styles.metricDivider} />

              <View style={styles.metricBox}>
                <Text style={styles.metricValue}>Rs. 8.4k</Text>
                <Text style={styles.metricLabel}>Budget left</Text>
              </View>
            </View>

            <View style={styles.inventoryList}>
              {pantryItems.map((item) => (
                <View key={item.name} style={styles.inventoryItem}>
                  <View style={styles.inventoryIcon}>
                    <PackageCheck
                      size={16}
                      color={colors.accent1}
                      strokeWidth={2.4}
                    />
                  </View>

                  <View style={styles.inventoryMain}>
                    <View style={styles.inventoryTop}>
                      <Text style={styles.inventoryName}>{item.name}</Text>
                      <Text
                        style={[
                          styles.inventoryStatus,
                          { color: getToneColor(item.type) },
                        ]}
                      >
                        {item.status}
                      </Text>
                    </View>

                    <View style={styles.inventoryBottom}>
                      <Text style={styles.inventoryAmount}>{item.amount}</Text>

                      <View style={styles.progressTrack}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: item.fill,
                              backgroundColor: getToneColor(item.type),
                            },
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.restockCard}>
              <View style={styles.restockIcon}>
                <Clock3 size={18} color={colors.accent1} strokeWidth={2.5} />
              </View>

              <View style={styles.restockTextWrap}>
                <Text style={styles.restockTitle}>Next smart restock</Text>
                <Text style={styles.restockText}>
                  Friday · 6 recommended items
                </Text>
              </View>

              <CheckCircle2 size={21} color={colors.success} strokeWidth={2.6} />
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {stats.map((item) => {
            const Icon = item.icon;

            return (
              <View key={item.label} style={styles.statCard}>
                <View style={styles.statIcon}>
                  <Icon size={17} color={colors.accent1} strokeWidth={2.5} />
                </View>

                <Text style={styles.statValue}>{item.value}</Text>
                <Text style={styles.statLabel}>{item.label}</Text>
              </View>
            );
          })}
        </View>

        {/* Feature Section */}
        <View style={styles.featureSection}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionKicker}>Why it matters</Text>
              <Text style={styles.sectionTitle}>
                A modern grocery system for real households.
              </Text>
            </View>

            <View style={styles.sectionIcon}>
              <BarChart3 size={20} color={colors.accent1} strokeWidth={2.4} />
            </View>
          </View>

          <View style={styles.featureList}>
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <View key={feature.title} style={styles.featureCard}>
                  <View style={styles.featureIcon}>
                    <Icon size={21} color={colors.accent1} strokeWidth={2.4} />
                  </View>

                  <View style={styles.featureTextWrap}>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureBody}>{feature.body}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.budgetCard}>
            <View style={styles.budgetIcon}>
              <Wallet size={21} color={colors.bg} strokeWidth={2.5} />
            </View>

            <View style={styles.budgetTextWrap}>
              <Text style={styles.budgetTitle}>Budget guard is ready</Text>
              <Text style={styles.budgetText}>
                Compare pantry needs with monthly grocery spending before
                checkout.
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerBrand}>SmartGrocer</Text>
          <Text style={styles.footerText}>Copyright © 2026</Text>
          <Text style={styles.footerCredits}>
            M Zaid Tahir · Roman Fatima · Danish Imran
          </Text>
          <Text style={styles.footerCompany}>Powered by CodeInn Tech</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => {
  const isDark =
    colors.bg === "#000000" ||
    colors.bg === "#0B0B0B" ||
    colors.bg === "#0b0b0b";

  const shadowColor = isDark ? "#000000" : "#17251c";

  const softAccent = isDark
    ? "rgba(74, 222, 128, 0.13)"
    : "rgba(16, 185, 129, 0.10)";

  const ultraSoftAccent = isDark
    ? "rgba(74, 222, 128, 0.07)"
    : "rgba(16, 185, 129, 0.06)";

  const cardShadow = {
    shadowColor,
    shadowOpacity: isDark ? 0.2 : 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 5,
  };

  const strongShadow = {
    shadowColor,
    shadowOpacity: isDark ? 0.26 : 0.14,
    shadowRadius: 34,
    shadowOffset: { width: 0, height: 20 },
    elevation: 8,
  };

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.bg,
    },

    container: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 36,
      gap: 18,
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 2,
    },

    brandWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 11,
    },

    brandIcon: {
      width: 46,
      height: 46,
      borderRadius: 17,
      backgroundColor: colors.accent1,
      alignItems: "center",
      justifyContent: "center",
      ...cardShadow,
    },

    brandName: {
      color: colors.text1,
      fontSize: 20,
      fontWeight: "900",
      letterSpacing: -0.5,
    },

    brandTagline: {
      color: colors.text3,
      fontSize: 11,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginTop: 2,
    },

    heroCard: {
      position: "relative",
      overflow: "hidden",
      backgroundColor: colors.surface1,
      borderRadius: 34,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 22,
      ...strongShadow,
    },

    blurCircleOne: {
      position: "absolute",
      width: 210,
      height: 210,
      borderRadius: 999,
      backgroundColor: softAccent,
      top: -80,
      right: -70,
    },

    blurCircleTwo: {
      position: "absolute",
      width: 170,
      height: 170,
      borderRadius: 999,
      backgroundColor: ultraSoftAccent,
      left: -90,
      bottom: 160,
    },

    topBadge: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      backgroundColor: softAccent,
      borderWidth: 1,
      borderColor: isDark
        ? "rgba(74, 222, 128, 0.22)"
        : "rgba(16, 185, 129, 0.18)",
      borderRadius: 999,
      paddingHorizontal: 13,
      paddingVertical: 8,
    },

    topBadgeText: {
      color: colors.accent1,
      fontSize: 11,
      fontWeight: "900",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },

    heroTitle: {
      color: colors.text1,
      fontSize: 41,
      fontWeight: "900",
      lineHeight: 45,
      letterSpacing: -1.3,
      marginTop: 19,
    },

    heroDescription: {
      color: colors.text2,
      fontSize: 15.5,
      lineHeight: 24,
      fontWeight: "500",
      marginTop: 13,
    },

    buttonRow: {
      flexDirection: "row",
      gap: 11,
      marginTop: 24,
    },

    primaryButton: {
      flex: 1,
      minHeight: 56,
      borderRadius: 18,
      backgroundColor: colors.accent1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingHorizontal: 18,
      ...cardShadow,
    },

    primaryButtonText: {
      color: colors.bg,
      fontSize: 15,
      fontWeight: "900",
    },

    secondaryButton: {
      minHeight: 56,
      borderRadius: 18,
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
    },

    secondaryButtonText: {
      color: colors.text1,
      fontSize: 15,
      fontWeight: "800",
    },

    heroTrustRow: {
      marginTop: 16,
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },

    trustItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },

    trustDivider: {
      width: 1,
      height: 15,
      backgroundColor: colors.border,
    },

    trustText: {
      color: colors.text2,
      fontSize: 12,
      fontWeight: "800",
    },

    dashboardCard: {
      marginTop: 25,
      backgroundColor: colors.bg,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 17,
      gap: 15,
      ...cardShadow,
    },

    dashboardHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },

    dashboardMiniText: {
      color: colors.text3,
      fontSize: 11,
      fontWeight: "900",
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },

    dashboardTitle: {
      color: colors.text1,
      fontSize: 20,
      fontWeight: "900",
      marginTop: 3,
      letterSpacing: -0.4,
    },

    alertBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: softAccent,
      borderRadius: 999,
      paddingHorizontal: 11,
      paddingVertical: 8,
    },

    alertBadgeText: {
      color: colors.accent1,
      fontSize: 12,
      fontWeight: "900",
    },

    metricStrip: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface2,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 13,
      paddingHorizontal: 10,
    },

    metricBox: {
      flex: 1,
      alignItems: "center",
    },

    metricValue: {
      color: colors.text1,
      fontSize: 15,
      fontWeight: "900",
    },

    metricLabel: {
      color: colors.text3,
      fontSize: 10.5,
      fontWeight: "700",
      marginTop: 3,
      textAlign: "center",
    },

    metricDivider: {
      width: 1,
      height: 28,
      backgroundColor: colors.border,
    },

    inventoryList: {
      gap: 12,
    },

    inventoryItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },

    inventoryIcon: {
      width: 42,
      height: 42,
      borderRadius: 15,
      backgroundColor: softAccent,
      alignItems: "center",
      justifyContent: "center",
    },

    inventoryMain: {
      flex: 1,
    },

    inventoryTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 10,
    },

    inventoryName: {
      color: colors.text1,
      fontSize: 14.5,
      fontWeight: "900",
    },

    inventoryStatus: {
      fontSize: 12,
      fontWeight: "900",
    },

    inventoryBottom: {
      marginTop: 5,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },

    inventoryAmount: {
      minWidth: 55,
      color: colors.text3,
      fontSize: 12,
      fontWeight: "700",
    },

    progressTrack: {
      flex: 1,
      height: 7,
      borderRadius: 999,
      backgroundColor: colors.surface2,
      overflow: "hidden",
    },

    progressFill: {
      height: "100%",
      borderRadius: 999,
    },

    restockCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 11,
      backgroundColor: colors.surface2,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 13,
    },

    restockIcon: {
      width: 41,
      height: 41,
      borderRadius: 15,
      backgroundColor: colors.bg,
      alignItems: "center",
      justifyContent: "center",
    },

    restockTextWrap: {
      flex: 1,
    },

    restockTitle: {
      color: colors.text1,
      fontSize: 13.5,
      fontWeight: "900",
    },

    restockText: {
      color: colors.text2,
      fontSize: 12,
      fontWeight: "600",
      marginTop: 3,
    },

    statsRow: {
      flexDirection: "row",
      gap: 10,
    },

    statCard: {
      flex: 1,
      backgroundColor: colors.surface1,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 17,
      paddingHorizontal: 10,
      alignItems: "center",
      ...cardShadow,
    },

    statIcon: {
      width: 35,
      height: 35,
      borderRadius: 13,
      backgroundColor: softAccent,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 9,
    },

    statValue: {
      color: colors.text1,
      fontSize: 23,
      fontWeight: "900",
      letterSpacing: -0.4,
    },

    statLabel: {
      color: colors.text3,
      fontSize: 11,
      fontWeight: "800",
      textAlign: "center",
      marginTop: 4,
      lineHeight: 15,
    },

    featureSection: {
      backgroundColor: colors.surface1,
      borderRadius: 30,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 19,
      gap: 17,
      ...cardShadow,
    },

    sectionHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 14,
    },

    sectionKicker: {
      color: colors.accent1,
      fontSize: 11,
      fontWeight: "900",
      textTransform: "uppercase",
      letterSpacing: 0.7,
      marginBottom: 6,
    },

    sectionTitle: {
      color: colors.text1,
      fontSize: 24,
      fontWeight: "900",
      lineHeight: 29,
      letterSpacing: -0.8,
      flex: 1,
    },

    sectionIcon: {
      width: 45,
      height: 45,
      borderRadius: 16,
      backgroundColor: softAccent,
      alignItems: "center",
      justifyContent: "center",
    },

    featureList: {
      gap: 12,
    },

    featureCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.bg,
      borderRadius: 21,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 15,
    },

    featureIcon: {
      width: 46,
      height: 46,
      borderRadius: 16,
      backgroundColor: softAccent,
      alignItems: "center",
      justifyContent: "center",
    },

    featureTextWrap: {
      flex: 1,
    },

    featureTitle: {
      color: colors.text1,
      fontSize: 15.5,
      fontWeight: "900",
      letterSpacing: -0.2,
    },

    featureBody: {
      color: colors.text2,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: "500",
      marginTop: 4,
    },

    budgetCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 13,
      backgroundColor: colors.accent1,
      borderRadius: 24,
      padding: 17,
      ...cardShadow,
    },

    budgetIcon: {
      width: 49,
      height: 49,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark
        ? "rgba(0,0,0,0.22)"
        : "rgba(255,255,255,0.22)",
    },

    budgetTextWrap: {
      flex: 1,
    },

    budgetTitle: {
      color: colors.bg,
      fontSize: 16,
      fontWeight: "900",
      letterSpacing: -0.2,
    },

    budgetText: {
      color: colors.bg,
      opacity: 0.78,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: "600",
      marginTop: 4,
    },

    footer: {
      alignItems: "center",
      paddingTop: 14,
      paddingBottom: 4,
      gap: 5,
    },

    footerBrand: {
      color: colors.text1,
      fontSize: 15,
      fontWeight: "900",
    },

    footerText: {
      color: colors.text3,
      fontSize: 12,
      fontWeight: "700",
    },

    footerCredits: {
      color: colors.text2,
      fontSize: 12,
      fontWeight: "700",
      textAlign: "center",
      lineHeight: 18,
    },

    footerCompany: {
      color: colors.accent1,
      fontSize: 12,
      fontWeight: "900",
      marginTop: 2,
    },
  });
};