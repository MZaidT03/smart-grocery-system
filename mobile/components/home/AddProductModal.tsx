import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

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
}) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Add product</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            <TextInput
              value={productName}
              onChangeText={onProductName}
              placeholder="Item name"
              placeholderTextColor="#9C9085"
              style={styles.input}
            />
            <TextInput
              value={productUnit}
              onChangeText={onProductUnit}
              placeholder="Unit (e.g., kg, pcs)"
              placeholderTextColor="#9C9085"
              style={styles.input}
            />
            <View style={styles.chipRow}>
              {unitSuggestions.map((unit) => (
                <Pressable
                  key={unit}
                  style={styles.chip}
                  onPress={() => onProductUnit(unit)}
                >
                  <Text style={styles.chipText}>{unit}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              value={productQuantity}
              onChangeText={onProductQuantity}
              placeholder="Quantity"
              placeholderTextColor="#9C9085"
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <TextInput
              value={productCategory}
              onChangeText={onProductCategory}
              placeholder="Category"
              placeholderTextColor="#9C9085"
              style={styles.input}
            />
            <View style={styles.chipRow}>
              {categorySuggestions.map((category) => (
                <Pressable
                  key={category}
                  style={styles.chip}
                  onPress={() => onProductCategory(category)}
                >
                  <Text style={styles.chipText}>{category}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              value={usageQty}
              onChangeText={onUsageQty}
              placeholder="Usage quantity"
              placeholderTextColor="#9C9085"
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <TextInput
              value={usageDays}
              onChangeText={onUsageDays}
              placeholder="Usage days"
              placeholderTextColor="#9C9085"
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <TextInput
              value={productPrice}
              onChangeText={onProductPrice}
              placeholder="Price per unit"
              placeholderTextColor="#9C9085"
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <TextInput
              value={shelfLife}
              onChangeText={onShelfLife}
              placeholder="Shelf life days"
              placeholderTextColor="#9C9085"
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

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    gap: 12,
    maxHeight: "85%",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C2C2C",
  },
  input: {
    borderWidth: 1,
    borderColor: "#D8CEC4",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    color: "#1F2A24",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    backgroundColor: "#F4F1EA",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: {
    color: "#4A4038",
    fontSize: 12,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  primaryButton: {
    backgroundColor: "#0E3A32",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FDE7C6",
    fontSize: 14,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0D6CC",
  },
  secondaryButtonText: {
    color: "#1F2A24",
    fontSize: 14,
    fontWeight: "600",
  },
});
