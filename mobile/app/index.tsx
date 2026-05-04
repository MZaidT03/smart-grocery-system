import { Link } from "expo-router";
import React from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function LandingScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroCard}>
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F4F1EA",
  },
  container: {
    padding: 20,
    gap: 18,
  },
  heroCard: {
    backgroundColor: "#0E3A32",
    padding: 24,
    borderRadius: 20,
  },
  appName: {
    color: "#FDE7C6",
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  tagline: {
    color: "#FDE7C6",
    fontSize: 18,
    marginTop: 10,
  },
  heroBody: {
    color: "#F1F5F2",
    fontSize: 14,
    marginTop: 12,
    lineHeight: 20,
  },
  heroActions: {
    marginTop: 18,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: "#F49E4C",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#2D1D12",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#FDE7C6",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#FDE7C6",
    fontSize: 16,
    fontWeight: "600",
  },
  featureGrid: {
    gap: 14,
  },
  featureCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    shadowColor: "#1A120B",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C2C2C",
  },
  featureBody: {
    marginTop: 6,
    fontSize: 14,
    color: "#5F5F5F",
    lineHeight: 20,
  },
  footer: {
    alignItems: "center",
    paddingVertical: 10,
  },
  footerText: {
    color: "#7A6C61",
    fontSize: 12,
  },
});
