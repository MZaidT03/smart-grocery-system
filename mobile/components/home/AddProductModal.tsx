import React, { useMemo, useState, useEffect } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Keyboard,
} from "react-native";
import { useTheme } from "@/context/theme";
import { API_BASE_URL } from "@/constants/api";

// Standard text input field
const Field = ({ label, value, onChangeText, keyboardType = "default", placeholder = "", styles }: any) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      placeholder={placeholder}
      placeholderTextColor={styles.placeholder.color}
      style={styles.input}
    />
  </View>
);

// Minimal Dropdown Component
const SelectField = ({ label, value, options, onSelect, expanded, onToggle, styles }: any) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <Pressable style={styles.selectInput} onPress={onToggle}>
      <Text style={[styles.selectValue, !value && styles.placeholder]}>
        {value || `Select ${label}`}
      </Text>
      <Text style={styles.chevron}>{expanded ? "▲" : "▼"}</Text>
    </Pressable>

    {expanded && options && options.length > 0 && (
      <View style={styles.dropdown}>
        {options.map((item: string) => (
          <Pressable
            key={item}
            style={[styles.dropdownItem, value === item && styles.dropdownItemActive]}
            onPress={() => {
              onSelect(item);
              onToggle(); // Close after selection
            }}
          >
            <Text style={[styles.dropdownItemText, value === item && styles.dropdownItemTextActive]}>
              {item}
            </Text>
          </Pressable>
        ))}
      </View>
    )}
  </View>
);

const SectionHeader = ({ title, styles }: any) => (
  <Text style={styles.sectionHeader}>{title}</Text>
);

export default function AddProductModal({
  visible,
  onClose,
  onSave,
  productName,
  onProductName,
  productUnit,
  onProductUnit,
  productQuantity,
  onProductQuantity,
  productCategory,
  onProductCategory,
  usageQty,
  onUsageQty,
  usageDays,
  onUsageDays,
  productPrice,
  onProductPrice,
  shelfLife,
  onShelfLife,
  unitSuggestions,
  categorySuggestions,
  userProducts = [],
}: any) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Track which dropdown is currently open (null, 'unit', or 'category')
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  
  const [catalog, setCatalog] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (visible) {
      fetch(`${API_BASE_URL}/catalog`)
        .then(res => res.json())
        .then(data => setCatalog(data))
        .catch(err => console.error("Failed to fetch catalog", err));
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  }, [visible]);

  const toggleDropdown = (dropdownName: string) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.card}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Add product</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ zIndex: 10, marginBottom: 16 }}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                value={productName}
                onChangeText={(text) => {
                  onProductName(text);
                  if (text) {
                    const lowerText = text.toLowerCase();
                    
                    // First search in user's previous products
                    const userMatches = userProducts
                      .filter((p: any) => p.name.toLowerCase().includes(lowerText))
                      .map((p: any) => ({
                        item_name: p.name,
                        category: p.category,
                        consumption_unit: p.unit,
                        default_freq_qty: p.usage_freq_qty,
                        default_freq_days: p.usage_freq_days,
                        price: p.price,
                        is_user_product: true
                      }));

                    // Then search in catalog
                    const catalogMatches = catalog
                      .filter((item) => item.item_name.toLowerCase().includes(lowerText))
                      .map((item) => ({
                        ...item,
                        is_user_product: false
                      }));

                    // Combine and deduplicate by item_name
                    const combined = [...userMatches, ...catalogMatches];
                    const uniqueSuggestions = Array.from(new Map(combined.map(item => [item.item_name.toLowerCase(), item])).values());

                    setSuggestions(uniqueSuggestions.slice(0, 5));
                    setShowSuggestions(true);
                  } else {
                    setShowSuggestions(false);
                  }
                }}
                placeholder="e.g., Basmati Rice"
                placeholderTextColor={colors.text3}
                style={styles.input}
                returnKeyType="done"
                onSubmitEditing={() => {
                  Keyboard.dismiss();
                  setShowSuggestions(false);
                }}
                onFocus={() => {
                  if (productName && suggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
              />
              {showSuggestions && suggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  {suggestions.map((item, index) => (
                    <Pressable
                      key={index}
                      style={[
                        styles.suggestionItem,
                        index < suggestions.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }
                      ]}
                      onPress={() => {
                        onProductName(item.item_name);
                        if (item.consumption_unit) onProductUnit(item.consumption_unit);
                        if (item.category) onProductCategory(item.category);
                        if (item.default_freq_qty) onUsageQty(String(item.default_freq_qty));
                        if (item.default_freq_days) onUsageDays(String(item.default_freq_days));
                        if (item.price && onProductPrice) onProductPrice(String(item.price));
                        setShowSuggestions(false);
                        Keyboard.dismiss();
                      }}
                    >
                      <View>
                        <Text style={[styles.suggestionText, { color: colors.text1 }]}>{item.item_name}</Text>
                        <Text style={[styles.suggestionCategory, { color: colors.text3 }]}>
                          {item.category || "Other"} {item.is_user_product ? "• Previous Item" : ""}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.twoColumn}>
              <View style={styles.column}>
                <Field
                  label="Quantity"
                  value={productQuantity}
                  onChangeText={onProductQuantity}
                  keyboardType="decimal-pad"
                  placeholder="0.0"
                  styles={styles}
                />
              </View>
              <View style={styles.column}>
                <SelectField
                  label="Unit"
                  value={productUnit}
                  options={unitSuggestions}
                  expanded={openDropdown === 'unit'}
                  onToggle={() => toggleDropdown('unit')}
                  onSelect={onProductUnit}
                  styles={styles}
                />
              </View>
            </View>

            <SelectField
              label="Category"
              value={productCategory}
              options={categorySuggestions}
              expanded={openDropdown === 'category'}
              onToggle={() => toggleDropdown('category')}
              onSelect={onProductCategory}
              styles={styles}
            />

            <View style={styles.divider} />
            <SectionHeader title="Inventory Tracking (Optional)" styles={styles} />

            <View style={styles.twoColumn}>
              <View style={styles.column}>
                <Field
                  label="Usage Qty"
                  value={usageQty}
                  onChangeText={onUsageQty}
                  keyboardType="decimal-pad"
                  placeholder="0.0"
                  styles={styles}
                />
              </View>
              <View style={styles.column}>
                <Field
                  label="Usage Days"
                  value={usageDays}
                  onChangeText={onUsageDays}
                  keyboardType="decimal-pad"
                  placeholder="Days"
                  styles={styles}
                />
              </View>
            </View>

            <View style={styles.twoColumn}>
              <View style={styles.column}>
                <Field
                  label="Price"
                  value={productPrice}
                  onChangeText={onProductPrice}
                  keyboardType="decimal-pad"
                  placeholder="$0.00"
                  styles={styles}
                />
              </View>
              <View style={styles.column}>
                <Field
                  label="Shelf Life"
                  value={shelfLife}
                  onChangeText={onShelfLife}
                  keyboardType="number-pad"
                  placeholder="Days"
                  styles={styles}
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.saveButton} onPress={onSave}>
              <Text style={styles.saveText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "flex-end",
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.5)",
    },
    card: {
      maxHeight: "90%",
      backgroundColor: colors.surface1,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      overflow: "hidden",
    },
    header: {
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 16,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    title: {
      fontSize: 22,
      fontWeight: "800",
      color: colors.text1,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface2,
    },
    closeText: {
      fontSize: 20,
      color: colors.text2 || colors.text1,
      fontWeight: "600",
    },
    content: {
      paddingHorizontal: 24,
      paddingBottom: 24,
    },
    sectionHeader: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.text3,
      marginTop: 8,
      marginBottom: 16,
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
    field: {
      marginBottom: 16,
    },
    label: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.text3,
      marginBottom: 8,
    },
    input: {
      height: 52,
      borderRadius: 12,
      backgroundColor: colors.surface2,
      color: colors.text1,
      paddingHorizontal: 16,
      fontSize: 15,
      fontWeight: "500",
    },
    placeholder: {
      color: colors.text3,
    },
    suggestionsContainer: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      marginTop: 4,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
      borderRadius: 12,
      overflow: 'hidden',
      zIndex: 100,
      elevation: 5,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    suggestionItem: {
      padding: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    suggestionText: {
      fontSize: 15,
      fontWeight: '600',
    },
    suggestionCategory: {
      fontSize: 12,
    },
    twoColumn: {
      flexDirection: "row",
      gap: 12,
    },
    column: {
      flex: 1,
    },
    selectInput: {
      height: 52,
      borderRadius: 12,
      backgroundColor: colors.surface2,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    selectValue: {
      color: colors.text1,
      fontSize: 15,
      fontWeight: "500",
    },
    chevron: {
      color: colors.text3,
      fontSize: 12,
    },
    dropdown: {
      marginTop: 6,
      backgroundColor: colors.surface2,
      borderRadius: 12,
      padding: 8,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
    },
    dropdownItem: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: colors.surface1,
    },
    dropdownItemActive: {
      backgroundColor: colors.accent1,
    },
    dropdownItemText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.text1,
    },
    dropdownItemTextActive: {
      color: colors.bg,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginTop: 4,
      marginBottom: 16,
      opacity: 0.5,
    },
    footer: {
      flexDirection: "row",
      gap: 12,
      padding: 20,
      paddingBottom: Platform.OS === "ios" ? 34 : 20,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface1,
    },
    cancelButton: {
      flex: 1,
      height: 50,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface2,
    },
    cancelText: {
      color: colors.text1,
      fontSize: 15,
      fontWeight: "700",
    },
    saveButton: {
      flex: 1.5,
      height: 50,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accent1,
    },
    saveText: {
      color: colors.bg,
      fontSize: 15,
      fontWeight: "800",
    },
  });