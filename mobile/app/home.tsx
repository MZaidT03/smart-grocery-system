import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { API_BASE_URL } from "@/constants/api";
import AddProductModal from "@/components/home/AddProductModal";
import BudgetCard from "@/components/home/BudgetCard";
import HomeHeader from "@/components/home/HomeHeader";
import ProductPreview from "@/components/home/ProductPreview";
import QuickActions from "@/components/home/QuickActions";
import { useTheme } from "@/context/theme";

type CatalogItem = {
  consumption_unit?: string;
  category?: string;
};

type Product = {
  id: number | string;
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  days_left?: number;
};

type BudgetStatus = {
  status?: string;
  limit?: number;
  spent?: number;
  remaining?: number;
  percent?: number;
  color?: string;
  advice?: string;
};

type QuickActionKey =
  | "recipes"
  | "prices"
  | "shopping"
  | "forecast"
  | "analytics";

export default function HomeScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const router = useRouter();
  const params = useLocalSearchParams();
  const userId = Array.isArray(params.userId)
    ? params.userId[0]
    : params.userId;
  const displayName = Array.isArray(params.name) ? params.name[0] : params.name;

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [budget, setBudget] = useState<BudgetStatus | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const [productName, setProductName] = useState("");
  const [productUnit, setProductUnit] = useState("");
  const [productQuantity, setProductQuantity] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [usageQty, setUsageQty] = useState("1");
  const [usageDays, setUsageDays] = useState("1");
  const [productPrice, setProductPrice] = useState("");
  const [shelfLife, setShelfLife] = useState("7");

  const [budgetLimit, setBudgetLimit] = useState("");

  const unitSuggestions = useMemo(() => {
    const values = catalog.map((item) => item.consumption_unit).filter(Boolean);
    return Array.from(new Set(values)).slice(0, 8);
  }, [catalog]);

  const categorySuggestions = useMemo(() => {
    const values = catalog.map((item) => item.category).filter(Boolean);
    return Array.from(new Set(values)).slice(0, 8);
  }, [catalog]);

  const fetchProducts = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/products?userId=${userId}`);
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      setProducts([]);
    }
  }, [userId]);

  const fetchCatalog = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/catalog`);
      const data = await res.json();
      setCatalog(Array.isArray(data) ? data : []);
    } catch {
      setCatalog([]);
    }
  }, []);

  const fetchBudget = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/budget?userId=${userId}`);
      const data = await res.json();
      setBudget(data);
    } catch {
      setBudget(null);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      if (!userId) {
        return;
      }
      const load = async () => {
        setLoading(true);
        await Promise.all([fetchProducts(), fetchCatalog(), fetchBudget()]);
        setLoading(false);
      };
      load();
    }, [fetchBudget, fetchCatalog, fetchProducts, userId]),
  );

  const handleAddProduct = async () => {
    if (!userId) return;
    if (!productName || !productUnit || !productQuantity) {
      Alert.alert("Missing fields", "Name, unit, and quantity are required.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          name: productName,
          unit: productUnit,
          quantity: Number.parseFloat(productQuantity || "0"),
          category: productCategory || "Other",
          usageQty: Number.parseFloat(usageQty || "1"),
          usageDays: Number.parseFloat(usageDays || "1"),
          price: Number.parseFloat(productPrice || "0"),
          shelfLife: Number.parseFloat(shelfLife || "7"),
        }),
      });
      const data = await res.json();
      if (!data?.success) {
        Alert.alert("Add failed", data?.message || "Please try again.");
        return;
      }
      setProductName("");
      setProductUnit("");
      setProductQuantity("");
      setProductCategory("");
      setUsageQty("1");
      setUsageDays("1");
      setProductPrice("");
      setShelfLife("7");
      setShowAddModal(false);
      await Promise.all([fetchProducts(), fetchBudget()]);
    } catch {
      Alert.alert("Add failed", "Server error. Try again.");
    }
  };

  const handleSetBudget = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/budget`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          limit: Number.parseFloat(budgetLimit || "0"),
        }),
      });
      const data = await res.json();
      if (!data?.success) {
        Alert.alert("Budget update failed", "Try again.");
        return;
      }
      setBudgetLimit("");
      await fetchBudget();
    } catch {
      Alert.alert("Budget update failed", "Server error. Try again.");
    }
  };

  const totalItems = products.length;
  const lowStockCount = useMemo(() => {
    return products.filter(
      (item) =>
        item.days_left !== undefined &&
        item.days_left !== -1 &&
        item.days_left < 3,
    ).length;
  }, [products]);

  const watchListCount = useMemo(() => {
    return products.filter(
      (item) =>
        item.days_left !== undefined &&
        item.days_left !== -1 &&
        item.days_left < 7,
    ).length;
  }, [products]);

  const handleQuickAction = (key: QuickActionKey) => {
    if (key === "recipes") {
      router.push({
        pathname: "/recipes",
        params: { userId: String(userId), name: displayName ?? "" },
      });
      return;
    }
    if (key === "prices") {
      router.push({
        pathname: "/market-price",
        params: { userId: String(userId), name: displayName ?? "" },
      });
      return;
    }
    if (key === "shopping") {
      router.push({
        pathname: "/shopping-list",
        params: { userId: String(userId), name: displayName ?? "" },
      });
      return;
    }
    if (key === "forecast") {
      router.push({
        pathname: "/forecast",
        params: { userId: String(userId), name: displayName ?? "" },
      });
      return;
    }
    if (key === "analytics") {
      router.push({
        pathname: "/analytics",
        params: { userId: String(userId), name: displayName ?? "" },
      });
    }
  };

  if (!userId) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Session expired</Text>
          <Text style={styles.emptyBody}>Please log in again.</Text>
          <Pressable
            style={styles.primaryButton}
            onPress={() => router.replace("/login")}
          >
            <Text style={styles.primaryButtonText}>Go to login</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <HomeHeader
          displayName={displayName}
          totalItems={totalItems}
          lowStockCount={lowStockCount}
          watchListCount={watchListCount}
          budgetStatus={budget?.status}
          onAddPress={() => setShowAddModal(true)}
          onProfilePress={() =>
            router.push({
              pathname: "/profile",
              params: { userId: String(userId), name: displayName ?? "" },
            })
          }
        />

        <QuickActions onAction={handleQuickAction} />

        <ProductPreview
          loading={loading}
          products={products}
          onViewAll={() =>
            router.push({
              pathname: "/products",
              params: { userId: String(userId), name: displayName ?? "" },
            })
          }
          onPressProduct={(product: Product) =>
            router.push({
              pathname: "/product",
              params: {
                userId: String(userId),
                productId: String(product.id),
              },
            })
          }
        />

        <BudgetCard
          budget={budget}
          budgetLimit={budgetLimit}
          onBudgetLimitChange={setBudgetLimit}
          onSaveBudget={handleSetBudget}
        />
      </ScrollView>

      <AddProductModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddProduct}
        productName={productName}
        onProductName={setProductName}
        productUnit={productUnit}
        onProductUnit={setProductUnit}
        productQuantity={productQuantity}
        onProductQuantity={setProductQuantity}
        productCategory={productCategory}
        onProductCategory={setProductCategory}
        usageQty={usageQty}
        onUsageQty={setUsageQty}
        usageDays={usageDays}
        onUsageDays={setUsageDays}
        productPrice={productPrice}
        onProductPrice={setProductPrice}
        shelfLife={shelfLife}
        onShelfLife={setShelfLife}
        unitSuggestions={unitSuggestions}
        categorySuggestions={categorySuggestions}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => {
  const isDark = colors.bg === "#000000";
  const shadowColor = isDark ? "#000000" : "#102116";

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    scrollContent: {
      paddingHorizontal: 18,
      paddingTop: 16,
      paddingBottom: 34,
      gap: 20,
    },
    emptyState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingHorizontal: 24,
      backgroundColor: colors.bg,
    },
    emptyTitle: {
      fontSize: 22,
      fontWeight: "900",
      color: colors.text1,
    },
    emptyBody: {
      color: colors.text2,
      fontSize: 14,
    },
    primaryButton: {
      marginTop: 10,
      backgroundColor: colors.accent1,
      borderRadius: 16,
      paddingVertical: 13,
      paddingHorizontal: 18,
      alignItems: "center",
      shadowColor,
      shadowOpacity: isDark ? 0 : 0.14,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 8 },
      elevation: 3,
    },
    primaryButtonText: {
      color: colors.bg,
      fontSize: 14,
      fontWeight: "900",
    },
  });
};
