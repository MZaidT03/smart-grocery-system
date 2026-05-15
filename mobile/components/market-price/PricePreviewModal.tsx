import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard
} from "react-native";
import { useTheme } from "@/context/theme";
import { X, Check } from "lucide-react-native";

export type PricePreviewItem = {
  product_id: number;
  item_name: string;
  old_price: number;
  new_price: number;
  quantity: number;
  category: string;
};

interface PricePreviewModalProps {
  visible: boolean;
  onClose: () => void;
  results: PricePreviewItem[];
  onSave: (updates: PricePreviewItem[]) => Promise<void>;
  saving: boolean;
}

export default function PricePreviewModal({
  visible,
  onClose,
  results,
  onSave,
  saving
}: PricePreviewModalProps) {
  const { colors } = useTheme();
  const [editableResults, setEditableResults] = useState<PricePreviewItem[]>([]);

  useEffect(() => {
    if (visible) {
      setEditableResults([...results]);
    }
  }, [visible, results]);

  const handlePriceChange = (index: number, val: string) => {
    const numericVal = parseFloat(val);
    const updated = [...editableResults];
    updated[index].new_price = isNaN(numericVal) ? 0 : numericVal;
    setEditableResults(updated);
  };

  const handleSave = () => {
    onSave(editableResults);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView 
        style={styles.modalBackdrop}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.modalCard, { backgroundColor: colors.bg, borderColor: colors.border }]}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: colors.text1 }]}>Review Prices</Text>
            <Pressable onPress={onClose} disabled={saving} style={styles.closeBtn}>
              <X size={24} color={colors.text2} />
            </Pressable>
          </View>
          
          <Text style={[styles.subtitle, { color: colors.text2 }]}>
            Review the fetched market prices. You can manually adjust them before saving.
          </Text>

          {editableResults.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={{ color: colors.text2 }}>No prices found to update.</Text>
            </View>
          ) : (
            <ScrollView 
              style={styles.list} 
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {editableResults.map((item, idx) => (
                <View key={item.product_id} style={[styles.itemRow, { borderBottomColor: colors.surface2 }]}>
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemName, { color: colors.text1 }]} numberOfLines={1}>{item.item_name}</Text>
                    <View style={styles.itemMetaWrap}>
                      <Text style={[styles.itemOldPrice, { color: colors.text3 }]}>Was: <Text style={{color: colors.text2}}>Rs {item.old_price}</Text></Text>
                      <Text style={styles.itemSource}>SOURCE: AL-FATAH ONLINE</Text>
                    </View>
                  </View>
                  <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.surface1 }]}>
                    <Text style={{ color: colors.text2, marginRight: 4 }}>Rs</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "numeric"}
                      returnKeyType="done"
                      onSubmitEditing={() => Keyboard.dismiss()}
                      value={item.new_price ? String(item.new_price) : ""}
                      onChangeText={(val) => handlePriceChange(idx, val)}
                    />
                  </View>
                </View>
              ))}
            </ScrollView>
          )}

          <View style={styles.footerRow}>
            <Pressable
              style={[styles.btn, styles.cancelBtn, { borderColor: colors.border, backgroundColor: colors.surface1 }]}
              onPress={onClose}
              disabled={saving}
            >
              <Text style={[styles.btnText, { color: colors.text1 }]}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, styles.saveBtn]}
              onPress={handleSave}
              disabled={saving || editableResults.length === 0}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Check size={18} color="#fff" />
              )}
              <Text style={styles.saveBtnText}>
                {saving ? "Saving..." : "Done & Save"}
              </Text>
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
    justifyContent: "flex-end",
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 24,
    maxHeight: "85%",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
  },
  closeBtn: {
    padding: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  emptyWrap: {
    paddingVertical: 40,
    alignItems: "center",
  },
  list: {
    marginBottom: 20,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  itemInfo: {
    flex: 1,
    paddingRight: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  itemMetaWrap: {
    gap: 2,
  },
  itemOldPrice: {
    fontSize: 12,
  },
  itemSource: {
    fontSize: 10,
    fontWeight: "700",
    color: "#52525B", // zinc-600
    marginTop: 2,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 110,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#10B981", // Emerald 500
    textAlign: "right",
  },
  footerRow: {
    flexDirection: "row",
    gap: 12,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  cancelBtn: {
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  saveBtn: {
    backgroundColor: "#059669", // Emerald 600
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  btnText: {
    fontSize: 16,
    fontWeight: "700",
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});
