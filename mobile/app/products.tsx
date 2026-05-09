import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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
import { useTheme } from "@/context/theme"; // Using your updated theme context

export default function ProductsScreen() {
  // Pull the pure black/white/green minimal colors directly from the context
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const router = useRouter();
  const params = useLocalSearchParams();
  const userId = Array.isArray(params.userId)
    ? params.userId[0]
    : params.userId;

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);

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
          <ActivityIndicator size="large" color={colors.accent1} />
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

// Map everything to the new dynamic colors context
const createStyles = (colors: any) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.bg,
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
      backgroundColor: colors.surface1,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    backButtonText: {
      color: colors.text1,
      fontWeight: "600",
    },
    title: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text1,
    },
    count: {
      minWidth: 28,
      textAlign: "center",
      fontWeight: "700",
      color: colors.accent1, // Brand Green accent
    },
    listContent: {
      paddingHorizontal: 20,
      paddingBottom: 20,
      gap: 12,
    },
    card: {
      backgroundColor: colors.surface1,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text1,
    },
    cardSubtitle: {
      fontSize: 13,
      color: colors.text2,
      marginTop: 4,
    },
    cardQty: {
      fontWeight: "600",
      color: colors.text1,
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
      color: colors.text1,
    },
    emptyBody: {
      color: colors.text2,
      marginTop: 6,
    },
  });
