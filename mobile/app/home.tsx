import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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
import { useTheme } from "@/context/theme"; // Using your updated theme context

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

type QuickActionKey = "recipes" | "prices" | "shopping" | "forecast";

export default function HomeScreen() {
  // Pull the active high-end minimal colors directly from the context
  const { colors } = useTheme();

  // Pass the colors to our StyleSheet
  const styles = useMemo(() => createStyles(colors), [colors]);

  const router = useRouter();
  const params = useLocalSearchParams();
  const userId = Array.isArray(params.userId)
    ? params.userId[0]
    : params.userId;
  const displayName = Array.isArray(params.name) ? params.name[0] : params.name;

  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
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

  useEffect(() => {
    if (!userId) {
      return;
    }
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchProducts(), fetchCatalog(), fetchBudget()]);
      setLoading(false);
    };
    load();
  }, [userId, refreshTrigger]);

  const fetchProducts = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/products?userId=${userId}`);
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      setProducts([]);
    }
  };

  const fetchCatalog = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/catalog`);
      const data = await res.json();
      setCatalog(Array.isArray(data) ? data : []);
    } catch (err) {
      setCatalog([]);
    }
  };

  const fetchBudget = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/budget?userId=${userId}`);
      const data = await res.json();
      setBudget(data);
    } catch (err) {
      setBudget(null);
    }
  };

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
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
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
    } catch (err) {
      Alert.alert("Budget update failed", "Server error. Try again.");
    }
  };

  const totalItems = products.length;
  const lowStockCount = useMemo(() => {
    return products.filter(
      (item) => item.days_left !== -1 && item.days_left < 3,
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
      Alert.alert("Prices", "Coming soon on mobile.");
      return;
    }
    if (key === "shopping") {
      Alert.alert("Shopping list", "Coming soon on mobile.");
      return;
    }
    if (key === "forecast") {
      Alert.alert("Forecast", "Coming soon on mobile.");
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
          budgetStatus={budget?.status}
          onAddPress={() => setShowAddModal(true)}
        />

        <QuickActions onAction={handleQuickAction} />

        <BudgetCard
          budget={budget}
          budgetLimit={budgetLimit}
          onBudgetLimitChange={setBudgetLimit}
          onSaveBudget={handleSetBudget}
        />

        <ProductPreview
          loading={loading}
          products={products}
          onViewAll={() =>
            router.push({
              pathname: "/products",
              params: { userId: String(userId), name: displayName ?? "" },
            })
          }
          onPressProduct={(product) =>
            router.push({
              pathname: "/product",
              params: {
                userId: String(userId),
                productId: String(product.id),
              },
            })
          }
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

// Updated to map to your new minimal Theme Colors (bg, text1, text2, accent1, etc.)
const createStyles = (colors: any) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 30,
      gap: 18,
    },
    emptyState: {
      alignItems: "center",
      gap: 8,
      paddingVertical: 40,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text1,
    },
    emptyBody: {
      color: colors.text2,
    },
    primaryButton: {
      backgroundColor: colors.accent1, // Brand Green
      borderRadius: 16,
      paddingVertical: 10,
      paddingHorizontal: 16,
      alignItems: "center",
    },
    primaryButtonText: {
      color: colors.bg, // Makes text white in light mode, pure black in dark mode
      fontSize: 14,
      fontWeight: "600",
    },
  });
