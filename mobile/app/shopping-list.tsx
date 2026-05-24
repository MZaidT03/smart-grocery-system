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
  RefreshControl,
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
  Sparkles,
  CalendarDays,
  Users,
  ClipboardCheck,
  X,
  WandSparkles,
  PackagePlus,
  SlidersHorizontal,
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
  confidence?: number;
  reason?: string;
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
  const [confirmedItemsList, setConfirmedItemsList] = useState<
    { name: string; qty: number; unit: string }[]
  >([]);

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
  const [isSuggesting, setIsSuggesting] = useState(false);

  const [itemSearchQuery, setItemSearchQuery] = useState("");

  const listId = list?.list_id;

  const checkedCount = useMemo(
    () => items.filter((item) => item.is_selected !== 0).length,
    [items],
  );

  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? checkedCount / totalCount : 0;

  const filteredItems = useMemo(() => {
    const query = itemSearchQuery.trim().toLowerCase();

    if (!query) return items;

    return items.filter((item) => {
      const searchable = `${item.item_name} ${item.category ?? ""} ${item.consumption_unit ?? ""
        }`.toLowerCase();

      return searchable.includes(query);
    });
  }, [items, itemSearchQuery]);

  const allItemsSelected = totalCount > 0 && checkedCount === totalCount;

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
    } catch {
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
    if (!suggestionQuery.trim() && !lastAddedItem) {
      setSuggestions([]);
      setIsSuggesting(false);
      return;
    }

    const itemToQuery = suggestionQuery.trim() || lastAddedItem || "";

    setIsSuggesting(true);

    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/shopping/suggest?item=${encodeURIComponent(
            itemToQuery,
          )}&userId=${userId}`,
        );

        const data = await res.json();

        if (Array.isArray(data)) {
          const existingNames = new Set(
            items.map((item) => item.item_name.toLowerCase()),
          );

          const filtered = data.filter(
            (suggestion: QuickSuggestion) =>
              !existingNames.has(suggestion.item_name.toLowerCase()),
          );

          setSuggestions(filtered.slice(0, 5));
        } else {
          setSuggestions([]);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setIsSuggesting(false);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [suggestionQuery, lastAddedItem, userId, items]);

  const handleGenerateList = async () => {
    if (!userId || generating) return;

    const days = Number.parseFloat(daysToPlan || "7");

    if (!Number.isFinite(days) || days <= 0) {
      Alert.alert("Invalid days", "Enter a valid number of days.");
      return;
    }

    setGenerating(true);

    try {
      const res = await fetch(`${API_BASE_URL}/shopping-list/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          numDays: days,
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
    } catch {
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

      setLastAddedItem(newItemName.trim());
      setNewItemName("");
      setNewItemQty("1");
      setNewItemUnit("kg");
      setNewItemCategory("Staples");
      setShowAddModal(false);

      await fetchList(listId, true);
    } catch {
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
      }

      await fetchList(listId, true);
    } catch {
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
    } catch {
      await fetchList(listId, true);
    }
  };

  const handleToggleAllItems = async () => {
    if (!listId || items.length === 0) return;

    const nextSelected = !allItemsSelected;

    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        is_selected: nextSelected ? 1 : 0,
      })),
    );

    try {
      await Promise.all(
        items.map((item) =>
          fetch(`${API_BASE_URL}/shopping-list/items/${item.item_id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isSelected: nextSelected }),
          }),
        ),
      );
    } catch {
      await fetchList(listId, true);
    }
  };

  const handleClearChecked = async () => {
    if (!listId || checkedCount === 0) return;

    setItems((prev) => prev.map((item) => ({ ...item, is_selected: 0 })));

    try {
      await Promise.all(
        items
          .filter((item) => item.is_selected !== 0)
          .map((item) =>
            fetch(`${API_BASE_URL}/shopping-list/items/${item.item_id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ isSelected: false }),
            }),
          ),
      );
    } catch {
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
    } catch {
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
              { method: "DELETE" },
            );

            const data = await res.json();

            if (data?.success) {
              await fetchList(listId, true);
            }
          } catch {
            Alert.alert("Delete failed", "Server error. Try again.");
          }
        },
      },
    ]);
  };

  const handleConfirmList = async () => {
    if (!listId || confirming) return;

    if (checkedCount === 0) {
      Alert.alert(
        "No items selected",
        "Select at least one item before confirming your shopping list.",
      );
      return;
    }

    Alert.alert(
      "Confirm shopping list?",
      "Selected items will be added to your inventory.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            setConfirming(true);

            try {
              const selectedItems = items.filter(
                (item) => item.is_selected !== 0,
              );

              const res = await fetch(
                `${API_BASE_URL}/shopping-list/${listId}/confirm`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    items: selectedItems.map((item) => ({
                      name: item.item_name,
                      qty:
                        item.adjusted_quantity ??
                        item.suggested_quantity ??
                        1,
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

              const itemsConfirmed = selectedItems.map((item) => ({
                name: item.item_name,
                qty: item.adjusted_quantity ?? item.suggested_quantity ?? 1,
                unit: item.consumption_unit || "kg",
              }));

              setConfirmedItemsList(itemsConfirmed);
              setConfirmedItemsCount(data.count || itemsConfirmed.length);
              setShowSuccessModal(true);

              await fetchList(listId, true);
            } catch {
              Alert.alert("Confirm failed", "Server error. Try again.");
            } finally {
              setConfirming(false);
            }
          },
        },
      ],
    );
  };

  if (!userId) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyState}>
          <AlertCircle size={48} color={colors.text3} />
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
        <Pressable onPress={() => router.back()} style={styles.iconButton}>
          <ArrowLeft size={22} color={colors.text1} />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerEyebrow}>SmartGrocer</Text>
          <Text style={styles.title}>Shopping List</Text>
        </View>

        <View style={styles.badgeWrap}>
          <Text style={styles.badgeText}>
            {checkedCount}/{items.length}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.accent1} />
          <Text style={styles.loadingText}>Loading shopping list</Text>
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={[
              styles.content,
              list ? styles.contentWithBottomBar : null,
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              listId ? (
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => fetchList(listId, true)}
                  tintColor={colors.accent1}
                />
              ) : undefined
            }
          >
            {!list ? (
              <View style={styles.generatorCard}>
                <View style={styles.heroIconWrap}>
                  <View style={styles.heroIcon}>
                    <PackageSearch size={26} color={colors.accent1} />
                  </View>
                </View>

                <Text style={styles.generatorTitle}>Create a smart list</Text>

                <Text style={styles.generatorBody}>
                  Generate a grocery plan using your pantry stock or build from
                  the full catalog.
                </Text>

                <View style={styles.infoGrid}>
                  <View style={styles.infoMiniCard}>
                    <CalendarDays size={18} color={colors.accent1} />
                    <Text style={styles.infoMiniText}>Plan by days</Text>
                  </View>

                  <View style={styles.infoMiniCard}>
                    <Users size={18} color={colors.accent1} />
                    <Text style={styles.infoMiniText}>For household</Text>
                  </View>
                </View>

                <View style={styles.segmentedControl}>
                  <Pressable
                    style={[
                      styles.segmentBtn,
                      listMode === "stock" && styles.segmentBtnActive,
                    ]}
                    onPress={() => setListMode("stock")}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        listMode === "stock" && styles.segmentTextActive,
                      ]}
                    >
                      Use Stock
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.segmentBtn,
                      listMode === "catalog" && styles.segmentBtnActive,
                    ]}
                    onPress={() => setListMode("catalog")}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        listMode === "catalog" && styles.segmentTextActive,
                      ]}
                    >
                      Use Catalog
                    </Text>
                  </Pressable>
                </View>

                <View style={styles.inputWrap}>
                  <Text style={styles.inputLabel}>Days to plan for</Text>

                  <TextInput
                    value={daysToPlan}
                    onChangeText={setDaysToPlan}
                    placeholder="Example: 7"
                    placeholderTextColor={colors.text3}
                    keyboardType="number-pad"
                    style={styles.textInput}
                  />
                </View>

                {listMode === "catalog" && (
                  <View style={styles.categoryBlock}>
                    <Text style={styles.inputLabel}>
                      Filter categories optional
                    </Text>

                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.chipRow}
                    >
                      {categories.map((cat) => {
                        const isActive = selectedCategories.includes(cat);

                        return (
                          <Pressable
                            key={cat}
                            style={[
                              styles.categoryChip,
                              isActive && styles.categoryChipActive,
                            ]}
                            onPress={() => {
                              if (isActive) {
                                setSelectedCategories((prev) =>
                                  prev.filter((c) => c !== cat),
                                );
                              } else {
                                setSelectedCategories((prev) => [...prev, cat]);
                              }
                            }}
                          >
                            <Text
                              style={[
                                styles.categoryChipText,
                                isActive && styles.categoryChipTextActive,
                              ]}
                            >
                              {cat}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>

                    <Text style={styles.helperText}>
                      Leave empty to include all grocery items.
                    </Text>
                  </View>
                )}

                <Pressable
                  style={[
                    styles.primaryButton,
                    generating && styles.disabledButton,
                  ]}
                  onPress={handleGenerateList}
                  disabled={generating}
                >
                  {generating ? (
                    <ActivityIndicator size="small" color={colors.bg} />
                  ) : (
                    <ListChecks size={20} color={colors.bg} />
                  )}

                  <Text style={styles.primaryButtonText}>
                    {generating ? "Generating..." : "Generate List"}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <>
                <View style={styles.summaryCard}>
                  <View style={styles.summaryTopRow}>
                    <View>
                      <Text style={styles.summaryEyebrow}>
                        {list.created_from || "Smart plan"}
                      </Text>

                      <Text style={styles.summaryTitle} numberOfLines={1}>
                        {list.list_name || `List #${list.list_id}`}
                      </Text>
                    </View>

                    <View style={styles.summaryIcon}>
                      <ClipboardCheck size={22} color={colors.accent1} />
                    </View>
                  </View>

                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${progressPercent * 100}%` },
                      ]}
                    />
                  </View>

                  <View style={styles.summaryStatsRow}>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>Total</Text>
                      <Text style={styles.statValue}>{items.length}</Text>
                    </View>

                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>Selected</Text>
                      <Text style={styles.statValue}>{checkedCount}</Text>
                    </View>

                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>Days</Text>
                      <Text style={styles.statValue}>
                        {list.num_days || "-"}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeaderRow}>
                    <View>
                      <Text style={styles.sectionKicker}>Smart add</Text>
                      <Text style={styles.sectionTitle}>Add more items</Text>
                    </View>

                    <Pressable
                      style={styles.manualAddBtn}
                      onPress={() => setShowAddModal(true)}
                    >
                      <Plus size={16} color={colors.bg} />
                      <Text style={styles.manualAddBtnText}>Manual</Text>
                    </Pressable>
                  </View>

                  <View style={styles.searchWrap}>
                    <Search size={18} color={colors.text3} />

                    <TextInput
                      value={suggestionQuery}
                      onChangeText={setSuggestionQuery}
                      placeholder="Search smart catalog..."
                      placeholderTextColor={colors.text3}
                      style={styles.searchInput}
                    />

                    {!!suggestionQuery && (
                      <Pressable
                        onPress={() => setSuggestionQuery("")}
                        style={styles.clearBtn}
                      >
                        <X size={15} color={colors.text2} />
                      </Pressable>
                    )}
                  </View>

                  {isSuggesting ? (
                    <View style={styles.suggestingWrap}>
                      <ActivityIndicator size="small" color={colors.accent1} />
                      <Text style={styles.suggestingText}>
                        Looking for smart suggestions...
                      </Text>
                    </View>
                  ) : suggestions.length > 0 ? (
                    <View style={styles.suggestionList}>
                      {!suggestionQuery.trim() && lastAddedItem && (
                        <Text style={styles.suggestionReason}>
                          Because you added {lastAddedItem}
                        </Text>
                      )}

                      {suggestions.map((item) => (
                        <View key={item.item_name} style={styles.suggestionRow}>
                          <View style={styles.suggestionInfo}>
                            <Text style={styles.suggestionTitle}>
                              {item.item_name}
                            </Text>

                            <Text style={styles.suggestionMeta}>
                              {item.confidence
                                ? `${item.confidence}% match • ${item.reason || "Suggested item"
                                }`
                                : item.category || "Other"}
                            </Text>
                          </View>

                          <Pressable
                            style={styles.suggestionAddBtn}
                            onPress={() => handleSuggestAdd(item)}
                          >
                            <Plus size={17} color={colors.accent1} />
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>

                <View style={styles.listCard}>
                  <View style={styles.listHeaderRow}>
                    <View>
                      <Text style={styles.sectionKicker}>Items</Text>
                      <Text style={styles.sectionTitle}>Your shopping list</Text>
                    </View>

                    <Pressable
                      onPress={() => fetchList(listId, true)}
                      style={styles.refreshBtn}
                    >
                      <RefreshCw
                        size={17}
                        color={colors.text2}
                        style={refreshing ? { opacity: 0.5 } : undefined}
                      />
                    </Pressable>
                  </View>

                  <View style={styles.listTools}>
                    <View style={styles.searchWrapSmall}>
                      <Search size={17} color={colors.text3} />

                      <TextInput
                        value={itemSearchQuery}
                        onChangeText={setItemSearchQuery}
                        placeholder="Search list items"
                        placeholderTextColor={colors.text3}
                        style={styles.searchInput}
                      />

                      {!!itemSearchQuery && (
                        <Pressable
                          onPress={() => setItemSearchQuery("")}
                          style={styles.clearBtn}
                        >
                          <X size={15} color={colors.text2} />
                        </Pressable>
                      )}
                    </View>

                    <View style={styles.bulkActionsRow}>
                      <Pressable
                        style={styles.bulkBtn}
                        onPress={handleToggleAllItems}
                      >
                        <Text style={styles.bulkBtnText}>
                          {allItemsSelected ? "Unselect all" : "Select all"}
                        </Text>
                      </Pressable>

                      <Pressable
                        style={[
                          styles.bulkBtn,
                          checkedCount === 0 && styles.bulkBtnDisabled,
                        ]}
                        onPress={handleClearChecked}
                        disabled={checkedCount === 0}
                      >
                        <Text
                          style={[
                            styles.bulkBtnText,
                            checkedCount === 0 && styles.bulkBtnTextDisabled,
                          ]}
                        >
                          Clear
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  {filteredItems.length === 0 ? (
                    <View style={styles.emptyListWrap}>
                      <ShoppingCart size={40} color={colors.surface3} />
                      <Text style={styles.emptyListText}>
                        {itemSearchQuery
                          ? "No matching items found."
                          : "No items on this list yet."}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.itemsWrap}>
                      {filteredItems.map((item) => {
                        const selected = item.is_selected !== 0;
                        const qty =
                          item.adjusted_quantity ??
                          item.suggested_quantity ??
                          1;

                        return (
                          <View
                            key={item.item_id}
                            style={[
                              styles.itemCard,
                              selected && styles.itemCardSelected,
                            ]}
                          >
                            <Pressable
                              style={styles.itemMain}
                              onPress={() => toggleSelected(item)}
                            >
                              {selected ? (
                                <CheckCircle2
                                  size={24}
                                  color={colors.accent1}
                                />
                              ) : (
                                <Circle size={24} color={colors.text3} />
                              )}

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

                                <Text style={styles.itemMeta} numberOfLines={1}>
                                  {item.category || "Other"} •{" "}
                                  {item.consumption_unit || "unit"}
                                  {typeof item.current_stock === "number"
                                    ? ` • Stock ${item.current_stock}`
                                    : ""}
                                </Text>
                              </View>
                            </Pressable>

                            <View style={styles.itemActions}>
                              <Pressable
                                style={styles.qtyPill}
                                onPress={() => {
                                  setActiveItem(item);
                                  setAdjustedQty(String(qty));
                                  setShowAdjustModal(true);
                                }}
                              >
                                <Text style={styles.qtyPillText}>{qty}</Text>
                              </Pressable>

                              <Pressable
                                onPress={() => handleDeleteItem(item)}
                                style={styles.deleteBtn}
                              >
                                <Trash2 size={18} color="#EF4444" />
                              </Pressable>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              </>
            )}
          </ScrollView>

          {list && (
            <View style={styles.bottomBar}>
              <View style={styles.bottomCopy}>
                <Text style={styles.bottomTitle}>
                  {checkedCount > 0
                    ? `${checkedCount} item${checkedCount > 1 ? "s" : ""
                    } selected`
                    : "No items selected"}
                </Text>

                <Text style={styles.bottomSubtitle}>
                  {checkedCount > 0
                    ? "Confirm selected items to inventory."
                    : "Select items before confirming."}
                </Text>
              </View>

              <Pressable
                style={[
                  styles.bottomConfirmBtn,
                  (confirming || checkedCount === 0) && styles.disabledButton,
                ]}
                onPress={handleConfirmList}
                disabled={confirming || checkedCount === 0}
              >
                {confirming ? (
                  <ActivityIndicator size="small" color={colors.bg} />
                ) : (
                  <ShoppingCart size={18} color={colors.bg} />
                )}

                <Text style={styles.bottomConfirmText}>
                  {confirming ? "Saving" : "Confirm"}
                </Text>
              </Pressable>
            </View>
          )}
        </>
      )}

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
            params: {
              userId: String(userId),
              name: displayName ?? "",
              refresh: Date.now(),
            },
          });
        }}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => {
  const isDark = colors.bg === "#000000";
  const shadowColor = isDark ? "#000000" : "#132018";

  const softAccent = isDark
    ? "rgba(74, 222, 128, 0.14)"
    : "rgba(16, 185, 129, 0.10)";

  const softDanger = isDark
    ? "rgba(239, 68, 68, 0.14)"
    : "rgba(239, 68, 68, 0.10)";

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.bg,
    },

    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 18,
      paddingTop: 12,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.bg,
    },

    iconButton: {
      width: 44,
      height: 44,
      borderRadius: 15,
      backgroundColor: colors.surface1,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },

    headerCenter: {
      flex: 1,
      alignItems: "center",
      paddingHorizontal: 12,
    },

    headerEyebrow: {
      color: colors.accent1,
      fontSize: 10,
      fontWeight: "900",
      textTransform: "uppercase",
      letterSpacing: 0.7,
      marginBottom: 2,
    },

    title: {
      fontSize: 20,
      fontWeight: "900",
      color: colors.text1,
      letterSpacing: -0.5,
    },

    badgeWrap: {
      minWidth: 44,
      height: 44,
      borderRadius: 15,
      backgroundColor: softAccent,
      borderWidth: 1,
      borderColor: isDark ? "rgba(74, 222, 128, 0.28)" : "#ccebd8",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 10,
    },

    badgeText: {
      color: colors.accent1,
      fontSize: 12,
      fontWeight: "900",
    },

    loadingWrap: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      gap: 10,
    },

    loadingText: {
      color: colors.text2,
      fontSize: 13,
      fontWeight: "800",
    },

    content: {
      padding: 18,
      gap: 18,
      paddingBottom: 34,
    },

    contentWithBottomBar: {
      paddingBottom: 120,
    },

    generatorCard: {
      backgroundColor: colors.surface1,
      borderRadius: 30,
      padding: 22,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 18,
      shadowColor,
      shadowOpacity: isDark ? 0 : 0.08,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 14 },
      elevation: 4,
    },

    heroIconWrap: {
      alignItems: "center",
    },

    heroIcon: {
      width: 66,
      height: 66,
      borderRadius: 24,
      backgroundColor: softAccent,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: isDark ? "rgba(74, 222, 128, 0.22)" : "#ccebd8",
    },

    generatorTitle: {
      color: colors.text1,
      fontSize: 30,
      fontWeight: "900",
      textAlign: "center",
      lineHeight: 35,
      letterSpacing: -1,
    },

    generatorBody: {
      color: colors.text2,
      fontSize: 14,
      lineHeight: 22,
      textAlign: "center",
      fontWeight: "600",
      marginTop: -8,
    },

    infoGrid: {
      flexDirection: "row",
      gap: 10,
    },

    infoMiniCard: {
      flex: 1,
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 18,
      padding: 13,
      gap: 8,
      alignItems: "center",
    },

    infoMiniText: {
      color: colors.text2,
      fontSize: 12,
      fontWeight: "800",
      textAlign: "center",
    },

    segmentedControl: {
      flexDirection: "row",
      backgroundColor: colors.bg,
      borderRadius: 17,
      padding: 5,
      borderWidth: 1,
      borderColor: colors.border,
    },

    segmentBtn: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      borderRadius: 13,
    },

    segmentBtnActive: {
      backgroundColor: colors.accent1,
    },

    segmentText: {
      color: colors.text2,
      fontSize: 14,
      fontWeight: "800",
    },

    segmentTextActive: {
      color: colors.bg,
    },

    inputWrap: {
      gap: 8,
    },

    inputLabel: {
      fontSize: 10,
      fontWeight: "900",
      color: colors.text3,
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },

    textInput: {
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
      color: colors.text1,
      fontSize: 15,
      fontWeight: "800",
    },

    categoryBlock: {
      gap: 8,
    },

    chipRow: {
      gap: 8,
      paddingVertical: 2,
    },

    categoryChip: {
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 999,
      paddingHorizontal: 15,
      paddingVertical: 9,
    },

    categoryChipActive: {
      backgroundColor: colors.accent1,
      borderColor: colors.accent1,
    },

    categoryChipText: {
      color: colors.text2,
      fontSize: 13,
      fontWeight: "800",
    },

    categoryChipTextActive: {
      color: colors.bg,
    },

    helperText: {
      color: colors.text3,
      fontSize: 12,
      fontWeight: "700",
      lineHeight: 17,
    },

    primaryButton: {
      flexDirection: "row",
      backgroundColor: colors.accent1,
      borderRadius: 18,
      paddingVertical: 16,
      paddingHorizontal: 20,
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      minHeight: 56,
    },

    primaryButtonText: {
      color: colors.bg,
      fontWeight: "900",
      fontSize: 15,
    },

    disabledButton: {
      opacity: 0.55,
    },

    summaryCard: {
      backgroundColor: colors.surface1,
      borderRadius: 28,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 15,
      shadowColor,
      shadowOpacity: isDark ? 0 : 0.07,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 10 },
      elevation: 3,
    },

    summaryTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },

    summaryEyebrow: {
      color: colors.accent1,
      fontSize: 11,
      fontWeight: "900",
      textTransform: "uppercase",
      letterSpacing: 0.6,
      marginBottom: 4,
    },

    summaryTitle: {
      color: colors.text1,
      fontSize: 23,
      fontWeight: "900",
      letterSpacing: -0.6,
    },

    summaryIcon: {
      width: 48,
      height: 48,
      borderRadius: 17,
      backgroundColor: softAccent,
      alignItems: "center",
      justifyContent: "center",
    },

    progressTrack: {
      height: 9,
      backgroundColor: colors.bg,
      borderRadius: 999,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
    },

    progressFill: {
      height: "100%",
      backgroundColor: colors.accent1,
      borderRadius: 999,
    },

    summaryStatsRow: {
      flexDirection: "row",
      gap: 10,
    },

    statBox: {
      flex: 1,
      backgroundColor: colors.bg,
      borderRadius: 18,
      padding: 13,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
    },

    statLabel: {
      color: colors.text3,
      fontSize: 11,
      fontWeight: "900",
      textTransform: "uppercase",
      marginBottom: 5,
    },

    statValue: {
      color: colors.text1,
      fontSize: 22,
      fontWeight: "900",
    },

    sectionCard: {
      backgroundColor: colors.surface1,
      borderRadius: 26,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 14,
    },

    sectionHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
    },

    sectionKicker: {
      color: colors.accent1,
      fontSize: 10,
      fontWeight: "900",
      textTransform: "uppercase",
      letterSpacing: 0.7,
      marginBottom: 3,
    },

    sectionTitle: {
      color: colors.text1,
      fontSize: 18,
      fontWeight: "900",
      letterSpacing: -0.4,
    },

    manualAddBtn: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.text1,
      paddingHorizontal: 13,
      paddingVertical: 9,
      borderRadius: 999,
      gap: 6,
    },

    manualAddBtnText: {
      color: colors.bg,
      fontSize: 12,
      fontWeight: "900",
    },

    searchWrap: {
      minHeight: 50,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 17,
      paddingHorizontal: 13,
      gap: 9,
    },

    searchWrapSmall: {
      minHeight: 48,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      paddingHorizontal: 13,
      gap: 9,
    },

    searchInput: {
      flex: 1,
      color: colors.text1,
      fontSize: 14.5,
      fontWeight: "700",
      paddingVertical: 0,
    },

    clearBtn: {
      width: 28,
      height: 28,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface2,
    },

    suggestingWrap: {
      paddingVertical: 16,
      alignItems: "center",
      gap: 8,
    },

    suggestingText: {
      color: colors.text3,
      fontSize: 12,
      fontWeight: "700",
    },

    suggestionList: {
      backgroundColor: colors.bg,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },

    suggestionReason: {
      color: colors.accent1,
      fontSize: 12,
      fontWeight: "900",
      paddingHorizontal: 13,
      paddingTop: 12,
      paddingBottom: 4,
    },

    suggestionRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 13,
      borderBottomWidth: 1,
      borderBottomColor: colors.surface2,
      gap: 12,
    },

    suggestionInfo: {
      flex: 1,
    },

    suggestionTitle: {
      color: colors.text1,
      fontSize: 14,
      fontWeight: "900",
    },

    suggestionMeta: {
      color: colors.text3,
      fontSize: 12,
      marginTop: 3,
      fontWeight: "600",
    },

    suggestionAddBtn: {
      width: 36,
      height: 36,
      backgroundColor: softAccent,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
    },

    listCard: {
      backgroundColor: colors.surface1,
      borderRadius: 26,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 14,
    },

    listHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
    },

    refreshBtn: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },

    listTools: {
      gap: 10,
    },

    bulkActionsRow: {
      flexDirection: "row",
      gap: 10,
    },

    bulkBtn: {
      flex: 1,
      minHeight: 42,
      borderRadius: 14,
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 12,
    },

    bulkBtnDisabled: {
      opacity: 0.5,
    },

    bulkBtnText: {
      color: colors.text1,
      fontSize: 13,
      fontWeight: "900",
    },

    bulkBtnTextDisabled: {
      color: colors.text3,
    },

    emptyListWrap: {
      paddingVertical: 36,
      alignItems: "center",
      gap: 12,
    },

    emptyListText: {
      color: colors.text3,
      fontSize: 14,
      fontWeight: "700",
      textAlign: "center",
    },

    itemsWrap: {
      gap: 10,
    },

    itemCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.bg,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      gap: 10,
    },

    itemCardSelected: {
      borderColor: colors.accent1,
      backgroundColor: softAccent,
    },

    itemMain: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      gap: 11,
      paddingRight: 8,
    },

    itemTextWrap: {
      flex: 1,
    },

    itemName: {
      color: colors.text1,
      fontSize: 15,
      fontWeight: "900",
    },

    itemNameDone: {
      color: colors.text3,
      textDecorationLine: "line-through",
    },

    itemMeta: {
      color: colors.text3,
      fontSize: 12,
      marginTop: 4,
      fontWeight: "700",
      textTransform: "capitalize",
    },

    itemActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },

    qtyPill: {
      minWidth: 42,
      height: 34,
      backgroundColor: colors.surface2,
      paddingHorizontal: 12,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },

    qtyPillText: {
      color: colors.text1,
      fontSize: 13,
      fontWeight: "900",
    },

    deleteBtn: {
      width: 34,
      height: 34,
      borderRadius: 12,
      backgroundColor: softDanger,
      alignItems: "center",
      justifyContent: "center",
    },

    bottomBar: {
      position: "absolute",
      left: 16,
      right: 16,
      bottom: 14,
      minHeight: 78,
      borderRadius: 25,
      backgroundColor: colors.surface1,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      shadowColor,
      shadowOpacity: isDark ? 0.35 : 0.16,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 14 },
      elevation: 8,
    },

    bottomCopy: {
      flex: 1,
    },

    bottomTitle: {
      color: colors.text1,
      fontSize: 15,
      fontWeight: "900",
    },

    bottomSubtitle: {
      color: colors.text3,
      fontSize: 12,
      fontWeight: "700",
      marginTop: 3,
      lineHeight: 16,
    },

    bottomConfirmBtn: {
      minWidth: 112,
      minHeight: 52,
      borderRadius: 18,
      backgroundColor: colors.accent1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
      paddingHorizontal: 14,
    },

    bottomConfirmText: {
      color: colors.bg,
      fontSize: 14,
      fontWeight: "900",
    },

    emptyState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      paddingHorizontal: 32,
    },

    emptyTitle: {
      color: colors.text1,
      fontSize: 19,
      fontWeight: "900",
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
};