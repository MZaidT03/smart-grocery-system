import { API_BASE_URL } from "@/constants/api";
import { useTheme } from "@/context/theme";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
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
  ArrowLeft,
  Sparkles,
  CalendarDays,
  Wallet,
  AlertTriangle,
  BadgeAlert,
  CheckCircle2,
  ShoppingCart,
  Circle,
  PackagePlus
} from "lucide-react-native";

type Recommendation = {
  item_name: string;
  category: string;
  current_stock: number;
  unit: string;
  average_daily_consumption: number;
  required_quantity: number;
  quantity_to_buy: number;
  latest_price: number;
  estimated_cost: number;
  priority: "High" | "Medium" | "Low";
  reason: string;
};

type SmartResponse = {
  success: boolean;
  days?: number;
  budget?: number;
  totalEstimatedCost?: number;
  recommendations?: Recommendation[];
  summary?: string;
  budgetWarning?: boolean;
  error?: string;
};

export default function SmartRecommendationScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();

  const params = useLocalSearchParams();
  const userId = Array.isArray(params.userId) ? params.userId[0] : params.userId;

  const [days, setDays] = useState("7");
  const [budget, setBudget] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [result, setResult] = useState<SmartResponse | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  const handleGenerate = async () => {
    if (!userId) return;

    const parsedDays = Number.parseFloat(days || "7");
    const parsedBudget = Number.parseFloat(budget || "999999");

    if (!Number.isFinite(parsedDays) || parsedDays <= 0) {
      Alert.alert("Invalid input", "Please enter a valid number of days.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(`${API_BASE_URL}/smart-shopping-recommendation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          days: parsedDays,
          budget: parsedBudget,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        Alert.alert("Failed to generate", data.error || "Please try again.");
      } else {
        setResult(data);
        setSelectedIndices(new Set(data.recommendations?.map((_: any, i: number) => i) || []));
      }
    } catch (err) {
      Alert.alert("Error", "Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSelected = async () => {
    if (!userId || selectedIndices.size === 0) return;
    setAdding(true);
    
    const selectedItems = result?.recommendations?.filter((_, i) => selectedIndices.has(i)) || [];
    
    try {
      await Promise.all(selectedItems.map(item => 
        fetch(`${API_BASE_URL}/products`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            name: item.item_name,
            unit: item.unit,
            quantity: item.quantity_to_buy,
            category: item.category,
            usageQty: item.average_daily_consumption > 0 ? item.average_daily_consumption : 1,
            usageDays: item.average_daily_consumption > 0 ? 1 : 7,
            price: item.latest_price || 0,
            shelfLife: 7
          })
        })
      ));
      
      Alert.alert("Success", `${selectedItems.length} items added to your inventory!`);
      router.back();
    } catch (err) {
      Alert.alert("Error", "Could not add items. Try again.");
    } finally {
      setAdding(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return colors.error;
      case "Medium": return colors.warning;
      case "Low": return colors.success;
      default: return colors.text3;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}>
          <ArrowLeft size={22} color={colors.text1} />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerEyebrow}>AI Powered</Text>
          <Text style={styles.title}>Smart Recommendation</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!result ? (
          <View style={styles.formCard}>
            <View style={styles.heroIconWrap}>
              <View style={styles.heroIcon}>
                <Sparkles size={28} color={colors.accent1} />
              </View>
            </View>

            <Text style={styles.formTitle}>Plan your shopping</Text>
            <Text style={styles.formBody}>
              Tell us how many days you are shopping for and your maximum budget. We will analyze your consumption history and stock to build the perfect list.
            </Text>

            <View style={styles.inputWrap}>
              <View style={styles.labelRow}>
                <CalendarDays size={16} color={colors.text3} />
                <Text style={styles.inputLabel}>Number of days</Text>
              </View>
              <TextInput
                style={styles.textInput}
                value={days}
                onChangeText={setDays}
                keyboardType="numeric"
                placeholder="7"
                placeholderTextColor={colors.text3}
              />
            </View>

            <View style={styles.inputWrap}>
              <View style={styles.labelRow}>
                <Wallet size={16} color={colors.text3} />
                <Text style={styles.inputLabel}>Maximum Budget (Optional)</Text>
              </View>
              <TextInput
                style={styles.textInput}
                value={budget}
                onChangeText={setBudget}
                keyboardType="numeric"
                placeholder="e.g. 5000"
                placeholderTextColor={colors.text3}
              />
            </View>

            <Pressable
              style={[styles.primaryButton, loading && styles.disabledButton]}
              onPress={handleGenerate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.bg} />
              ) : (
                <ShoppingCart size={20} color={colors.bg} />
              )}
              <Text style={styles.primaryButtonText}>
                {loading ? "Analyzing Data..." : "Generate Recommendations"}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.resultsContainer}>
            <View style={styles.summaryCard}>
              <View style={styles.aiHeader}>
                <Sparkles size={20} color={colors.accent1} />
                <Text style={styles.aiTitle}>AI Summary</Text>
              </View>
              <Text style={styles.aiSummaryText}>{result.summary}</Text>
            </View>

            {result.budgetWarning && (
              <View style={styles.warningCard}>
                <AlertTriangle size={20} color={colors.warning} />
                <View style={styles.warningTextWrap}>
                  <Text style={styles.warningTitle}>Budget Exceeded</Text>
                  <Text style={styles.warningBody}>
                    Your required items cost more than your budget. We've reduced quantities of some items to fit within Rs. {result.budget}.
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Total Estimated Cost</Text>
                <Text style={styles.statValue}>Rs. {Math.round(result.totalEstimatedCost || 0).toLocaleString()}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Items Needed</Text>
                <Text style={styles.statValue}>{result.recommendations?.length || 0}</Text>
              </View>
            </View>

            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Recommended Items</Text>
              <Pressable style={styles.resetButton} onPress={() => setResult(null)}>
                <Text style={styles.resetButtonText}>Recalculate</Text>
              </Pressable>
            </View>

            {result.recommendations?.length === 0 ? (
              <View style={styles.emptyState}>
                <CheckCircle2 size={40} color={colors.success} />
                <Text style={styles.emptyTitle}>You're fully stocked!</Text>
                <Text style={styles.emptyBody}>Based on your consumption, your pantry has everything you need for the next {result.days} days.</Text>
              </View>
            ) : (
              <>
                {result.recommendations?.map((item, index) => (
                  <Pressable 
                    key={index} 
                    style={[styles.itemCard, selectedIndices.has(index) && { borderColor: colors.accent1, backgroundColor: colors.accent1 + "05" }]}
                    onPress={() => {
                      const next = new Set(selectedIndices);
                      if (next.has(index)) next.delete(index);
                      else next.add(index);
                      setSelectedIndices(next);
                    }}
                  >
                    <View style={styles.itemHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        {selectedIndices.has(index) ? 
                          <CheckCircle2 size={20} color={colors.accent1} /> : 
                          <Circle size={20} color={colors.text3} />
                        }
                        <Text style={styles.itemName}>{item.item_name}</Text>
                      </View>
                      <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) + '20' }]}>
                        <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
                          {item.priority}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.itemCategory}>{item.category}</Text>

                    <View style={styles.itemDataRow}>
                      <View style={styles.dataCol}>
                        <Text style={styles.dataLabel}>Current Stock</Text>
                        <Text style={styles.dataValue}>{item.current_stock} {item.unit}</Text>
                      </View>
                      <View style={styles.dataCol}>
                        <Text style={styles.dataLabel}>Need to Buy</Text>
                        <Text style={[styles.dataValue, { color: colors.accent1, fontWeight: "700" }]}>
                          {item.quantity_to_buy} {item.unit}
                        </Text>
                      </View>
                      <View style={styles.dataCol}>
                        <Text style={styles.dataLabel}>Est. Cost</Text>
                        <Text style={styles.dataValue}>Rs. {Math.round(item.estimated_cost)}</Text>
                      </View>
                    </View>

                    <View style={styles.reasonBox}>
                      <BadgeAlert size={14} color={colors.text3} />
                      <Text style={styles.reasonText}>{item.reason}</Text>
                    </View>
                  </Pressable>
                ))}

                {(result.recommendations?.length ?? 0) > 0 && (
                  <Pressable
                    style={[styles.primaryButton, (selectedIndices.size === 0 || adding) && styles.disabledButton]}
                    onPress={handleAddSelected}
                    disabled={selectedIndices.size === 0 || adding}
                  >
                    {adding ? (
                      <ActivityIndicator size="small" color={colors.bg} />
                    ) : (
                      <PackagePlus size={20} color={colors.bg} />
                    )}
                    <Text style={styles.primaryButtonText}>
                      {adding ? "Adding to Inventory..." : `Add ${selectedIndices.size} Items to Inventory`}
                    </Text>
                  </Pressable>
                )}
              </>
            )}
          </View>
        )}
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.bg },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    headerCenter: { alignItems: "center" },
    headerEyebrow: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.accent1,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    title: { fontSize: 16, fontWeight: "700", color: colors.text1, marginTop: 2 },
    content: { padding: 16, paddingBottom: 40 },

    formCard: {
      backgroundColor: colors.surface,
      padding: 24,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      marginTop: 20,
    },
    heroIconWrap: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: colors.accent1 + "15",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
    },
    heroIcon: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: colors.accent1 + "25",
      alignItems: "center",
      justifyContent: "center",
    },
    formTitle: { fontSize: 22, fontWeight: "800", color: colors.text1, marginBottom: 8 },
    formBody: {
      fontSize: 14,
      color: colors.text2,
      textAlign: "center",
      lineHeight: 22,
      marginBottom: 24,
    },
    inputWrap: { width: "100%", marginBottom: 20 },
    labelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
    inputLabel: { fontSize: 13, fontWeight: "600", color: colors.text2 },
    textInput: {
      width: "100%",
      backgroundColor: colors.bg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.text1,
      fontSize: 16,
      padding: 16,
    },
    primaryButton: {
      width: "100%",
      backgroundColor: colors.accent1,
      borderRadius: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      gap: 10,
      marginTop: 10,
    },
    disabledButton: { opacity: 0.7 },
    primaryButtonText: { color: colors.bg, fontSize: 16, fontWeight: "700" },

    resultsContainer: { gap: 16 },
    summaryCard: {
      backgroundColor: colors.accent1 + "15",
      padding: 20,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.accent1 + "30",
    },
    aiHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
    aiTitle: { fontSize: 16, fontWeight: "700", color: colors.accent1 },
    aiSummaryText: { fontSize: 15, color: colors.text1, lineHeight: 22 },

    warningCard: {
      flexDirection: "row",
      backgroundColor: colors.warning + "15",
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.warning + "30",
      gap: 12,
    },
    warningTextWrap: { flex: 1 },
    warningTitle: { fontSize: 15, fontWeight: "700", color: colors.warning, marginBottom: 4 },
    warningBody: { fontSize: 13, color: colors.text1, lineHeight: 18 },

    statsRow: { flexDirection: "row", gap: 12 },
    statBox: {
      flex: 1,
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
    },
    statLabel: { fontSize: 12, color: colors.text3, fontWeight: "600", marginBottom: 4 },
    statValue: { fontSize: 18, fontWeight: "800", color: colors.text1 },

    listHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 8,
      marginBottom: 8,
    },
    listTitle: { fontSize: 18, fontWeight: "700", color: colors.text1 },
    resetButton: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
    resetButtonText: { fontSize: 13, fontWeight: "600", color: colors.text2 },

    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      padding: 40,
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    emptyTitle: { fontSize: 18, fontWeight: "700", color: colors.text1, marginTop: 16, marginBottom: 8 },
    emptyBody: { fontSize: 14, color: colors.text2, textAlign: "center", lineHeight: 20 },

    itemCard: {
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
    },
    itemHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
    itemName: { fontSize: 17, fontWeight: "700", color: colors.text1 },
    itemCategory: { fontSize: 13, color: colors.text3, marginBottom: 16 },
    priorityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    priorityText: { fontSize: 11, fontWeight: "800", textTransform: "uppercase" },

    itemDataRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
    dataCol: {},
    dataLabel: { fontSize: 11, color: colors.text3, fontWeight: "600", marginBottom: 4, textTransform: "uppercase" },
    dataValue: { fontSize: 14, fontWeight: "600", color: colors.text1 },

    reasonBox: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
      backgroundColor: colors.bg,
      padding: 12,
      borderRadius: 10,
    },
    reasonText: { fontSize: 12, color: colors.text2, flex: 1, lineHeight: 18 },
  });
