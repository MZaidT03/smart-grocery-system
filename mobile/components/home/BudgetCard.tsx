import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useTheme } from "@/context/theme";
import { ReceiptText, Wallet } from "lucide-react-native";

type BudgetCardProps = {
  budget?: {
    status?: string;
    limit?: number;
    spent?: number;
    remaining?: number;
    percent?: number;
    color?: string;
    advice?: string;
  } | null;
  budgetLimit: string;
  onBudgetLimitChange: (value: string) => void;
  onSaveBudget: () => void;
};

const formatRupees = (value?: number) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "Rs 0";
  }
  return `Rs ${Math.round(value).toLocaleString("en-PK")}`;
};

export default function BudgetCard({
  budget,
  budgetLimit,
  onBudgetLimitChange,
  onSaveBudget,
}: BudgetCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const isActive = budget?.status === "active";
  const percent = isActive
    ? Math.min(100, Math.max(0, Math.round(budget?.percent ?? 0)))
    : 0;
  const accent = getBudgetAccent(budget?.color, colors);
  const activeTone =
    colors.bg === "#000000" ? "rgba(74, 222, 128, 0.14)" : "#eaf7ef";
  const remainingLabel = formatRupees(budget?.remaining);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <View style={styles.titleIcon}>
            <Wallet size={18} color={colors.accent1} />
          </View>
          <View>
            <Text style={styles.eyebrow}>Budget</Text>
            <Text style={styles.title}>Monthly guard</Text>
          </View>
        </View>
        <View
          style={[
            styles.statusPill,
            { backgroundColor: isActive ? activeTone : colors.surface2 },
          ]}
        >
          <Text style={styles.statusText}>{isActive ? "Active" : "Not set"}</Text>
        </View>
      </View>

      {isActive ? (
        <>
          <View style={styles.remainingBlock}>
            <Text style={styles.remainingLabel}>Remaining this month</Text>
            <Text style={styles.remainingValue}>{remainingLabel}</Text>
          </View>

          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                { width: `${percent}%`, backgroundColor: accent },
              ]}
            />
          </View>

          <View style={styles.metricRow}>
            <View style={styles.metricBlock}>
              <Text style={styles.metricLabel}>Limit</Text>
              <Text style={styles.metricValue}>{formatRupees(budget?.limit)}</Text>
            </View>
            <View style={styles.metricBlock}>
              <Text style={styles.metricLabel}>Spent</Text>
              <Text style={styles.metricValue}>{formatRupees(budget?.spent)}</Text>
            </View>
            <View style={styles.metricBlock}>
              <Text style={styles.metricLabel}>Used</Text>
              <Text style={styles.metricValue}>{percent}%</Text>
            </View>
          </View>

          {!!budget?.advice && <Text style={styles.meta}>{budget.advice}</Text>}
        </>
      ) : (
        <View style={styles.setupPanel}>
          <View style={styles.setupIcon}>
            <ReceiptText size={20} color={colors.accent1} />
          </View>
          <View style={styles.setupCopy}>
            <Text style={styles.setupTitle}>Set a monthly spending target</Text>
            <Text style={styles.setupBody}>
              Keep grocery plans aligned with what you want to spend.
            </Text>
          </View>
          <TextInput
            value={budgetLimit}
            onChangeText={onBudgetLimitChange}
            placeholder="Enter limit, e.g. 5000"
            placeholderTextColor={colors.text3}
            keyboardType="number-pad"
            style={styles.input}
          />
          <Pressable style={styles.primaryButton} onPress={onSaveBudget}>
            <Text style={styles.primaryButtonText}>Save budget</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const getBudgetAccent = (color: string | undefined, colors: any) => {
  if (color === "red") return colors.danger;
  if (color === "orange") return colors.warning;
  return colors.accent1;
};

const createStyles = (colors: any) => {
  const isDark = colors.bg === "#000000";
  const softAccent = isDark ? "rgba(74, 222, 128, 0.14)" : "#eaf7ef";

  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface1,
      borderRadius: 24,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 16,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    titleWrap: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    titleIcon: {
      width: 42,
      height: 42,
      borderRadius: 15,
      backgroundColor: softAccent,
      alignItems: "center",
      justifyContent: "center",
    },
    eyebrow: {
      color: colors.accent1,
      fontSize: 11,
      fontWeight: "900",
      textTransform: "uppercase",
    },
    title: {
      color: colors.text1,
      fontWeight: "900",
      fontSize: 18,
      marginTop: 2,
    },
    statusPill: {
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statusText: {
      color: colors.text1,
      fontSize: 10,
      fontWeight: "900",
      textTransform: "uppercase",
    },
    remainingBlock: {
      gap: 3,
    },
    remainingLabel: {
      color: colors.text2,
      fontSize: 13,
      fontWeight: "700",
    },
    remainingValue: {
      color: colors.text1,
      fontSize: 32,
      fontWeight: "900",
      lineHeight: 36,
    },
    track: {
      height: 9,
      backgroundColor: colors.surface3,
      borderRadius: 999,
      overflow: "hidden",
    },
    fill: {
      height: "100%",
      borderRadius: 999,
    },
    metricRow: {
      flexDirection: "row",
      gap: 10,
    },
    metricBlock: {
      flex: 1,
      backgroundColor: colors.bg,
      borderRadius: 16,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    metricLabel: {
      color: colors.text3,
      fontSize: 10,
      textTransform: "uppercase",
      fontWeight: "800",
    },
    metricValue: {
      color: colors.text1,
      fontWeight: "900",
      fontSize: 13,
      marginTop: 5,
    },
    meta: {
      color: colors.text2,
      fontSize: 13,
      lineHeight: 19,
    },
    setupPanel: {
      gap: 12,
    },
    setupIcon: {
      width: 44,
      height: 44,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: softAccent,
    },
    setupCopy: {
      gap: 4,
    },
    setupTitle: {
      color: colors.text1,
      fontSize: 16,
      fontWeight: "900",
    },
    setupBody: {
      color: colors.text2,
      fontSize: 13,
      lineHeight: 19,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: colors.bg,
      color: colors.text1,
      fontSize: 15,
    },
    primaryButton: {
      backgroundColor: colors.accent1,
      borderRadius: 16,
      paddingVertical: 15,
      alignItems: "center",
    },
    primaryButtonText: {
      color: colors.bg,
      fontSize: 15,
      fontWeight: "900",
    },
  });
};
