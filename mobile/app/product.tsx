import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { 
  ChevronLeft, 
  Trash2, 
  Edit3, 
  PlusCircle, 
  MinusCircle,
  Calendar,
  Clock,
  Banknote,
  PackageCheck,
  Activity
} from "lucide-react-native";
import { API_BASE_URL } from "@/constants/api";
import { useTheme } from "@/context/theme";

export default function ProductScreen() {
  // Pull the pure black/white/green minimal colors directly from the context
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const router = useRouter();
  const params = useLocalSearchParams();
  const userId = Array.isArray(params.userId)
    ? params.userId[0]
    : params.userId;
  const productId = Array.isArray(params.productId)
    ? params.productId[0]
    : params.productId;

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);
  const [showConsume, setShowConsume] = useState(false);
  const [showRestock, setShowRestock] = useState(false);
  const [consumeAmount, setConsumeAmount] = useState("");
  const [consumeRateQty, setConsumeRateQty] = useState("");
  const [consumeRateDays, setConsumeRateDays] = useState("");
  const [restockQty, setRestockQty] = useState("");
  const [restockPrice, setRestockPrice] = useState("");
  const [restockExpiryDays, setRestockExpiryDays] = useState("");
  
  const [showEdit, setShowEdit] = useState(false);
  const [editUnit, setEditUnit] = useState("");
  const [editUsageQty, setEditUsageQty] = useState("");
  const [editUsageDays, setEditUsageDays] = useState("");

  const load = async () => {
    if (!userId || !productId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/products?userId=${userId}`);
      const data = await res.json();
      const found = Array.isArray(data)
        ? data.find((item) => String(item.id) === String(productId))
        : null;
      setProduct(found || null);
    } catch (err) {
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [userId, productId]);

  // Updated tone logic to map directly to your minimal theme values
  const tone = useMemo(() => {
    if (!product) {
      return { label: "", fg: colors.text2, bg: colors.surface2 };
    }
    if (product.days_left === -1 || product.days_left === undefined) {
      return { label: "Unknown", fg: colors.text2, bg: colors.surface2 };
    }
    if (product.days_left < 3) {
      return { label: "Low", fg: colors.danger, bg: colors.surface2 };
    }
    if (product.days_left < 7) {
      return { label: "Watch", fg: colors.warning, bg: colors.surface2 };
    }
    return { label: "OK", fg: colors.accent1, bg: colors.surface2 };
  }, [colors, product]);

  const handleConsume = async () => {
    if (!product || !userId || !consumeAmount) {
      Alert.alert("Missing amount", "Enter how much you consumed.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/consume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number.parseFloat(consumeAmount || "0"),
          productId: product.id,
          userId,
          newRateQty: consumeRateQty ? Number.parseFloat(consumeRateQty) : null,
          newRateDays: consumeRateDays
            ? Number.parseFloat(consumeRateDays)
            : null,
        }),
      });
      const data = await res.json();
      if (!data?.success) {
        Alert.alert("Consume failed", data?.message || "Try again.");
        return;
      }
      setConsumeAmount("");
      setConsumeRateQty("");
      setConsumeRateDays("");
      setShowConsume(false);
      router.back();
    } catch (err) {
      Alert.alert("Consume failed", "Server error. Try again.");
    }
  };

  const handleRestock = async () => {
    if (!product || !userId || !restockQty || !restockPrice) {
      Alert.alert("Missing fields", "Quantity and price are required.");
      return;
    }
    try {
      const res = await fetch(
        `${API_BASE_URL}/products/${product.id}/restock`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            added_quantity: Number.parseFloat(restockQty || "0"),
            new_price: Number.parseFloat(restockPrice || "0"),
            new_expiry_days: restockExpiryDays
              ? Number.parseFloat(restockExpiryDays)
              : undefined,
          }),
        },
      );
      const data = await res.json();
      if (!data?.success) {
        Alert.alert("Restock failed", data?.error || "Try again.");
        return;
      }
      setRestockQty("");
      setRestockPrice("");
      setRestockExpiryDays("");
      setShowRestock(false);
      router.back();
    } catch (err) {
      Alert.alert("Restock failed", "Server error. Try again.");
    }
  };

  const openEditModal = () => {
    if (product) {
      // Find matching case or fallback to the exact DB value
      const dbUnit = product.unit || "Pcs";
      const exactMatch = ["Pcs", "Kg", "g", "Ltr", "ml", "Pack", "Bottle", "Other"].find(
        (u) => u.toLowerCase() === dbUnit.toLowerCase()
      );
      setEditUnit(exactMatch || dbUnit);
      setEditUsageQty(product.usage_freq_qty ? String(product.usage_freq_qty) : "");
      setEditUsageDays(product.usage_freq_days ? String(product.usage_freq_days) : "");
      setShowEdit(true);
    }
  };

  const handleEdit = async () => {
    if (!product || !userId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unit: editUnit || undefined,
          usageQty: editUsageQty ? Number.parseFloat(editUsageQty) : undefined,
          usageDays: editUsageDays ? Number.parseFloat(editUsageDays) : undefined,
        }),
      });
      const data = await res.json();
      if (!data?.success) {
        Alert.alert("Update failed", data?.error || "Try again.");
        return;
      }
      setShowEdit(false);
      load(); // Reload product data to reflect changes
    } catch (err) {
      Alert.alert("Update failed", "Server error. Try again.");
    }
  };

  const handleDelete = () => {
    if (!product) return;
    Alert.alert("Remove item?", "This will hide the product.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await fetch(`${API_BASE_URL}/products/${product.id}`, {
              method: "DELETE",
            });
            router.back();
          } catch (err) {
            Alert.alert("Delete failed", "Server error. Try again.");
          }
        },
      },
    ]);
  };

  const { width } = Dimensions.get('window');
  const IMAGE_HEIGHT = 280;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={styles.iconBackButton}>
          <ChevronLeft size={24} color={colors.text1} />
        </Pressable>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.accent1} />
        </View>
      ) : !product ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Product not found</Text>
          <Text style={styles.emptyBody}>Go back and try again.</Text>
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, paddingTop: 10 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.mainCard}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{product.name}</Text>
                  <Text style={styles.cardSubtitle}>{product.category}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: tone.bg }]}>
                  <Text style={[styles.statusText, { color: tone.fg }]}>
                    {tone.label}
                  </Text>
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <View style={styles.statIconWrap}>
                    <PackageCheck size={18} color={colors.accent1} />
                  </View>
                  <Text style={styles.statValue}>{product.quantity}</Text>
                  <Text style={styles.statLabel}>{product.unit}</Text>
                </View>

                <View style={styles.statBox}>
                  <View style={styles.statIconWrap}>
                    <Clock size={18} color={colors.accent1} />
                  </View>
                  <Text style={styles.statValue}>
                    {product.days_left === -1 ? "--" : product.days_left}
                  </Text>
                  <Text style={styles.statLabel}>Days left</Text>
                </View>

                <View style={styles.statBox}>
                  <View style={styles.statIconWrap}>
                    <Banknote size={18} color={colors.accent1} />
                  </View>
                  <Text style={styles.statValue}>Rs {product.price}</Text>
                  <Text style={styles.statLabel}>Price/Unit</Text>
                </View>

                <View style={styles.statBox}>
                  <View style={styles.statIconWrap}>
                    <Calendar size={18} color={colors.accent1} />
                  </View>
                  <Text style={styles.statValue}>
                    {product.expiry_days === 999 ? "--" : product.expiry_days}
                  </Text>
                  <Text style={styles.statLabel}>Exp. Days</Text>
                </View>

                <View style={[styles.statBox, { width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View style={[styles.statIconWrap, { marginBottom: 0, marginRight: 12 }]}>
                      <Activity size={18} color={colors.accent1} />
                    </View>
                    <Text style={[styles.statLabel, { fontSize: 14 }]}>Consumption Rate</Text>
                  </View>
                  <Text style={styles.statValue}>
                    {product.usage_freq_qty && product.usage_freq_days
                      ? `${product.usage_freq_qty} ${product.unit} / ${product.usage_freq_days}d`
                      : "--"}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.actionsSection}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              
              <View style={styles.actionGrid}>
                <Pressable style={styles.actionCard} onPress={() => setShowConsume(true)}>
                  <View style={[styles.actionIconBox, { backgroundColor: colors.surface2 }]}>
                    <MinusCircle size={22} color={colors.accent1} />
                  </View>
                  <Text style={styles.actionLabel}>Consume</Text>
                </Pressable>

                <Pressable style={styles.actionCard} onPress={() => setShowRestock(true)}>
                  <View style={[styles.actionIconBox, { backgroundColor: colors.surface2 }]}>
                    <PlusCircle size={22} color={colors.accent1} />
                  </View>
                  <Text style={styles.actionLabel}>Restock</Text>
                </Pressable>

                <Pressable style={styles.actionCard} onPress={openEditModal}>
                  <View style={[styles.actionIconBox, { backgroundColor: colors.surface2 }]}>
                    <Edit3 size={22} color={colors.text1} />
                  </View>
                  <Text style={styles.actionLabel}>Edit</Text>
                </Pressable>

                <Pressable style={styles.actionCard} onPress={handleDelete}>
                  <View style={[styles.actionIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                    <Trash2 size={22} color={colors.danger} />
                  </View>
                  <Text style={[styles.actionLabel, { color: colors.danger }]}>Delete</Text>
                </Pressable>
              </View>
            </View>
        </ScrollView>
      )}

      <Modal visible={showEdit} transparent animationType="slide">
        <KeyboardAvoidingView 
          style={styles.modalBackdrop} 
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit settings</Text>
            <Text style={styles.modalLabel}>{product?.name}</Text>
            
            <Text style={styles.label}>Consumption Unit</Text>
            <View style={styles.unitChipContainer}>
              {["Pcs", "Kg", "g", "Ltr", "ml", "Pack", "Bottle", "Other"].map((u) => {
                const isSelected = editUnit?.toLowerCase() === u.toLowerCase();
                return (
                  <Pressable
                    key={u}
                    onPress={() => setEditUnit(u)}
                    style={[
                      styles.unitChip,
                      isSelected && { backgroundColor: colors.accent1, borderColor: colors.accent1 }
                    ]}
                  >
                    <Text style={[styles.unitChipText, isSelected && { color: colors.bg }]}>
                      {u}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.label}>Usage Quantity</Text>
            <TextInput
              value={editUsageQty}
              onChangeText={setEditUsageQty}
              placeholder="e.g. 1"
              placeholderTextColor={colors.text3}
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <Text style={styles.label}>Per Days</Text>
            <TextInput
              value={editUsageDays}
              onChangeText={setEditUsageDays}
              placeholder="e.g. 7"
              placeholderTextColor={colors.text3}
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <View style={styles.modalActions}>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => setShowEdit(false)}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.primaryButton} onPress={handleEdit}>
                <Text style={styles.primaryButtonText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showConsume} transparent animationType="slide">
        <KeyboardAvoidingView 
          style={styles.modalBackdrop} 
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Consume item</Text>
            <Text style={styles.modalLabel}>{product?.name}</Text>
            <TextInput
              value={consumeAmount}
              onChangeText={setConsumeAmount}
              placeholder="Amount consumed"
              placeholderTextColor={colors.text3}
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <TextInput
              value={consumeRateQty}
              onChangeText={setConsumeRateQty}
              placeholder="New usage qty (optional)"
              placeholderTextColor={colors.text3}
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <TextInput
              value={consumeRateDays}
              onChangeText={setConsumeRateDays}
              placeholder="New usage days (optional)"
              placeholderTextColor={colors.text3}
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <View style={styles.modalActions}>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => setShowConsume(false)}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.primaryButton} onPress={handleConsume}>
                <Text style={styles.primaryButtonText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showRestock} transparent animationType="slide">
        <KeyboardAvoidingView 
          style={styles.modalBackdrop} 
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Restock item</Text>
            <Text style={styles.modalLabel}>{product?.name}</Text>
            <TextInput
              value={restockQty}
              onChangeText={setRestockQty}
              placeholder="Added quantity"
              placeholderTextColor={colors.text3}
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <TextInput
              value={restockPrice}
              onChangeText={setRestockPrice}
              placeholder="New price per unit"
              placeholderTextColor={colors.text3}
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <TextInput
              value={restockExpiryDays}
              onChangeText={setRestockExpiryDays}
              placeholder="Expiry days (optional)"
              placeholderTextColor={colors.text3}
              keyboardType="number-pad"
              style={styles.input}
            />
            <View style={styles.modalActions}>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => setShowRestock(false)}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.primaryButton} onPress={handleRestock}>
                <Text style={styles.primaryButtonText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// Map everything to the new dynamic colors context
const createStyles = (colors: any) => {
  const isDark = colors.bg === "#000000";
  const shadowColor = isDark ? "#000000" : "#102116";

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    safeArea: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    headerRow: {
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    headerSpacer: {
      width: 44, // Matches back button width to center anything if needed
    },
    iconBackButton: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: colors.surface1,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    mainCard: {
      backgroundColor: colors.surface1,
      borderRadius: 24,
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 26,
    },
    cardTitle: {
      fontSize: 28,
      fontWeight: "900",
      color: colors.text1,
      letterSpacing: -0.5,
      marginBottom: 4,
    },
    cardSubtitle: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.text3,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    statusBadge: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
    },
    statusText: {
      fontSize: 13,
      fontWeight: "800",
      textTransform: "uppercase",
    },
    statsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    statBox: {
      width: "48%",
      backgroundColor: colors.bg,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: isDark ? "rgba(74, 222, 128, 0.14)" : "#eaf7ef",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    statValue: {
      fontSize: 18,
      fontWeight: "900",
      color: colors.text1,
      marginBottom: 2,
    },
    statLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.text3,
    },
    actionsSection: {
      paddingHorizontal: 24,
      marginTop: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "900",
      color: colors.text1,
      marginBottom: 16,
    },
    actionGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    actionCard: {
      width: "48%",
      backgroundColor: colors.surface1,
      borderRadius: 20,
      padding: 16,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
      gap: 10,
    },
    actionIconBox: {
      width: 48,
      height: 48,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    actionLabel: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text1,
    },
    primaryButton: {
      backgroundColor: colors.accent1,
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: 16,
      alignItems: "center",
    },
    primaryButtonText: {
      color: colors.bg,
      fontSize: 15,
      fontWeight: "800",
    },
    secondaryButton: {
      backgroundColor: colors.bg,
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: 16,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    secondaryButtonText: {
      color: colors.text1,
      fontSize: 15,
      fontWeight: "800",
    },
    loadingWrap: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyState: {
      alignItems: "center",
      paddingTop: 80,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: "900",
      color: colors.text1,
    },
    emptyBody: {
      color: colors.text2,
      marginTop: 8,
      fontSize: 15,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "center",
      padding: 20,
    },
    modalCard: {
      backgroundColor: colors.surface1,
      borderRadius: 24,
      padding: 24,
      gap: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "900",
      color: colors.text1,
    },
    modalLabel: {
      color: colors.text2,
      fontSize: 14,
      fontWeight: "600",
      marginBottom: 6,
    },
    modalActions: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
      marginTop: 12,
    },
    label: {
      color: colors.text2,
      fontSize: 13,
      fontWeight: "800",
      textTransform: "uppercase",
      marginTop: 4,
      marginBottom: -6,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: colors.bg,
      color: colors.text1,
      fontSize: 16,
      fontWeight: "600",
    },
    unitChipContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 6,
      marginBottom: 8,
    },
    unitChip: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bg,
    },
    unitChipText: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text1,
    },
  });
};
