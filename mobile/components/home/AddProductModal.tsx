import React, { useMemo } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTheme } from "@/context/theme"; // Using your updated theme context

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
}: any) {
  // Pull the pure black/white/green minimal colors directly from the context
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Add product</Text>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <TextInput
              value={productName}
              onChangeText={onProductName}
              placeholder="Item name"
              placeholderTextColor={colors.text3}
              style={styles.input}
            />

            <TextInput
              value={productUnit}
              onChangeText={onProductUnit}
              placeholder="Unit (e.g., kg, pcs)"
              placeholderTextColor={colors.text3}
              style={styles.input}
            />
            {unitSuggestions && unitSuggestions.length > 0 && (
              <View style={styles.chipRow}>
                {unitSuggestions.map((unit: string) => (
                  <Pressable
                    key={unit}
                    style={styles.chip}
                    onPress={() => onProductUnit(unit)}
                  >
                    <Text style={styles.chipText}>{unit}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            <TextInput
              value={productQuantity}
              onChangeText={onProductQuantity}
              placeholder="Quantity"
              placeholderTextColor={colors.text3}
              keyboardType="decimal-pad"
              style={styles.input}
            />

            <TextInput
              value={productCategory}
              onChangeText={onProductCategory}
              placeholder="Category"
              placeholderTextColor={colors.text3}
              style={styles.input}
            />
            {categorySuggestions && categorySuggestions.length > 0 && (
              <View style={styles.chipRow}>
                {categorySuggestions.map((category: string) => (
                  <Pressable
                    key={category}
                    style={styles.chip}
                    onPress={() => onProductCategory(category)}
                  >
                    <Text style={styles.chipText}>{category}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            <TextInput
              value={usageQty}
              onChangeText={onUsageQty}
              placeholder="Usage quantity"
              placeholderTextColor={colors.text3}
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <TextInput
              value={usageDays}
              onChangeText={onUsageDays}
              placeholder="Usage days"
              placeholderTextColor={colors.text3}
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <TextInput
              value={productPrice}
              onChangeText={onProductPrice}
              placeholder="Price per unit"
              placeholderTextColor={colors.text3}
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <TextInput
              value={shelfLife}
              onChangeText={onShelfLife}
              placeholder="Shelf life days"
              placeholderTextColor={colors.text3}
              keyboardType="number-pad"
              style={styles.input}
            />
          </ScrollView>
          <View style={styles.actions}>
            <Pressable style={styles.secondaryButton} onPress={onClose}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.primaryButton} onPress={onSave}>
              <Text style={styles.primaryButtonText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Map everything to the new dynamic colors context
const createStyles = (colors: any) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)", // Darkened slightly to make the modal pop against the background
      justifyContent: "center",
      padding: 20,
    },
    card: {
      backgroundColor: colors.surface1,
      borderRadius: 20,
      padding: 20,
      maxHeight: "85%",
      borderWidth: 1,
      borderColor: colors.border,
    },
    title: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text1,
      marginBottom: 16,
    },
    scrollContent: {
      paddingBottom: 10,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 14, // Slightly larger touch targets
      backgroundColor: colors.surface1,
      color: colors.text1,
      marginBottom: 12,
    },
    chipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 16,
      marginTop: -4, // Pull closer to the input it belongs to
    },
    chip: {
      backgroundColor: colors.surface2,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipText: {
      color: colors.text1,
      fontSize: 12,
      fontWeight: "500",
    },
    actions: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
      marginTop: 16,
    },
    primaryButton: {
      flex: 1, // Makes buttons equal width
      backgroundColor: colors.accent1,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: "center",
    },
    primaryButtonText: {
      color: colors.bg, // Automatically flips text color for contrast
      fontSize: 15,
      fontWeight: "700",
    },
    secondaryButton: {
      flex: 1, // Makes buttons equal width
      backgroundColor: colors.surface1,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    secondaryButtonText: {
      color: colors.text1,
      fontSize: 15,
      fontWeight: "600",
    },
  });
