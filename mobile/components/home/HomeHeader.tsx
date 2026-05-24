import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/context/theme";
import {
  CircleAlert,
  Moon,
  PackageCheck,
  Plus,
  Sun,
  User,
  Wallet,
  Camera,
} from "lucide-react-native";

type HomeHeaderProps = {
  displayName?: string;
  totalItems: number;
  lowStockCount: number;
  watchListCount?: number;
  budgetStatus?: string;
  onAddPress: () => void;
  onProfilePress: () => void;
  onScanPress?: () => void;
};

export default function HomeHeader({
  displayName,
  totalItems,
  lowStockCount,
  watchListCount = 0,
  budgetStatus,
  onAddPress,
  onProfilePress,
  onScanPress,
}: HomeHeaderProps) {
  const { mode, setMode, scheme, colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const firstName = displayName?.trim()?.split(" ")?.[0] || "there";
  const pantryScore =
    totalItems > 0
      ? Math.max(12, Math.round(((totalItems - lowStockCount) / totalItems) * 100))
      : 0;
  const statusCopy =
    totalItems === 0
      ? "Start by adding a few kitchen staples."
      : lowStockCount > 0
        ? `${lowStockCount} item${lowStockCount === 1 ? "" : "s"} need attention.`
        : "Everything looks steady for now.";

  const toggleMode = () => {
    if (mode === "system") {
      setMode("dark");
      return;
    }
    setMode(mode === "dark" ? "light" : "dark");
  };

  const metrics = [
    {
      icon: PackageCheck,
      label: "Items",
      value: String(totalItems),
    },
    {
      icon: CircleAlert,
      label: "Watch",
      value: String(watchListCount),
    },
    {
      icon: Wallet,
      label: "Budget",
      value: budgetStatus === "active" ? "Active" : "Set up",
    },
  ];

  return (
    <View style={styles.hero}>
      <View style={styles.utilityRow}>
        <View>
          <Text style={styles.kicker}>Smart Grocery</Text>
          <Text style={styles.greeting}>Hi, {firstName}</Text>
        </View>

        <View style={styles.iconRow}>
          {onScanPress && (
            <Pressable style={styles.iconButton} onPress={onScanPress}>
              <Camera size={18} color={colors.text1} />
            </Pressable>
          )}
          <Pressable style={styles.iconButton} onPress={onProfilePress}>
            <User size={18} color={colors.text1} />
          </Pressable>
          <Pressable style={styles.iconButton} onPress={toggleMode}>
            {scheme === "dark" ? (
              <Moon size={18} color={colors.text1} />
            ) : (
              <Sun size={18} color={colors.text1} />
            )}
          </Pressable>
        </View>
      </View>

      <View style={styles.healthRow}>
        <View style={styles.scoreDial}>
          <Text style={styles.scoreValue}>{pantryScore}</Text>
          <Text style={styles.scoreLabel}>score</Text>
        </View>
        <View style={styles.healthCopy}>
          <Text style={styles.healthTitle}>Pantry health</Text>
          <Text style={styles.healthText}>{statusCopy}</Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pantryScore}%` }]} />
      </View>

      <View style={styles.metricRow}>
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <View key={metric.label} style={styles.metricItem}>
              <View style={styles.metricIcon}>
                <Icon size={15} color={colors.accent1} />
              </View>
              <Text style={styles.metricLabel}>{metric.label}</Text>
              <Text style={styles.metricValue} numberOfLines={1}>
                {metric.value}
              </Text>
            </View>
          );
        })}
      </View>

      <Pressable style={styles.addButton} onPress={onAddPress}>
        <Plus size={18} color={colors.bg} />
        <Text style={styles.addButtonText}>Add pantry item</Text>
      </Pressable>
    </View>
  );
}

const createStyles = (colors: any) => {
  const isDark = colors.bg === "#000000";
  const softAccent = isDark ? "rgba(74, 222, 128, 0.14)" : "#eaf7ef";
  const shadowColor = isDark ? "#000000" : "#102116";

  return StyleSheet.create({
    hero: {
      backgroundColor: colors.surface1,
      borderRadius: 28,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 18,
      shadowColor,
      shadowOpacity: isDark ? 0 : 0.08,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 14 },
      elevation: 4,
    },
    utilityRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 16,
    },
    kicker: {
      color: colors.accent1,
      textTransform: "uppercase",
      fontSize: 11,
      fontWeight: "900",
    },
    greeting: {
      color: colors.text1,
      fontSize: 30,
      fontWeight: "900",
      lineHeight: 35,
      marginTop: 5,
    },
    iconRow: {
      flexDirection: "row",
      gap: 8,
    },
    iconButton: {
      width: 42,
      height: 42,
      borderRadius: 15,
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    healthRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    scoreDial: {
      width: 78,
      height: 78,
      borderRadius: 24,
      backgroundColor: softAccent,
      borderWidth: 1,
      borderColor: isDark ? "rgba(74, 222, 128, 0.28)" : "#ccebd8",
      alignItems: "center",
      justifyContent: "center",
    },
    scoreValue: {
      color: colors.text1,
      fontSize: 28,
      fontWeight: "900",
      lineHeight: 31,
    },
    scoreLabel: {
      color: colors.text2,
      fontSize: 11,
      fontWeight: "800",
      textTransform: "uppercase",
      marginTop: 1,
    },
    healthCopy: {
      flex: 1,
    },
    healthTitle: {
      color: colors.text1,
      fontSize: 18,
      fontWeight: "900",
    },
    healthText: {
      color: colors.text2,
      fontSize: 14,
      lineHeight: 20,
      marginTop: 5,
    },
    progressTrack: {
      height: 8,
      borderRadius: 999,
      overflow: "hidden",
      backgroundColor: colors.surface3,
    },
    progressFill: {
      height: "100%",
      borderRadius: 999,
      backgroundColor: colors.accent1,
    },
    metricRow: {
      flexDirection: "row",
      gap: 10,
    },
    metricItem: {
      flex: 1,
      minHeight: 96,
      borderRadius: 18,
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      justifyContent: "space-between",
    },
    metricIcon: {
      width: 30,
      height: 30,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: softAccent,
    },
    metricLabel: {
      color: colors.text3,
      fontSize: 10,
      fontWeight: "800",
      textTransform: "uppercase",
    },
    metricValue: {
      color: colors.text1,
      fontSize: 17,
      fontWeight: "900",
    },
    addButton: {
      minHeight: 54,
      borderRadius: 18,
      backgroundColor: colors.accent1,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
    },
    addButtonText: {
      color: colors.bg,
      fontSize: 15,
      fontWeight: "900",
    },
  });
};
