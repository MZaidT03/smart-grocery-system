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

export default function LandingScreen() {
  // Pull the pure black/white/green minimal colors directly from the context
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <ThemeToggle />
          </View>
          <Text style={styles.appName}>Smart Grocery</Text>
          <Text style={styles.tagline}>
            Plan smarter. Waste less. Save more.
          </Text>
          <Text style={styles.heroBody}>
            Your personalized grocery companion for budgets, recipes, and price
            insights.
          </Text>
          <View style={styles.heroActions}>
            <Link href="/login" asChild>
              <Pressable style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Log in</Text>
              </Pressable>
            </Link>
            <Link href="/register" asChild>
              <Pressable style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Create account</Text>
              </Pressable>
            </Link>
          </View>
        </View>

        <View style={styles.featureGrid}>
          <View style={styles.featureCard}>
            <Text style={styles.featureTitle}>Budget Guard</Text>
            <Text style={styles.featureBody}>
              Track spending and get smart alerts before you overshoot.
            </Text>
          </View>
          <View style={styles.featureCard}>
            <Text style={styles.featureTitle}>Smart Suggestions</Text>
            <Text style={styles.featureBody}>
              Recommendations based on inventory, recipes, and prices.
            </Text>
          </View>
          <View style={styles.featureCard}>
            <Text style={styles.featureTitle}>Price Trends</Text>
            <Text style={styles.featureBody}>
              See market prices and plan your purchases at the best time.
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Built for the Smart Grocery System
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Updated to map to your new minimal Theme Colors
const createStyles = (colors: any) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    container: {
      padding: 20,
      gap: 24, // Increased gap for minimalist breathing room
    },
    heroCard: {
      backgroundColor: colors.surface1, // Subtle distinction from bg
      padding: 24,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border, // Crisp, premium border
    },
    heroTopRow: {
      alignItems: "flex-end",
      marginBottom: 10,
    },
    appName: {
      color: colors.text1,
      fontSize: 32,
      fontWeight: "800",
      letterSpacing: -0.5, // Tighter letter spacing for a modern look
    },
    tagline: {
      color: colors.text1,
      fontSize: 18,
      fontWeight: "600",
      marginTop: 8,
    },
    heroBody: {
      color: colors.text2,
      fontSize: 15,
      marginTop: 12,
      lineHeight: 22,
    },
    heroActions: {
      marginTop: 24,
      gap: 12,
    },
    primaryButton: {
      backgroundColor: colors.accent1, // Single pop of Brand Green
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: "center",
    },
    primaryButtonText: {
      color: colors.bg, // Reverses out depending on theme (black text in dark mode, white in light)
      fontSize: 16,
      fontWeight: "700",
    },
    secondaryButton: {
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: "center",
    },
    secondaryButtonText: {
      color: colors.text1,
      fontSize: 16,
      fontWeight: "600",
    },
    featureGrid: {
      gap: 14,
    },
    featureCard: {
      backgroundColor: colors.surface1,
      borderRadius: 16,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.border,
      // Removed heavy shadow for a flat, minimal aesthetic
    },
    featureTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text1,
    },
    featureBody: {
      marginTop: 6,
      fontSize: 14,
      color: colors.text2,
      lineHeight: 20,
    },
    footer: {
      alignItems: "center",
      paddingVertical: 10,
    },
    footerText: {
      color: colors.text3,
      fontSize: 12,
    },
  });
