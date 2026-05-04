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
} from "react-native";
import { API_BASE_URL } from "@/constants/api";

export default function ProductScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const userId = Array.isArray(params.userId)
    ? params.userId[0]
    : params.userId;
  const productId = Array.isArray(params.productId)
    ? params.productId[0]
    : params.productId;

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [showConsume, setShowConsume] = useState(false);
  const [showRestock, setShowRestock] = useState(false);
  const [consumeAmount, setConsumeAmount] = useState("");
  const [consumeRateQty, setConsumeRateQty] = useState("");
  const [consumeRateDays, setConsumeRateDays] = useState("");
  const [restockQty, setRestockQty] = useState("");
  const [restockPrice, setRestockPrice] = useState("");
  const [restockExpiryDays, setRestockExpiryDays] = useState("");

  useEffect(() => {
    if (!userId || !productId) return;
    const load = async () => {
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
    load();
  }, [userId, productId]);

  const tone = useMemo(() => {
    if (!product) return { label: "", fg: "#6B5E55", bg: "#EFE7DC" };
    if (product.days_left === -1 || product.days_left === undefined) {
      return { label: "Unknown", fg: "#6B5E55", bg: "#EFE7DC" };
    }
    if (product.days_left < 3) {
      return { label: "Low", fg: "#B42318", bg: "#FEE4E2" };
    }
    if (product.days_left < 7) {
      return { label: "Watch", fg: "#B54708", bg: "#FFE7D0" };
    }
    return { label: "OK", fg: "#0E3A32", bg: "#DDF3E4" };
  }, [product]);

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
        <Text style={styles.title}>Product</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#0E3A32" />
        </View>
      ) : !product ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Product not found</Text>
          <Text style={styles.emptyBody}>Go back and try again.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{product.name}</Text>
            <Text style={styles.cardSubtitle}>{product.category}</Text>
            <View style={styles.pillRow}>
              <View style={styles.pill}>
                <Text style={styles.pillText}>
                  {product.quantity} {product.unit}
                </Text>
              </View>
              <View style={[styles.pill, { backgroundColor: tone.bg }]}>
                <Text style={[styles.pillText, { color: tone.fg }]}>
                  {tone.label}
                </Text>
              </View>
            </View>
            <Text style={styles.metaText}>Price: Rs {product.price}</Text>
            <Text style={styles.metaText}>
              Days left:{" "}
              {product.days_left === -1 ? "Unknown" : product.days_left}
            </Text>
            <Text style={styles.metaText}>
              Expiry:{" "}
              {product.expiry_days === 999 ? "Unknown" : product.expiry_days}
            </Text>
          </View>

          <View style={styles.actionsRow}>
            <Pressable
              style={styles.secondaryButton}
              onPress={() => setShowConsume(true)}
            >
              <Text style={styles.secondaryButtonText}>Consume</Text>
            </Pressable>
            <Pressable
              style={styles.secondaryButton}
              onPress={() => setShowRestock(true)}
            >
              <Text style={styles.secondaryButtonText}>Restock</Text>
            </Pressable>
            <Pressable style={styles.dangerButton} onPress={handleDelete}>
              <Text style={styles.dangerButtonText}>Delete</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}

      <Modal visible={showConsume} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Consume item</Text>
            <Text style={styles.modalLabel}>{product?.name}</Text>
            <TextInput
              value={consumeAmount}
              onChangeText={setConsumeAmount}
              placeholder="Amount consumed"
              placeholderTextColor="#9C9085"
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <TextInput
              value={consumeRateQty}
              onChangeText={setConsumeRateQty}
              placeholder="New usage qty (optional)"
              placeholderTextColor="#9C9085"
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <TextInput
              value={consumeRateDays}
              onChangeText={setConsumeRateDays}
              placeholder="New usage days (optional)"
              placeholderTextColor="#9C9085"
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
        </View>
      </Modal>

      <Modal visible={showRestock} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Restock item</Text>
            <Text style={styles.modalLabel}>{product?.name}</Text>
            <TextInput
              value={restockQty}
              onChangeText={setRestockQty}
              placeholder="Added quantity"
              placeholderTextColor="#9C9085"
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <TextInput
              value={restockPrice}
              onChangeText={setRestockPrice}
              placeholder="New price per unit"
              placeholderTextColor="#9C9085"
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <TextInput
              value={restockExpiryDays}
              onChangeText={setRestockExpiryDays}
              placeholder="Expiry days (optional)"
              placeholderTextColor="#9C9085"
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
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F6F1E8",
  },
  headerRow: {
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0D6CC",
  },
  backButtonText: {
    color: "#1F2A24",
    fontWeight: "600",
  },
  headerSpacer: {
    width: 50,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2C2C2C",
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    gap: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E0D6CC",
    gap: 6,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2C2C2C",
  },
  cardSubtitle: {
    color: "#8C7C71",
  },
  pillRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  pill: {
    backgroundColor: "#F4F1EA",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pillText: {
    color: "#2C2C2C",
    fontWeight: "600",
  },
  metaText: {
    color: "#6B5E55",
  },
  actionsRow: {
    gap: 10,
  },
  primaryButton: {
    backgroundColor: "#0E3A32",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FDE7C6",
    fontSize: 14,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0D6CC",
  },
  secondaryButtonText: {
    color: "#1F2A24",
    fontSize: 14,
    fontWeight: "600",
  },
  dangerButton: {
    backgroundColor: "#FEE4E2",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  dangerButtonText: {
    color: "#B42318",
    fontSize: 14,
    fontWeight: "600",
  },
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2C2C2C",
  },
  emptyBody: {
    color: "#6B5E55",
    marginTop: 6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    gap: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C2C2C",
  },
  modalLabel: {
    color: "#6B5E55",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D8CEC4",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    color: "#1F2A24",
  },
});
