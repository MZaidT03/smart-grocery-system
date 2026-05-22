import { API_BASE_URL } from "@/constants/api";
import { useTheme } from "@/context/theme";
import SuccessModal from "@/components/shopping-list/SuccessModal";
import AddShoppingItemModal from "@/components/shopping-list/AddShoppingItemModal";
import AdjustQuantityModal from "@/components/shopping-list/AdjustQuantityModal";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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
} from "react-native";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  ListChecks,
  Plus,
  RefreshCw,
  Search,
  ShoppingCart,
  Trash2,
  AlertCircle,
  PackageSearch,
} from "lucide-react-native";

type ShoppingItem = {
  item_id: number;
  item_name: string;
  consumption_unit?: string;
  suggested_quantity?: number;
  adjusted_quantity?: number;
  category?: string;
  current_stock?: number;
  is_selected?: number;
};

type ShoppingList = {
  list_id: number;
  list_name?: string;
  num_days?: number;
  num_members?: number;
  diet_type?: string;
  created_from?: string;
  is_confirmed?: number;
};

type QuickSuggestion = {
  item_name: string;
  category?: string;
  consumption_unit?: string;
};

const categories = [
  "Staples",
  "Dairy",
  "Vegetables",
  "Fruits",
  "Meat",
  "Bakery",
  "Snacks",
  "Beverages",
  "Spices",
  "Other",
];

export default function ShoppingListScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const params = useLocalSearchParams();
  const userId = Array.isArray(params.userId) ? params.userId[0] : params.userId;
  const displayName = Array.isArray(params.name) ? params.name[0] : params.name;

  const [list, setList] = useState<ShoppingList | null>(null);
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [listMode, setListMode] = useState<"stock" | "catalog">("stock");
  const [daysToPlan, setDaysToPlan] = useState("7");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [confirmedItemsCount, setConfirmedItemsCount] = useState(0);
  const [confirmedItemsList, setConfirmedItemsList] = useState<{ name: string; qty: number; unit: string }[]>([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState("1");
  const [newItemUnit, setNewItemUnit] = useState("kg");
  const [newItemCategory, setNewItemCategory] = useState("Staples");

  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [activeItem, setActiveItem] = useState<ShoppingItem | null>(null);
  const [adjustedQty, setAdjustedQty] = useState("");

  const [suggestions, setSuggestions] = useState<QuickSuggestion[]>([]);
  const [suggestionQuery, setSuggestionQuery] = useState("");
  const [lastAddedItem, setLastAddedItem] = useState<string | null>(null);

  const listId = list?.list_id;
  const checkedCount = items.filter((item) => item.is_selected !== 0).length;

  const fetchList = async (targetListId?: number, isRefresh = false) => {
    if (!targetListId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/shopping-list/${targetListId}`);
      const data = await res.json();
      if (data?.success) {
        setList(data.list || null);
        setItems(Array.isArray(data.items) ? data.items : []);
      } else {
        setList(null);
        setItems([]);
      }
    } catch (err) {
      setList(null);
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    const initialListId = Array.isArray(params.listId) ? params.listId[0] : params.listId;
    if (initialListId) {
      fetchList(Number(initialListId));
      return;
    }
    setLoading(false);
  }, [userId, params.listId]);

  useEffect(() => {
    if (!suggestionQuery.trim() && !lastAddedItem) {
      setSuggestions([]);
      return;
    }

    const itemToQuery = suggestionQuery.trim() || lastAddedItem || "";

    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/shopping/suggest?item=${encodeURIComponent(itemToQuery)}&userId=${userId}`);
        const data = await res.json();
        setSuggestions(Array.isArray(data) ? data.slice(0, 5) : []);
      } catch (err) {
        setSuggestions([]);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [suggestionQuery, lastAddedItem, userId]);

  const handleGenerateList = async () => {
    if (!userId || generating) return;

    setGenerating(true);
    try {
      const res = await fetch(`${API_BASE_URL}/shopping-list/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          numDays: Number.parseFloat(daysToPlan || "7"),
          numMembers: 1,
          dietType: "Standard",
          useExistingStock: listMode === "stock",
          categories: selectedCategories.length > 0 ? selectedCategories : null,
        }),
      });
      const data = await res.json();
      if (!data?.success || !data.listId) {
        Alert.alert("List generation failed", data?.message || "Try again.");
        return;
      }
      await fetchList(Number(data.listId));
    } catch (err) {
      Alert.alert("List generation failed", "Server error. Try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleAddItem = async () => {
    if (!listId || !newItemName.trim()) {
      Alert.alert("Missing item", "Enter an item name first.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/shopping-list/${listId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemName: newItemName.trim(),
          quantity: Number.parseFloat(newItemQty || "1"),
          unit: newItemUnit || "kg",
          category: newItemCategory || "Other",
        }),
      });
      const data = await res.json();
      if (!data?.success) {
        Alert.alert("Add failed", "Could not add item.");
        return;
      }
      setNewItemName("");
      setNewItemQty("1");
      setNewItemUnit("kg");
      setNewItemCategory("Staples");
      setShowAddModal(false);
      setLastAddedItem(newItemName.trim());
      await fetchList(listId, true);
    } catch (err) {
      Alert.alert("Add failed", "Server error. Try again.");
    }
  };

  const handleSuggestAdd = async (suggestion: QuickSuggestion) => {
    if (!listId) return;

    try {
      const res = await fetch(`${API_BASE_URL}/shopping-list/${listId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemName: suggestion.item_name,
          quantity: 1,
          unit: suggestion.consumption_unit || "kg",
          category: suggestion.category || "Other",
        }),
      });
      const data = await res.json();
      if (data?.success) {
        setSuggestionQuery("");
        setLastAddedItem(suggestion.item_name);
        await fetchList(listId, true);
      } else {
        await fetchList(listId, true);
      }
    } catch (err) {
      Alert.alert("Suggestion failed", "Could not add suggested item.");
    }
  };

  const toggleSelected = async (item: ShoppingItem) => {
    if (!listId) return;
    const nextSelected = item.is_selected === 0;
    setItems((prev) =>
      prev.map((entry) =>
        entry.item_id === item.item_id ? { ...entry, is_selected: nextSelected ? 1 : 0 } : entry
      )
    );

    try {
      await fetch(`${API_BASE_URL}/shopping-list/items/${item.item_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSelected: nextSelected }),
      });
    } catch (err) {
      await fetchList(listId, true);
    }
  };

  const handleUpdateQuantity = async () => {
    if (!activeItem || !listId) return;

    const qty = Number.parseFloat(adjustedQty || "0");
    if (!Number.isFinite(qty) || qty <= 0) {
      Alert.alert("Invalid quantity", "Enter a valid quantity.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/shopping-list/items/${activeItem.item_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adjustedQuantity: qty }),
      });
      const data = await res.json();
      if (!data?.success) {
        Alert.alert("Update failed", "Could not update item quantity.");
        return;
      }
      setShowAdjustModal(false);
      setActiveItem(null);
      setAdjustedQty("");
      await fetchList(listId, true);
    } catch (err) {
      Alert.alert("Update failed", "Server error. Try again.");
    }
  };

  const handleDeleteItem = (item: ShoppingItem) => {
    Alert.alert("Remove item?", item.item_name, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (!listId) return;
          try {
            const res = await fetch(`${API_BASE_URL}/shopping-list/items/${item.item_id}`, { method: "DELETE" });
            const data = await res.json();
            if (data?.success) await fetchList(listId, true);
          } catch (err) {
            Alert.alert("Delete failed", "Server error. Try again.");
          }
        },
      },
    ]);
  };

  const handleConfirmList = async () => {
    if (!listId || confirming) return;

    Alert.alert("Confirm shopping list?", "This will add the selected items to your inventory.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        onPress: async () => {
          setConfirming(true);
          try {
            const res = await fetch(`${API_BASE_URL}/shopping-list/${listId}/confirm`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                items: items
                  .filter((item) => item.is_selected !== 0)
                  .map((item) => ({
                    name: item.item_name,
                    qty: item.adjusted_quantity ?? item.suggested_quantity ?? 1,
                    unit: item.consumption_unit,
                    category: item.category,
                  })),
              }),
            });
            const data = await res.json();
            if (!data?.success) {
              Alert.alert("Confirm failed", data?.message || "Try again.");
              return;
            }
            const itemsConfirmed = items
              .filter((item) => item.is_selected !== 0)
              .map((item) => ({
                name: item.item_name,
                qty: item.adjusted_quantity ?? item.suggested_quantity ?? 1,
                unit: item.consumption_unit || "kg",
              }));
            setConfirmedItemsList(itemsConfirmed);
            setConfirmedItemsCount(data.count || itemsConfirmed.length);
            setShowSuccessModal(true);
            await fetchList(listId, true);
          } catch (err) {
            Alert.alert("Confirm failed", "Server error. Try again.");
          } finally {
            setConfirming(false);
          }
        },
      },
    ]);
  };

  if (!userId) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyState}>
          <AlertCircle size={48} color={colors.text3} />
          <Text style={styles.emptyTitle}>Session expired</Text>
          <Text style={styles.emptyBody}>Please log in again.</Text>
          <Pressable style={styles.primaryButton} onPress={() => router.replace("/login")}>
            <Text style={styles.primaryButtonText}>Go to login</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}>
          <ArrowLeft size={24} color={colors.text1} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Shopping List</Text>
          <Text style={styles.subtitle}>
            {list ? list.list_name || `List #${list.list_id}` : "Generate Plan"}
          </Text>
        </View>
        <View style={styles.badgeWrap}>
          <Text style={styles.badgeText}>{checkedCount}/{items.length}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.accent1} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {!list ? (
            /* Generator Card */
            <View style={styles.generatorCard}>
              <View style={styles.generatorHeader}>
                <PackageSearch size={24} color={colors.accent1} />
                <Text style={styles.sectionTitle}>Create New List</Text>
              </View>
              <Text style={styles.sectionBody}>
                Generate a smart shopping list based on your current pantry stock or from the full catalog.
              </Text>

              <View style={styles.segmentedControl}>
                <Pressable
                  style={[styles.segmentBtn, listMode === "stock" && styles.segmentBtnActive]}
                  onPress={() => setListMode("stock")}
                >
                  <Text style={[styles.segmentText, listMode === "stock" && styles.segmentTextActive]}>
                    Use Stock
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.segmentBtn, listMode === "catalog" && styles.segmentBtnActive]}
                  onPress={() => setListMode("catalog")}
                >
                  <Text style={[styles.segmentText, listMode === "catalog" && styles.segmentTextActive]}>
                    Use Catalog
                  </Text>
                </Pressable>
              </View>

              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>DAYS TO PLAN FOR</Text>
                <TextInput
                  value={daysToPlan}
                  onChangeText={setDaysToPlan}
                  placeholder="e.g. 7"
                  placeholderTextColor={colors.text3}
                  keyboardType="number-pad"
                  style={styles.textInput}
                />
              </View>

              {listMode === "catalog" && (
                <View style={{ marginTop: 8 }}>
                  <Text style={styles.inputLabel}>FILTER CATEGORIES (OPTIONAL)</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                    {categories.map((cat) => {
                      const isActive = selectedCategories.includes(cat);
                      return (
                        <Pressable
                          key={cat}
                          style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                          onPress={() => {
                            if (isActive) setSelectedCategories((prev) => prev.filter((c) => c !== cat));
                            else setSelectedCategories((prev) => [...prev, cat]);
                          }}
                        >
                          <Text style={[styles.categoryChipText, isActive && styles.categoryChipTextActive]}>
                            {cat}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                  <Text style={styles.helperText}>Leave empty to include all items.</Text>
                </View>
              )}

              <Pressable
                style={[styles.primaryButton, { marginTop: 12 }, generating && styles.disabledButton]}
                onPress={handleGenerateList}
                disabled={generating}
              >
                {generating ? <ActivityIndicator size="small" color={colors.bg} /> : <ListChecks size={20} color={colors.bg} />}
                <Text style={styles.primaryButtonText}>
                  {generating ? "Generating..." : "Generate List"}
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              {/* Active List Stats */}
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Total Items</Text>
                  <Text style={styles.statValue}>{items.length}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Selected</Text>
                  <Text style={styles.statValue}>{checkedCount}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Source</Text>
                  <Text style={styles.statValueSmall} numberOfLines={1}>{list.created_from || "catalog"}</Text>
                </View>
              </View>

              {/* Smart Add Section */}
              <View style={styles.sectionCard}>
                <View style={styles.addHeaderRow}>
                  <Text style={styles.sectionTitle}>Add Items</Text>
                  <Pressable style={styles.manualAddBtn} onPress={() => setShowAddModal(true)}>
                    <Plus size={16} color={colors.bg} />
                    <Text style={styles.manualAddBtnText}>Manual Add</Text>
                  </Pressable>
                </View>

                <View style={styles.searchWrap}>
                  <Search size={18} color={colors.text3} style={styles.searchIcon} />
                  <TextInput
                    value={suggestionQuery}
                    onChangeText={setSuggestionQuery}
                    placeholder="Search smart catalog..."
                    placeholderTextColor={colors.text3}
                    style={styles.searchInput}
                  />
                </View>

                {suggestions.length > 0 && (
                  <View style={styles.suggestionList}>
                    {!suggestionQuery.trim() && lastAddedItem && (
                      <Text style={[styles.sectionTitle, { fontSize: 13, color: colors.accent1, marginBottom: 8 }]}>
                        Because you bought {lastAddedItem}
                      </Text>
                    )}
                    {suggestions.map((item) => (
                      <View key={item.item_name} style={styles.suggestionRow}>
                        <View style={styles.suggestionInfo}>
                          <Text style={styles.suggestionTitle}>{item.item_name}</Text>
                          <Text style={styles.suggestionMeta}>
                            {item.confidence ? `${item.confidence}% match • ${item.reason}` : (item.category || "Other")}
                          </Text>
                        </View>
                        <Pressable style={styles.suggestionAddBtn} onPress={() => handleSuggestAdd(item)}>
                          <Plus size={16} color={colors.accent1} />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* List Items */}
              <View style={styles.listCard}>
                <View style={styles.listHeaderRow}>
                  <Text style={styles.sectionTitle}>Your Items</Text>
                  <Pressable onPress={() => fetchList(listId, true)} style={styles.refreshBtn}>
                    <RefreshCw size={16} color={colors.text2} style={refreshing && { opacity: 0.5 }} />
                  </Pressable>
                </View>

                {items.length === 0 ? (
                  <View style={styles.emptyListWrap}>
                    <ShoppingCart size={40} color={colors.surface3} />
                    <Text style={styles.emptyListText}>No items on this list yet.</Text>
                  </View>
                ) : (
                  items.map((item, index) => {
                    const selected = item.is_selected !== 0;
                    return (
                      <View key={item.item_id} style={[styles.itemRow, index === items.length - 1 && { borderBottomWidth: 0 }]}>
                        <Pressable style={styles.itemMain} onPress={() => toggleSelected(item)}>
                          {selected ? (
                            <CheckCircle2 size={24} color={colors.accent1} />
                          ) : (
                            <Circle size={24} color={colors.text3} />
                          )}
                          <View style={styles.itemTextWrap}>
                            <Text style={[styles.itemName, selected && styles.itemNameDone]} numberOfLines={1}>
                              {item.item_name}
                            </Text>
                            <Text style={styles.itemMeta}>
                              {item.category || "Other"} • {item.consumption_unit || "unit"}
                            </Text>
                          </View>
                        </Pressable>

                        <View style={styles.itemActions}>
                          <Pressable
                            style={styles.qtyPill}
                            onPress={() => {
                              setActiveItem(item);
                              setAdjustedQty(String(item.adjusted_quantity ?? item.suggested_quantity ?? 1));
                              setShowAdjustModal(true);
                            }}
                          >
                            <Text style={styles.qtyPillText}>
                              {Number(item.adjusted_quantity ?? item.suggested_quantity ?? 1)}
                            </Text>
                          </Pressable>
                          <Pressable onPress={() => handleDeleteItem(item)} style={styles.deleteBtn}>
                            <Trash2 size={18} color="#EF4444" />
                          </Pressable>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>

              <Pressable
                style={[styles.primaryButton, confirming && styles.disabledButton]}
                onPress={handleConfirmList}
                disabled={confirming}
              >
                {confirming ? <ActivityIndicator size="small" color={colors.bg} /> : <ShoppingCart size={20} color={colors.bg} />}
                <Text style={styles.primaryButtonText}>
                  {confirming ? "Confirming..." : "Confirm & Save List"}
                </Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      )}

      {/* Modals */}
      <AddShoppingItemModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddItem}
        itemName={newItemName}
        onItemNameChange={setNewItemName}
        qty={newItemQty}
        onQtyChange={setNewItemQty}
        unit={newItemUnit}
        onUnitChange={setNewItemUnit}
        category={newItemCategory}
        onCategoryChange={setNewItemCategory}
        categories={categories}
      />

      <AdjustQuantityModal
        visible={showAdjustModal}
        onClose={() => setShowAdjustModal(false)}
        onSave={handleUpdateQuantity}
        itemName={activeItem?.item_name || ""}
        qty={adjustedQty}
        onQtyChange={setAdjustedQty}
      />

      <SuccessModal
        visible={showSuccessModal}
        confirmedItemsCount={confirmedItemsCount}
        confirmedItemsList={confirmedItemsList}
        onDone={() => {
          setShowSuccessModal(false);
          router.push({
            pathname: "/home",
            params: { userId: String(userId), name: displayName ?? "", refresh: Date.now() },
          });
        }}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    // Header
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.bg,
    },
    iconButton: {
      padding: 8,
      marginLeft: -8,
    },
    headerCenter: {
      flex: 1,
      alignItems: "center",
    },
    title: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.text1,
      letterSpacing: -0.5,
    },
    subtitle: {
      color: colors.text2,
      fontSize: 12,
      fontWeight: "500",
      marginTop: 2,
    },
    badgeWrap: {
      backgroundColor: colors.surface2,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    badgeText: {
      color: colors.text1,
      fontSize: 12,
      fontWeight: "700",
    },

    // Globals
    loadingWrap: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    content: {
      padding: 20,
      gap: 20,
      paddingBottom: 40,
    },
    sectionTitle: {
      color: colors.text1,
      fontSize: 18,
      fontWeight: "700",
      letterSpacing: -0.3,
    },
    sectionBody: {
      color: colors.text2,
      fontSize: 14,
      lineHeight: 22,
      marginTop: 4,
    },
    inputLabel: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.text3,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: 6,
    },
    helperText: {
      fontSize: 11,
      color: colors.text3,
      marginTop: 6,
    },

    // Buttons
    primaryButton: {
      flexDirection: "row",
      backgroundColor: colors.accent1,
      borderRadius: 14,
      paddingVertical: 16,
      paddingHorizontal: 24,
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    primaryButtonText: {
      color: colors.bg,
      fontWeight: "700",
      fontSize: 16,
    },
    disabledButton: {
      opacity: 0.6,
    },

    // Generator Card
    generatorCard: {
      backgroundColor: colors.surface1,
      borderRadius: 24,
      padding: 24,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 20,
    },
    generatorHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: -8,
    },
    segmentedControl: {
      flexDirection: "row",
      backgroundColor: colors.bg,
      borderRadius: 12,
      padding: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    segmentBtn: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 10,
      borderRadius: 8,
    },
    segmentBtnActive: {
      backgroundColor: colors.surface2,
    },
    segmentText: {
      color: colors.text2,
      fontSize: 14,
      fontWeight: "600",
    },
    segmentTextActive: {
      color: colors.text1,
    },
    inputWrap: {
      marginTop: 4,
    },
    textInput: {
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      color: colors.text1,
      fontSize: 15,
      fontWeight: "500",
    },
    chipRow: {
      gap: 8,
      paddingVertical: 4,
    },
    categoryChip: {
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 100,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    categoryChipActive: {
      backgroundColor: colors.accent1,
      borderColor: colors.accent1,
    },
    categoryChipText: {
      color: colors.text2,
      fontSize: 13,
      fontWeight: "600",
    },
    categoryChipTextActive: {
      color: colors.bg,
    },

    // Stats Row
    statsRow: {
      flexDirection: "row",
      gap: 12,
    },
    statBox: {
      flex: 1,
      backgroundColor: colors.surface1,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statLabel: {
      color: colors.text2,
      fontSize: 12,
      fontWeight: "600",
      marginBottom: 6,
    },
    statValue: {
      color: colors.text1,
      fontSize: 24,
      fontWeight: "800",
    },
    statValueSmall: {
      color: colors.text1,
      fontSize: 16,
      fontWeight: "700",
      marginTop: 6,
      textTransform: "capitalize",
    },

    // Section Card (Smart Add)
    sectionCard: {
      backgroundColor: colors.surface1,
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 16,
    },
    addHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    manualAddBtn: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.text1,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 100,
      gap: 6,
    },
    manualAddBtnText: {
      color: colors.bg,
      fontSize: 12,
      fontWeight: "700",
    },
    searchWrap: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
    },
    searchIcon: {
      marginRight: 10,
    },
    searchInput: {
      flex: 1,
      height: 48,
      color: colors.text1,
      fontSize: 15,
    },
    suggestionList: {
      backgroundColor: colors.bg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    suggestionRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.surface2,
    },
    suggestionInfo: {
      flex: 1,
    },
    suggestionTitle: {
      color: colors.text1,
      fontSize: 14,
      fontWeight: "600",
    },
    suggestionMeta: {
      color: colors.text3,
      fontSize: 12,
      marginTop: 2,
    },
    suggestionAddBtn: {
      padding: 8,
      backgroundColor: "rgba(16, 185, 129, 0.1)",
      borderRadius: 8,
    },

    // List Card
    listCard: {
      backgroundColor: colors.surface1,
      borderRadius: 24,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    listHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    refreshBtn: {
      padding: 4,
    },
    emptyListWrap: {
      padding: 40,
      alignItems: "center",
      gap: 12,
    },
    emptyListText: {
      color: colors.text3,
      fontSize: 15,
      fontWeight: "500",
    },
    itemRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.surface2,
    },
    itemMain: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      gap: 12,
      paddingRight: 10,
    },
    itemTextWrap: {
      flex: 1,
    },
    itemName: {
      color: colors.text1,
      fontSize: 15,
      fontWeight: "600",
    },
    itemNameDone: {
      color: colors.text3,
      textDecorationLine: "line-through",
    },
    itemMeta: {
      color: colors.text3,
      fontSize: 12,
      marginTop: 4,
      textTransform: "capitalize",
    },
    itemActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    qtyPill: {
      backgroundColor: colors.surface2,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 100,
      borderWidth: 1,
      borderColor: colors.border,
    },
    qtyPillText: {
      color: colors.text1,
      fontSize: 13,
      fontWeight: "700",
    },
    deleteBtn: {
      padding: 6,
    },

    // Empty States (Session Expired)
    emptyState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      paddingHorizontal: 32,
    },
    emptyTitle: {
      color: colors.text1,
      fontSize: 18,
      fontWeight: "700",
      textAlign: "center",
    },
    emptyBody: {
      color: colors.text2,
      fontSize: 14,
      textAlign: "center",
      lineHeight: 22,
      marginBottom: 8,
    },
  });