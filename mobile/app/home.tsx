import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  AlertTriangle,
  BarChart3,
  Bot,
  Camera,
  ChefHat,
  CirclePlus,
  PackageCheck,
  ScanLine,
  Search,
  ShoppingBasket,
  TrendingUp,
  UserCircle2,
  Wallet,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
  Bell,
  Sparkles,
  ChevronDown,
  ChevronUp
} from "lucide-react-native";

import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_BASE_URL } from "@/constants/api";
import AddProductModal from "@/components/home/AddProductModal";
import BudgetCard from "@/components/home/BudgetCard";
import ProductPreview from "@/components/home/ProductPreview";
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
  | "analytics"
  | "smart"
  | "ai";

const actions: {
  key: QuickActionKey;
  title: string;
  subtitle: string;
  icon: any;
}[] = [
    {
      key: "recipes",
      title: "Recipe ideas",
      subtitle: "Cook from pantry items",
      icon: ChefHat,
    },
    {
      key: "prices",
      title: "Market prices",
      subtitle: "Scan latest grocery prices",
      icon: Search,
    },
    {
      key: "shopping",
      title: "Shopping list",
      subtitle: "Generate smart grocery list",
      icon: ShoppingBasket,
    },
    {
      key: "forecast",
      title: "Demand forecast",
      subtitle: "Predict usage and restock time",
      icon: TrendingUp,
    },
    {
      key: "analytics",
      title: "Analytics",
      subtitle: "View spending patterns",
      icon: BarChart3,
    },
    {
      key: "smart",
      title: "Smart shopping",
      subtitle: "Personalized recommendation",
      icon: Sparkles,
    },
    {
      key: "ai",
      title: "AI assistant",
      subtitle: "Ask about your groceries",
      icon: Bot,
    },
  ];

export default function HomeScreen() {
  const { colors, mode, scheme, setMode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const toggleMode = () => {
    if (mode === "system") setMode("dark");
    else if (mode === "dark") setMode("light");
    else setMode("system");
  };

  const router = useRouter();
  const params = useLocalSearchParams();

  const userId = Array.isArray(params.userId)
    ? params.userId[0]
    : params.userId;

  const displayName = Array.isArray(params.name) ? params.name[0] : params.name;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [quickActionsExpanded, setQuickActionsExpanded] = useState(false);
  const [pantryPreviewExpanded, setPantryPreviewExpanded] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [budget, setBudget] = useState<BudgetStatus | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
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
      const loadedProducts = Array.isArray(data) ? data : [];
      setProducts(loadedProducts);

      // --- CHECK FOR FINISHED ITEMS ---
      const finishedItems = loadedProducts.filter((p: Product) => p.quantity <= 0);
      if (finishedItems.length > 0) {
        const lastNotifKey = `last_finished_notif_${userId}`;
        const lastTime = await AsyncStorage.getItem(lastNotifKey);
        const now = Date.now();
        // Prevent spam: only trigger once every 6 hours
        if (!lastTime || now - parseInt(lastTime) > 6 * 60 * 60 * 1000) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "Items Finished! 🚨",
              body: `You have ${finishedItems.length} items completely out of stock. Tap to restock.`,
              categoryIdentifier: "FINISHED_ITEMS",
              data: { action: "RESTOCK_ALL", userId },
            },
            trigger: null, // immediate
          });
          await AsyncStorage.setItem(lastNotifKey, now.toString());
        }
      }
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

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    try {
      const res = await fetch(`${API_BASE_URL}/notifications?userId=${userId}`);
      const data = await res.json();
      if (data?.success) {
        setUnreadNotifications(data.unreadCount || 0);
      }
    } catch {
      setUnreadNotifications(0);
    }
  }, [userId]);

  const loadDashboard = useCallback(
    async (isRefresh = false) => {
      if (!userId) return;

      if (isRefresh) setRefreshing(true);

      await Promise.all([
        fetchProducts(),
        fetchCatalog(),
        fetchBudget(),
        fetchNotifications()
      ]);

      setLoading(false);
      setRefreshing(false);
    },
    [fetchBudget, fetchCatalog, fetchProducts, fetchNotifications, userId],
  );

  useFocusEffect(
    useCallback(() => {
      loadDashboard(false);
    }, [loadDashboard]),
  );

  const handleAddProduct = async () => {
    if (!userId) return;

    if (!productName.trim() || !productUnit.trim() || !productQuantity.trim()) {
      Alert.alert("Missing fields", "Name, unit, and quantity are required.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          name: productName.trim(),
          unit: productUnit.trim(),
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

    const limit = Number.parseFloat(budgetLimit || "0");

    if (!Number.isFinite(limit) || limit <= 0) {
      Alert.alert("Invalid budget", "Enter a valid monthly budget.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/budget`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          limit,
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

  const healthyCount = Math.max(totalItems - watchListCount, 0);

  const firstName = useMemo(() => {
    if (!displayName) return "there";
    return String(displayName).split(" ")[0];
  }, [displayName]);

  const budgetPercent = Math.min(Number(budget?.percent || 0), 100);
  const budgetRemaining = Number(budget?.remaining || 0);

  const pantryScore = useMemo(() => {
    if (totalItems === 0) return 0;
    const score = Math.round((healthyCount / totalItems) * 100);
    return Math.max(0, Math.min(score, 100));
  }, [healthyCount, totalItems]);

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
      return;
    }

    if (key === "ai") {
      router.push({
        pathname: "/ai-assistant",
        params: { userId: String(userId) },
      });
      return;
    }

    if (key === "smart") {
      router.push({
        pathname: "/smart-recommendation",
        params: { userId: String(userId) },
      });
    }
  };

  if (!userId) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <UserCircle2 size={42} color={colors.text3} />
          </View>

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
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.accent1} />
          <Text style={styles.loadingTitle}>Loading SmartGrocer</Text>
          <Text style={styles.loadingBody}>Preparing your pantry dashboard.</Text>
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadDashboard(true)}
                tintColor={colors.accent1}
              />
            }
          >
            <View style={styles.topHeader}>
              <View>
                <Text style={styles.appLabel}>SmartGrocer</Text>
                <Text style={styles.greeting}>Hi, {firstName}</Text>
              </View>

              <View style={styles.headerActions}>
                <Pressable
                  style={styles.headerIconButton}
                  onPress={() =>
                    router.push({
                      pathname: "/notifications",
                      params: { userId: String(userId) },
                    })
                  }
                >
                  <Bell size={20} color={colors.text1} />
                  {unreadNotifications > 0 && (
                    <View style={styles.notificationBadge} />
                  )}
                </Pressable>

                <Pressable
                  style={styles.headerIconButton}
                  onPress={toggleMode}
                >
                  {mode === "system" ? (
                    <Monitor size={18} color={colors.text1} />
                  ) : scheme === "dark" ? (
                    <Moon size={18} color={colors.text1} />
                  ) : (
                    <Sun size={18} color={colors.text1} />
                  )}
                </Pressable>

                <Pressable
                  style={styles.headerIconButton}
                  onPress={() =>
                    router.push({
                      pathname: "/scan-receipt",
                      params: { userId: String(userId) },
                    })
                  }
                >
                  <Camera size={20} color={colors.text1} />
                </Pressable>

                <Pressable
                  style={styles.headerIconButton}
                  onPress={() =>
                    router.push({
                      pathname: "/profile",
                      params: {
                        userId: String(userId),
                        name: displayName ?? "",
                      },
                    })
                  }
                >
                  <UserCircle2 size={21} color={colors.text1} />
                </Pressable>
              </View>
            </View>

            <View style={styles.healthCard}>
              <View style={styles.healthTop}>
                <View style={styles.scoreBox}>
                  <Text style={styles.scoreValue}>{pantryScore}</Text>
                  <Text style={styles.scoreLabel}>Score</Text>
                </View>

                <View style={styles.healthCopy}>
                  <Text style={styles.healthTitle}>Pantry health</Text>
                  <Text style={styles.healthText}>
                    {lowStockCount > 0
                      ? `${lowStockCount} item${lowStockCount > 1 ? "s" : ""
                      } need attention.`
                      : "Everything looks good today."}
                  </Text>
                </View>
              </View>

              <View style={styles.healthTrack}>
                <View
                  style={[
                    styles.healthFill,
                    { width: `${pantryScore || 6}%` },
                  ]}
                />
              </View>

              <View style={styles.statsRow}>
                <MiniStat
                  styles={styles}
                  colors={colors}
                  icon={PackageCheck}
                  label="Items"
                  value={String(totalItems)}
                />

                <MiniStat
                  styles={styles}
                  colors={colors}
                  icon={AlertTriangle}
                  label="Watch"
                  value={String(watchListCount)}
                  warning
                />

                <MiniStat
                  styles={styles}
                  colors={colors}
                  icon={Wallet}
                  label="Budget"
                  value={budget?.limit ? `${Math.round(budgetPercent)}%` : "--"}
                />
              </View>
            </View>

            <View style={styles.quickRow}>
              <Pressable
                style={styles.scanCard}
                onPress={() =>
                  router.push({
                    pathname: "/scan-receipt",
                    params: { userId: String(userId) },
                  })
                }
              >
                <View style={styles.scanIcon}>
                  <ScanLine size={21} color={colors.bg} />
                </View>

                <View style={styles.scanTextWrap}>
                  <Text style={styles.scanTitle}>Scan receipt</Text>
                  <Text style={styles.scanSubtitle}>Add items quickly</Text>
                </View>
              </Pressable>

              <Pressable
                style={styles.addCard}
                onPress={() => setShowAddModal(true)}
              >
                <CirclePlus size={23} color={colors.accent1} />
                <Text style={styles.addCardText}>Add</Text>
              </Pressable>
            </View>

            <View style={styles.quickActionsSection}>
              <Pressable 
                style={[styles.sectionHeader, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
                onPress={() => setQuickActionsExpanded(!quickActionsExpanded)}
              >
                <View>
                  <Text style={styles.sectionSmallTitle}>Shortcuts</Text>
                  <Text style={styles.sectionTitle}>Quick actions</Text>
                </View>
                <View style={{ padding: 4 }}>
                  {quickActionsExpanded ? (
                    <ChevronUp size={20} color={colors.text2} />
                  ) : (
                    <ChevronDown size={20} color={colors.text2} />
                  )}
                </View>
              </Pressable>

              {quickActionsExpanded && (
                <View style={styles.quickActionsList}>
                  {actions.map((action) => (
                    <ActionTile
                      key={action.key}
                      colors={colors}
                      styles={styles}
                      item={action}
                      onPress={() => handleQuickAction(action.key)}
                    />
                  ))}
                </View>
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Pressable 
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                  onPress={() => setPantryPreviewExpanded(!pantryPreviewExpanded)}
                >
                  <Text style={styles.sectionTitle}>Pantry preview</Text>
                  {pantryPreviewExpanded ? (
                    <ChevronUp size={20} color={colors.text2} />
                  ) : (
                    <ChevronDown size={20} color={colors.text2} />
                  )}
                </Pressable>

                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/products",
                      params: {
                        userId: String(userId),
                        name: displayName ?? "",
                      },
                    })
                  }
                >
                  <Text style={styles.viewAllText}>View all</Text>
                </Pressable>
              </View>

              {pantryPreviewExpanded && (
                <ProductPreview
                  loading={loading}
                  products={products}
                  onViewAll={() =>
                    router.push({
                      pathname: "/products",
                      params: {
                        userId: String(userId),
                        name: displayName ?? "",
                      },
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
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Budget</Text>

                {budget?.limit ? (
                  <Text style={styles.remainingText}>
                    Rs {Math.round(budgetRemaining).toLocaleString("en-PK")} left
                  </Text>
                ) : null}
              </View>

              {budget?.limit ? (
                <View style={styles.budgetPreview}>
                  <View style={styles.budgetPreviewTop}>
                    <Text style={styles.budgetPreviewLabel}>Used</Text>
                    <Text style={styles.budgetPreviewPercent}>
                      {Math.round(budgetPercent)}%
                    </Text>
                  </View>

                  <View style={styles.budgetTrack}>
                    <View
                      style={[
                        styles.budgetFill,
                        { width: `${budgetPercent}%` },
                      ]}
                    />
                  </View>
                </View>
              ) : null}

              <BudgetCard
                budget={budget}
                budgetLimit={budgetLimit}
                onBudgetLimitChange={setBudgetLimit}
                onSaveBudget={handleSetBudget}
              />
            </View>
          </ScrollView>

          <Pressable
            style={styles.floatingAddButton}
            onPress={() => setShowAddModal(true)}
          >
            <CirclePlus size={25} color={colors.bg} />
          </Pressable>
        </>
      )}

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

function MiniStat({
  styles,
  colors,
  icon: Icon,
  label,
  value,
  warning,
}: {
  styles: ReturnType<typeof createStyles>;
  colors: any;
  icon: any;
  label: string;
  value: string;
  warning?: boolean;
}) {
  return (
    <View style={styles.miniStat}>
      <View style={[styles.miniStatIcon, warning && styles.miniStatIconWarning]}>
        <Icon size={16} color={warning ? colors.warning : colors.accent1} />
      </View>

      <Text style={styles.miniStatLabel}>{label}</Text>
      <Text style={styles.miniStatValue}>{value}</Text>
    </View>
  );
}

function ActionTile({
  colors,
  styles,
  item,
  onPress,
}: {
  colors: any;
  styles: ReturnType<typeof createStyles>;
  item: {
    key: QuickActionKey;
    title: string;
    subtitle: string;
    icon: any;
  };
  onPress: () => void;
}) {
  const Icon = item.icon;

  return (
    <Pressable style={styles.actionTile} onPress={onPress}>
      <View style={styles.actionIconBox}>
        <Icon size={19} color={colors.accent1} />
      </View>

      <View style={styles.actionTextBox}>
        <Text style={styles.actionTitle}>{item.title}</Text>
        <Text style={styles.actionSubtitle}>{item.subtitle}</Text>
      </View>

      <View style={styles.actionArrowBox}>
        <ChevronRight size={18} color={colors.text3} />
      </View>
    </Pressable>
  );
}

const createStyles = (colors: any) => {
  const isDark = colors.bg === "#000000";

  const softAccent = isDark
    ? "rgba(74, 222, 128, 0.13)"
    : "rgba(16, 185, 129, 0.09)";

  const softWarning = isDark
    ? "rgba(234, 179, 8, 0.13)"
    : "rgba(245, 158, 11, 0.10)";

  const shadowColor = isDark ? "#000000" : "#102116";

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.bg,
    },

    scrollContent: {
      paddingHorizontal: 18,
      paddingTop: 16,
      paddingBottom: 105,
      gap: 16,
    },

    topHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 14,
    },

    appLabel: {
      color: colors.accent1,
      fontSize: 11,
      fontWeight: "900",
      textTransform: "uppercase",
      letterSpacing: 1.6,
      marginBottom: 4,
    },

    greeting: {
      color: colors.text1,
      fontSize: 31,
      fontWeight: "900",
      letterSpacing: -1,
    },

    headerActions: {
      flexDirection: "row",
      gap: 10,
    },

    headerIconButton: {
      width: 46,
      height: 46,
      borderRadius: 17,
      backgroundColor: colors.surface1,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },

    healthCard: {
      backgroundColor: colors.surface1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 30,
      padding: 18,
      gap: 17,
      shadowColor,
      shadowOpacity: isDark ? 0 : 0.06,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 12 },
      elevation: 3,
    },

    healthTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: 15,
    },

    scoreBox: {
      width: 88,
      height: 88,
      borderRadius: 26,
      backgroundColor: softAccent,
      borderWidth: 1,
      borderColor: isDark ? "rgba(74, 222, 128, 0.22)" : "#ccebd8",
      alignItems: "center",
      justifyContent: "center",
    },

    scoreValue: {
      color: colors.text1,
      fontSize: 31,
      fontWeight: "900",
      letterSpacing: -0.8,
    },

    scoreLabel: {
      color: colors.text3,
      fontSize: 10,
      fontWeight: "900",
      textTransform: "uppercase",
      letterSpacing: 1,
      marginTop: 2,
    },

    healthCopy: {
      flex: 1,
    },

    healthTitle: {
      color: colors.text1,
      fontSize: 21,
      fontWeight: "900",
      letterSpacing: -0.5,
    },

    healthText: {
      color: colors.text2,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "700",
      marginTop: 5,
    },

    healthTrack: {
      height: 9,
      borderRadius: 999,
      backgroundColor: colors.surface3,
      overflow: "hidden",
    },

    healthFill: {
      height: "100%",
      borderRadius: 999,
      backgroundColor: colors.accent1,
    },

    statsRow: {
      flexDirection: "row",
      gap: 10,
    },

    miniStat: {
      flex: 1,
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 21,
      padding: 13,
      minHeight: 98,
      justifyContent: "space-between",
    },

    miniStatIcon: {
      width: 34,
      height: 34,
      borderRadius: 13,
      backgroundColor: softAccent,
      alignItems: "center",
      justifyContent: "center",
    },

    miniStatIconWarning: {
      backgroundColor: softWarning,
    },

    miniStatLabel: {
      color: colors.text3,
      fontSize: 10,
      fontWeight: "900",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },

    miniStatValue: {
      color: colors.text1,
      fontSize: 21,
      fontWeight: "900",
      letterSpacing: -0.5,
    },

    addMainButton: {
      minHeight: 56,
      borderRadius: 20,
      backgroundColor: colors.accent1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 9,
    },

    addMainButtonText: {
      color: colors.bg,
      fontSize: 15,
      fontWeight: "900",
    },

    quickRow: {
      flexDirection: "row",
      gap: 12,
    },

    scanCard: {
      flex: 1,
      minHeight: 82,
      backgroundColor: colors.accent1,
      borderRadius: 25,
      padding: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },

    scanIcon: {
      width: 44,
      height: 44,
      borderRadius: 16,
      backgroundColor: isDark
        ? "rgba(0,0,0,0.18)"
        : "rgba(255,255,255,0.22)",
      alignItems: "center",
      justifyContent: "center",
    },

    scanTextWrap: {
      flex: 1,
    },

    scanTitle: {
      color: colors.bg,
      fontSize: 15,
      fontWeight: "900",
    },

    scanSubtitle: {
      color: colors.bg,
      opacity: 0.76,
      fontSize: 12,
      fontWeight: "700",
      marginTop: 2,
    },

    addCard: {
      width: 98,
      minHeight: 82,
      backgroundColor: colors.surface1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 25,
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },

    addCardText: {
      color: colors.text1,
      fontSize: 13,
      fontWeight: "900",
    },

    quickActionsSection: {
      backgroundColor: colors.surface1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 26,
      padding: 16,
      gap: 14,
    },

    quickActionsList: {
      gap: 9,
    },

    actionTile: {
      minHeight: 70,
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 20,
      paddingHorizontal: 13,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },

    actionIconBox: {
      width: 42,
      height: 42,
      borderRadius: 15,
      backgroundColor: softAccent,
      alignItems: "center",
      justifyContent: "center",
    },

    actionTextBox: {
      flex: 1,
    },

    actionTitle: {
      color: colors.text1,
      fontSize: 15,
      fontWeight: "900",
      letterSpacing: -0.2,
    },

    actionSubtitle: {
      color: colors.text3,
      fontSize: 12,
      fontWeight: "700",
      marginTop: 3,
      lineHeight: 16,
    },


    actionArrowBox: {
      width: 30,
      height: 30,
      borderRadius: 11,
      backgroundColor: colors.surface2,
      alignItems: "center",
      justifyContent: "center",
    },

    section: {
      backgroundColor: colors.surface1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 26,
      padding: 16,
      gap: 14,
    },

    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },

    sectionSmallTitle: {
      color: colors.accent1,
      fontSize: 10,
      fontWeight: "900",
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: 3,
    },

    sectionTitle: {
      color: colors.text1,
      fontSize: 20,
      fontWeight: "900",
      letterSpacing: -0.5,
    },

    viewAllText: {
      color: colors.accent1,
      fontSize: 13,
      fontWeight: "900",
    },

    remainingText: {
      color: colors.text2,
      fontSize: 12,
      fontWeight: "800",
    },

    budgetPreview: {
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 20,
      padding: 14,
      gap: 12,
    },

    budgetPreviewTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },

    budgetPreviewLabel: {
      color: colors.text3,
      fontSize: 11,
      fontWeight: "900",
      textTransform: "uppercase",
    },

    budgetPreviewPercent: {
      color: colors.accent1,
      fontSize: 15,
      fontWeight: "900",
    },

    budgetTrack: {
      height: 8,
      backgroundColor: colors.surface3,
      borderRadius: 999,
      overflow: "hidden",
    },

    budgetFill: {
      height: "100%",
      backgroundColor: colors.accent1,
      borderRadius: 999,
    },

    floatingAddButton: {
      position: "absolute",
      right: 20,
      bottom: 24,
      width: 58,
      height: 58,
      borderRadius: 22,
      backgroundColor: colors.accent1,
      alignItems: "center",
      justifyContent: "center",
      shadowColor,
      shadowOpacity: isDark ? 0.35 : 0.2,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 12 },
      elevation: 8,
    },

    loadingWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 28,
      gap: 10,
    },

    loadingTitle: {
      color: colors.text1,
      fontSize: 18,
      fontWeight: "900",
      marginTop: 4,
    },

    loadingBody: {
      color: colors.text2,
      fontSize: 13,
      fontWeight: "600",
      textAlign: "center",
    },

    emptyState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingHorizontal: 24,
      backgroundColor: colors.bg,
    },

    emptyIcon: {
      width: 72,
      height: 72,
      borderRadius: 26,
      backgroundColor: colors.surface1,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },

    emptyTitle: {
      fontSize: 22,
      fontWeight: "900",
      color: colors.text1,
    },

    emptyBody: {
      color: colors.text2,
      fontSize: 14,
      fontWeight: "700",
    },

    primaryButton: {
      marginTop: 10,
      backgroundColor: colors.accent1,
      borderRadius: 16,
      paddingVertical: 13,
      paddingHorizontal: 18,
      alignItems: "center",
    },

    primaryButtonText: {
      color: colors.bg,
      fontSize: 14,
      fontWeight: "900",
    },
  });
};