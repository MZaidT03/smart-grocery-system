import { API_BASE_URL } from "@/constants/api";
import { useTheme } from "@/context/theme";
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
  const userId = Array.isArray(params.userId)
    ? params.userId[0]
    : params.userId;

  const [list, setList] = useState<ShoppingList | null>(null);
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [listMode, setListMode] = useState<"stock" | "catalog">("stock");
  const [daysToPlan, setDaysToPlan] = useState("7");

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

  const listId = list?.list_id;
  const checkedCount = items.filter((item) => item.is_selected !== 0).length;

  const fetchList = async (targetListId?: number, isRefresh = false) => {
    if (!targetListId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

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

    const initialListId = Array.isArray(params.listId)
      ? params.listId[0]
      : params.listId;

    if (initialListId) {
      fetchList(Number(initialListId));
      return;
    }

    setLoading(false);
  }, [userId, params.listId]);

  useEffect(() => {
    if (!suggestionQuery.trim()) {
      setSuggestions([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/shopping/suggest?item=${encodeURIComponent(suggestionQuery)}`,
        );
        const data = await res.json();
        setSuggestions(Array.isArray(data) ? data.slice(0, 5) : []);
      } catch (err) {
        setSuggestions([]);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [suggestionQuery]);

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
        setSuggestions([]);
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
        entry.item_id === item.item_id
          ? { ...entry, is_selected: nextSelected ? 1 : 0 }
          : entry,
      ),
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
      const res = await fetch(
        `${API_BASE_URL}/shopping-list/items/${activeItem.item_id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adjustedQuantity: qty }),
        },
      );
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
            const res = await fetch(
              `${API_BASE_URL}/shopping-list/items/${item.item_id}`,
              {
                method: "DELETE",
              },
            );
            const data = await res.json();
            if (data?.success) {
              await fetchList(listId, true);
            }
          } catch (err) {
            Alert.alert("Delete failed", "Server error. Try again.");
          }
        },
      },
    ]);
  };

  const handleConfirmList = async () => {
    if (!listId || confirming) return;

    Alert.alert("Confirm shopping list?", "This will add items to inventory.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        onPress: async () => {
          setConfirming(true);
          try {
            const res = await fetch(
              `${API_BASE_URL}/shopping-list/${listId}/confirm`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  items: items
                    .filter((item) => item.is_selected !== 0)
                    .map((item) => ({
                      name: item.item_name,
                      qty:
                        item.adjusted_quantity ?? item.suggested_quantity ?? 1,
                      unit: item.consumption_unit,
                      category: item.category,
                    })),
                }),
              },
            );
            const data = await res.json();
            if (!data?.success) {
              Alert.alert("Confirm failed", data?.message || "Try again.");
              return;
            }
            Alert.alert(
              "Completed",
              `Added ${data.count || 0} items to inventory.`,
            );
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
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Shopping List</Text>
          <Text style={styles.subtitle}>
            {list
              ? list.list_name || `List ${list.list_id}`
              : "Generate a list"}
          </Text>
        </View>
        <Text style={styles.count}>{checkedCount}</Text>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.accent1} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {!list ? (
            <View style={styles.generatorCard}>
              <Text style={styles.sectionTitle}>Create new list</Text>
              <Text style={styles.sectionBody}>
                Generate a list from your pantry stock or from the catalog.
              </Text>

              <View style={styles.toggleRow}>
                <Pressable
                  style={[
                    styles.toggleChip,
                    listMode === "stock" && styles.toggleChipActive,
                  ]}
                  onPress={() => setListMode("stock")}
                >
                  <Text
                    style={[
                      styles.toggleChipText,
                      listMode === "stock" && styles.toggleChipTextActive,
                    ]}
                  >
                    Use stock
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.toggleChip,
                    listMode === "catalog" && styles.toggleChipActive,
                  ]}
                  onPress={() => setListMode("catalog")}
                >
                  <Text
                    style={[
                      styles.toggleChipText,
                      listMode === "catalog" && styles.toggleChipTextActive,
                    ]}
                  >
                    Use catalog
                  </Text>
                </Pressable>
              </View>

              <TextInput
                value={daysToPlan}
                onChangeText={setDaysToPlan}
                placeholder="Days to plan"
                placeholderTextColor={colors.text3}
                keyboardType="number-pad"
                style={styles.input}
              />

              <Pressable
                style={[
                  styles.primaryButton,
                  generating && styles.disabledButton,
                ]}
                onPress={handleGenerateList}
                disabled={generating}
              >
                <Text style={styles.primaryButtonText}>
                  {generating ? "Generating..." : "Generate shopping list"}
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Items</Text>
                  <Text style={styles.statValue}>{items.length}</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Selected</Text>
                  <Text style={styles.statValue}>{checkedCount}</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Source</Text>
                  <Text style={styles.statValueSmall}>
                    {list.created_from || "catalog"}
                  </Text>
                </View>
              </View>

              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Add item manually</Text>
                <Text style={styles.sectionBody}>
                  Quickly add a missing ingredient to your list.
                </Text>
                <Pressable
                  style={styles.secondaryButton}
                  onPress={() => setShowAddModal(true)}
                >
                  <Text style={styles.secondaryButtonText}>Add item</Text>
                </Pressable>
              </View>

              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Smart suggestions</Text>
                <TextInput
                  value={suggestionQuery}
                  onChangeText={setSuggestionQuery}
                  placeholder="Search suggestion"
                  placeholderTextColor={colors.text3}
                  style={styles.input}
                />
                {suggestions.length > 0 && (
                  <View style={styles.suggestionList}>
                    {suggestions.map((item) => (
                      <Pressable
                        key={item.item_name}
                        style={styles.suggestionRow}
                        onPress={() => handleSuggestAdd(item)}
                      >
                        <View>
                          <Text style={styles.suggestionTitle}>
                            {item.item_name}
                          </Text>
                          <Text style={styles.suggestionMeta}>
                            {item.category || "Other"}
                          </Text>
                        </View>
                        <Text style={styles.suggestionAction}>Add</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Current items</Text>
                  <Pressable onPress={() => fetchList(listId, true)}>
                    <Text style={styles.sectionLink}>Refresh</Text>
                  </Pressable>
                </View>

                {items.length === 0 ? (
                  <Text style={styles.sectionBody}>
                    No items on this list yet.
                  </Text>
                ) : (
                  items.map((item) => {
                    const selected = item.is_selected !== 0;
                    return (
                      <View key={item.item_id} style={styles.itemRow}>
                        <Pressable
                          style={styles.itemMain}
                          onPress={() => toggleSelected(item)}
                        >
                          <View
                            style={[
                              styles.checkbox,
                              selected && styles.checkboxActive,
                            ]}
                          >
                            <Text style={styles.checkboxText}>
                              {selected ? "✓" : ""}
                            </Text>
                          </View>
                          <View style={styles.itemTextWrap}>
                            <Text
                              style={[
                                styles.itemName,
                                selected && styles.itemNameDone,
                              ]}
                              numberOfLines={1}
                            >
                              {item.item_name}
                            </Text>
                            <Text style={styles.itemMeta}>
                              {item.category || "Other"} ·{" "}
                              {item.consumption_unit || "kg"}
                            </Text>
                          </View>
                        </Pressable>

                        <View style={styles.itemActions}>
                          <Pressable
                            style={styles.qtyPill}
                            onPress={() => {
                              setActiveItem(item);
                              setAdjustedQty(
                                String(
                                  item.adjusted_quantity ??
                                    item.suggested_quantity ??
                                    1,
                                ),
                              );
                              setShowAdjustModal(true);
                            }}
                          >
                            <Text style={styles.qtyPillText}>
                              {Number(
                                item.adjusted_quantity ??
                                  item.suggested_quantity ??
                                  1,
                              )}
                            </Text>
                          </Pressable>
                          <Pressable onPress={() => handleDeleteItem(item)}>
                            <Text style={styles.deleteText}>Delete</Text>
                          </Pressable>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>

              <Pressable
                style={[
                  styles.primaryButton,
                  confirming && styles.disabledButton,
                ]}
                onPress={handleConfirmList}
                disabled={confirming}
              >
                <Text style={styles.primaryButtonText}>
                  {confirming ? "Confirming..." : "Confirm list"}
                </Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      )}

      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add item</Text>
            <TextInput
              value={newItemName}
              onChangeText={setNewItemName}
              placeholder="Item name"
              placeholderTextColor={colors.text3}
              style={styles.input}
            />
            <TextInput
              value={newItemQty}
              onChangeText={setNewItemQty}
              placeholder="Quantity"
              placeholderTextColor={colors.text3}
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <TextInput
              value={newItemUnit}
              onChangeText={setNewItemUnit}
              placeholder="Unit"
              placeholderTextColor={colors.text3}
              style={styles.input}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {categories.map((category) => (
                <Pressable
                  key={category}
                  style={[
                    styles.categoryChip,
                    newItemCategory === category && styles.categoryChipActive,
                  ]}
                  onPress={() => setNewItemCategory(category)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      newItemCategory === category &&
                        styles.categoryChipTextActive,
                    ]}
                  >
                    {category}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <View style={styles.modalActions}>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.primaryButton} onPress={handleAddItem}>
                <Text style={styles.primaryButtonText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showAdjustModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Adjust quantity</Text>
            <Text style={styles.sectionBody}>{activeItem?.item_name}</Text>
            <TextInput
              value={adjustedQty}
              onChangeText={setAdjustedQty}
              placeholder="Adjusted quantity"
              placeholderTextColor={colors.text3}
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <View style={styles.modalActions}>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => setShowAdjustModal(false)}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.primaryButton}
                onPress={handleUpdateQuantity}
              >
                <Text style={styles.primaryButtonText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    headerRow: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    headerCenter: {
      flex: 1,
      alignItems: "center",
    },
    backButton: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      backgroundColor: colors.surface1,
    },
    backButtonText: {
      color: colors.text1,
      fontWeight: "600",
    },
    title: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text1,
      textAlign: "center",
    },
    subtitle: {
      color: colors.text2,
      fontSize: 12,
      marginTop: 4,
      textAlign: "center",
    },
    count: {
      minWidth: 28,
      textAlign: "center",
      fontWeight: "700",
      color: colors.accent1,
    },
    content: {
      padding: 20,
      gap: 14,
      paddingBottom: 28,
    },
    loadingWrap: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    generatorCard: {
      backgroundColor: colors.surface1,
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12,
    },
    sectionCard: {
      backgroundColor: colors.surface1,
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12,
    },
    sectionHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    sectionTitle: {
      color: colors.text1,
      fontSize: 16,
      fontWeight: "700",
    },
    sectionBody: {
      color: colors.text2,
      fontSize: 13,
      lineHeight: 20,
    },
    sectionLink: {
      color: colors.accent1,
      fontWeight: "700",
      fontSize: 12,
    },
    toggleRow: {
      flexDirection: "row",
      gap: 10,
    },
    toggleChip: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
      borderRadius: 999,
      paddingVertical: 12,
      alignItems: "center",
    },
    toggleChipActive: {
      backgroundColor: colors.accent1,
      borderColor: colors.accent1,
    },
    toggleChipText: {
      color: colors.text1,
      fontWeight: "700",
      fontSize: 13,
    },
    toggleChipTextActive: {
      color: colors.bg,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
      color: colors.text1,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 14,
    },
    primaryButton: {
      backgroundColor: colors.accent1,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: "center",
    },
    secondaryButton: {
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: "center",
      flex: 1,
    },
    secondaryButtonText: {
      color: colors.text1,
      fontWeight: "700",
      fontSize: 14,
    },
    primaryButtonText: {
      color: colors.bg,
      fontWeight: "700",
      fontSize: 14,
    },
    disabledButton: {
      opacity: 0.6,
    },
    statsRow: {
      flexDirection: "row",
      gap: 10,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.surface1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 12,
    },
    statLabel: {
      color: colors.text2,
      fontSize: 10,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      fontWeight: "700",
    },
    statValue: {
      color: colors.text1,
      fontSize: 22,
      fontWeight: "800",
      marginTop: 6,
    },
    statValueSmall: {
      color: colors.text1,
      fontSize: 14,
      fontWeight: "700",
      marginTop: 8,
      textTransform: "capitalize",
    },
    suggestionList: {
      gap: 8,
    },
    suggestionRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 10,
      paddingHorizontal: 12,
      backgroundColor: colors.surface2,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    suggestionTitle: {
      color: colors.text1,
      fontWeight: "700",
      fontSize: 14,
    },
    suggestionMeta: {
      color: colors.text2,
      marginTop: 2,
      fontSize: 12,
    },
    suggestionAction: {
      color: colors.accent1,
      fontWeight: "700",
      fontSize: 12,
    },
    itemRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    itemMain: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      flex: 1,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface2,
    },
    checkboxActive: {
      backgroundColor: colors.accent1,
      borderColor: colors.accent1,
    },
    checkboxText: {
      color: colors.bg,
      fontWeight: "800",
      fontSize: 12,
    },
    itemTextWrap: {
      flex: 1,
    },
    itemName: {
      color: colors.text1,
      fontWeight: "700",
      fontSize: 14,
    },
    itemNameDone: {
      color: colors.text3,
      textDecorationLine: "line-through",
    },
    itemMeta: {
      color: colors.text2,
      fontSize: 12,
      marginTop: 4,
    },
    itemActions: {
      alignItems: "flex-end",
      gap: 6,
    },
    qtyPill: {
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    qtyPillText: {
      color: colors.text1,
      fontWeight: "700",
      fontSize: 12,
    },
    deleteText: {
      color: colors.danger,
      fontWeight: "700",
      fontSize: 12,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
      padding: 16,
    },
    modalCard: {
      backgroundColor: colors.bg,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      gap: 12,
    },
    modalTitle: {
      color: colors.text1,
      fontSize: 18,
      fontWeight: "800",
    },
    modalActions: {
      flexDirection: "row",
      gap: 10,
      marginTop: 4,
    },
    chipRow: {
      gap: 10,
      paddingVertical: 4,
    },
    categoryChip: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    categoryChipActive: {
      backgroundColor: colors.accent1,
      borderColor: colors.accent1,
    },
    categoryChipText: {
      color: colors.text1,
      fontWeight: "700",
      fontSize: 12,
    },
    categoryChipTextActive: {
      color: colors.bg,
    },
    emptyState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingHorizontal: 22,
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
    },
  });
