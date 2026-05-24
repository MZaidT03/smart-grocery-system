import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TextInput, ScrollView, Pressable, StyleSheet, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useTheme } from '@/context/theme';
import { API_BASE_URL } from '@/constants/api';

interface AddShoppingItemModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  itemName: string;
  onItemNameChange: (name: string) => void;
  qty: string;
  onQtyChange: (qty: string) => void;
  unit: string;
  onUnitChange: (unit: string) => void;
  category: string;
  onCategoryChange: (category: string) => void;
  categories: string[];
}

export default function AddShoppingItemModal({
  visible,
  onClose,
  onSave,
  itemName,
  onItemNameChange,
  qty,
  onQtyChange,
  unit,
  onUnitChange,
  category,
  onCategoryChange,
  categories,
}: AddShoppingItemModalProps) {
  const { colors } = useTheme();
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

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        style={styles.modalBackdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.modalCard, { backgroundColor: colors.surface1, borderColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.text1 }]}>Add item</Text>
          <View style={{ zIndex: 10 }}>
            <TextInput
              value={itemName}
              onChangeText={(text) => {
                onItemNameChange(text);
                if (text) {
                  const filtered = catalog.filter((item) =>
                    item.item_name.toLowerCase().includes(text.toLowerCase())
                  );
                  setSuggestions(filtered.slice(0, 5));
                  setShowSuggestions(true);
                } else {
                  setShowSuggestions(false);
                }
              }}
              placeholder="Item name"
              placeholderTextColor={colors.text3}
              style={[styles.input, { color: colors.text1, borderColor: colors.border, backgroundColor: colors.bg }]}
              returnKeyType="done"
              onSubmitEditing={() => {
                Keyboard.dismiss();
                setShowSuggestions(false);
              }}
              onFocus={() => {
                if (itemName && suggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
            />
            {showSuggestions && suggestions.length > 0 && (
              <View style={[styles.suggestionsContainer, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
                {suggestions.map((item, index) => (
                  <Pressable
                    key={index}
                    style={[
                      styles.suggestionItem,
                      index < suggestions.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }
                    ]}
                    onPress={() => {
                      onItemNameChange(item.item_name);
                      if (item.consumption_unit) onUnitChange(item.consumption_unit);
                      if (item.category) onCategoryChange(item.category);
                      setShowSuggestions(false);
                      Keyboard.dismiss();
                    }}
                  >
                    <Text style={[styles.suggestionText, { color: colors.text1 }]}>{item.item_name}</Text>
                    <Text style={[styles.suggestionCategory, { color: colors.text3 }]}>{item.category || "Other"}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
          <TextInput
            value={qty}
            onChangeText={onQtyChange}
            placeholder="Quantity"
            placeholderTextColor={colors.text3}
            keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "decimal-pad"}
            style={[styles.input, { color: colors.text1, borderColor: colors.border, backgroundColor: colors.bg }]}
            returnKeyType="done"
            onSubmitEditing={() => Keyboard.dismiss()}
          />
          <Text style={[styles.label, { color: colors.text2, marginTop: 4 }]}>Unit</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {['kg', 'L', 'pcs', 'pkt'].map((u) => (
              <Pressable
                key={u}
                style={[
                  styles.categoryChip,
                  { borderColor: colors.border, backgroundColor: colors.surface2 },
                  unit === u && { backgroundColor: colors.accent1, borderColor: colors.accent1 },
                ]}
                onPress={() => onUnitChange(u)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    { color: colors.text1 },
                    unit === u && { color: colors.bg },
                  ]}
                >
                  {u}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <Text style={[styles.label, { color: colors.text2, marginTop: 8 }]}>Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {categories.map((c) => (
              <Pressable
                key={c}
                style={[
                  styles.categoryChip,
                  { borderColor: colors.border, backgroundColor: colors.surface2 },
                  category === c && { backgroundColor: colors.accent1, borderColor: colors.accent1 },
                ]}
                onPress={() => onCategoryChange(c)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    { color: colors.text1 },
                    category === c && { color: colors.bg },
                  ]}
                >
                  {c}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={styles.modalActions}>
            <Pressable
              style={[styles.secondaryButton, { borderColor: colors.border }]}
              onPress={onClose}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.text2 }]}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.primaryButton, { backgroundColor: colors.accent1 }]} onPress={onSave}>
              <Text style={[styles.primaryButtonText, { color: colors.bg }]}>Save</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    borderRadius: 24,
    padding: 24,
    gap: 16,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    borderWidth: 1,
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
    fontSize: 16,
    fontWeight: '500',
  },
  suggestionCategory: {
    fontSize: 12,
  },
  chipRow: {
    gap: 8,
    paddingVertical: 4,
  },
  categoryChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  categoryChipText: {
    fontWeight: "700",
    fontSize: 12,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  primaryButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
