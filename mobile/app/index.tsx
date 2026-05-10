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
import { useTheme } from "@/context/theme";
import ThemeToggle from "@/components/theme-toggle";
import {
  ShoppingCart,
  Sparkles,
  BarChart3,
  TrendingUp,
  ListChecks,
} from "lucide-react-native";

export default function LandingScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Navbar Area */}
        <View style={styles.navBar}>
          <View style={styles.logoContainer}>
            <ShoppingCart size={24} color={colors.accent1} />
            <Text style={styles.logoText}>SmartGrocer</Text>
          </View>
          <ThemeToggle />
        </View>

        {/* Hero Section */}
        <View style={styles.heroCard}>
          {/* Badge */}
          <View style={styles.badge}>
            <Sparkles size={14} color={colors.accent1} />
            <Text style={styles.badgeText}>AI-Powered Grocery Management</Text>
          </View>

          <Text style={styles.appName}>
            Smart Grocery &{"\n"}
            <Text style={{ color: colors.accent1 }}>Inventory System</Text>
          </Text>

          <Text style={styles.heroBody}>
            Stop wasting food and money. Efficiently manage your household
            groceries, reduce waste, and predict future needs with AI-driven
            analytics.
          </Text>

          <View style={styles.heroActions}>
            <Link href="/register" asChild>
              <Pressable style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Get Started Free</Text>
              </Pressable>
            </Link>
            <Link href="/login" asChild>
              <Pressable style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Log in</Text>
              </Pressable>
            </Link>
          </View>

          {/* Stats Row */}
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>40%</Text>
              <Text style={styles.statLabel}>Food Waste{"\n"}Reduced</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>95%</Text>
              <Text style={styles.statLabel}>Prediction{"\n"}Accuracy</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>$200</Text>
              <Text style={styles.statLabel}>Avg. Monthly{"\n"}Savings</Text>
            </View>
          </View>
        </View>

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Powerful Features</Text>
          <Text style={styles.sectionSubtitle}>
            Everything you need to manage your groceries smartly
          </Text>

          <View style={styles.featureGrid}>
            {/* Feature 1 */}
            <View style={styles.featureCard}>
              <View style={styles.iconContainer}>
                <BarChart3 size={24} color={colors.accent1} />
              </View>
              <Text style={styles.featureTitle}>Smart Tracking</Text>
              <Text style={styles.featureBody}>
                Monitor daily consumption patterns and track your inventory in
                real-time with intuitive dashboards.
              </Text>
            </View>

            {/* Feature 2 */}
            <View style={styles.featureCard}>
              <View style={styles.iconContainer}>
                <TrendingUp size={24} color={colors.accent1} />
              </View>
              <Text style={styles.featureTitle}>AI Predictions</Text>
              <Text style={styles.featureBody}>
                Forecast when items will run out based on your usage history
                with machine learning algorithms.
              </Text>
            </View>

            {/* Feature 3 */}
            <View style={styles.featureCard}>
              <View style={styles.iconContainer}>
                <ListChecks size={24} color={colors.accent1} />
              </View>
              <Text style={styles.featureTitle}>Auto Shopping Lists</Text>
              <Text style={styles.featureBody}>
                Generate automated shopping lists before you run out, ensuring
                you always have what you need.
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            SmartGrocer © 2025. All rights reserved.
          </Text>
          <Text style={styles.footerCredits}>
            Project by M Zaid Tahir | Roman Fatima | Danish Imran
          </Text>
          <Text style={styles.footerCompany}>CodeInn' Tech</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    container: {
      padding: 20,
      gap: 24,
    },
    navBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 10,
    },
    logoContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    logoText: {
      color: colors.text1,
      fontSize: 20,
      fontWeight: "800",
      letterSpacing: -0.5,
    },
    heroCard: {
      backgroundColor: colors.surface1,
      padding: 24,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
    },
    badge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface2,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 6,
      marginBottom: 20,
    },
    badgeText: {
      color: colors.text2,
      fontSize: 10,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    appName: {
      color: colors.text1,
      fontSize: 36,
      fontWeight: "800",
      letterSpacing: -1,
      textAlign: "center",
      lineHeight: 40,
    },
    heroBody: {
      color: colors.text2,
      fontSize: 16,
      marginTop: 16,
      lineHeight: 24,
      textAlign: "center",
    },
    heroActions: {
      marginTop: 28,
      width: "100%",
      gap: 12,
    },
    primaryButton: {
      backgroundColor: colors.accent1,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: "center",
    },
    primaryButtonText: {
      color: colors.bg,
      fontSize: 16,
      fontWeight: "700",
    },
    secondaryButton: {
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: "center",
    },
    secondaryButtonText: {
      color: colors.text1,
      fontSize: 16,
      fontWeight: "600",
    },
    statsContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      width: "100%",
      marginTop: 32,
      paddingTop: 24,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    statBox: {
      alignItems: "center",
      flex: 1,
    },
    statValue: {
      fontSize: 24,
      fontWeight: "800",
      color: colors.text1,
    },
    statLabel: {
      fontSize: 12,
      color: colors.text3,
      textAlign: "center",
      marginTop: 4,
      lineHeight: 16,
    },
    featuresSection: {
      marginTop: 10,
    },
    sectionTitle: {
      fontSize: 28,
      fontWeight: "800",
      color: colors.text1,
      textAlign: "center",
      letterSpacing: -0.5,
    },
    sectionSubtitle: {
      fontSize: 15,
      color: colors.text2,
      textAlign: "center",
      marginTop: 6,
      marginBottom: 20,
    },
    featureGrid: {
      gap: 16,
    },
    featureCard: {
      backgroundColor: colors.surface1,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    iconContainer: {
      width: 48,
      height: 48,
      backgroundColor: colors.surface2,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    featureTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text1,
    },
    featureBody: {
      marginTop: 8,
      fontSize: 14,
      color: colors.text2,
      lineHeight: 22,
    },
    footer: {
      alignItems: "center",
      paddingVertical: 24,
      marginTop: 20,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 6,
    },
    footerText: {
      color: colors.text3,
      fontSize: 12,
    },
    footerCredits: {
      color: colors.text2,
      fontSize: 12,
      fontWeight: "500",
      textAlign: "center",
      lineHeight: 18,
    },
    footerCompany: {
      color: colors.text3,
      fontSize: 12,
      fontWeight: "600",
    },
  });
