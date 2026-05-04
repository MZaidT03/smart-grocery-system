import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { API_BASE_URL } from "@/constants/api";

export default function ProductsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const userId = Array.isArray(params.userId)
    ? params.userId[0]
    : params.userId;

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/products?userId=${userId}`);
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
        <Text style={styles.title}>All products</Text>
        <Text style={styles.count}>{products.length}</Text>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#0E3A32" />
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No products yet</Text>
          <Text style={styles.emptyBody}>Add items on the home screen.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent}>
          {products.map((product) => (
            <Pressable
              key={product.id}
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: "/product",
                  params: {
                    userId: String(userId),
                    productId: String(product.id),
                  },
                })
              }
            >
              <View>
                <Text style={styles.cardTitle}>{product.name}</Text>
                <Text style={styles.cardSubtitle}>{product.category}</Text>
              </View>
              <Text style={styles.cardQty}>
                {product.quantity} {product.unit}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
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
    paddingBottom: 10,
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
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2C2C2C",
  },
  count: {
    minWidth: 28,
    textAlign: "center",
    fontWeight: "700",
    color: "#0E3A32",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E0D6CC",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C2C2C",
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#8C7C71",
    marginTop: 4,
  },
  cardQty: {
    fontWeight: "600",
    color: "#2C2C2C",
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
});
