import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTheme } from "@/context/theme";
import { Check, ReceiptText, Store, X } from "lucide-react-native";

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
  saving,
}: PricePreviewModalProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [editableResults, setEditableResults] = useState<PricePreviewItem[]>([]);

  useEffect(() => {
    if (visible) {
      setEditableResults([...results]);
    }
  }, [visible, results]);

  const handlePriceChange = (index: number, value: string) => {
    const numericValue = Number.parseFloat(value);
    const updated = [...editableResults];
    updated[index].new_price = Number.isNaN(numericValue) ? 0 : numericValue;
    setEditableResults(updated);
  };

  const handleSave = () => {
    onSave(editableResults);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalBackdrop}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.modalCard}>
          <View style={styles.headerRow}>
            <View style={styles.titleWrap}>
              <View style={styles.titleIcon}>
                <ReceiptText size={20} color={colors.accent1} />
              </View>
              <View>
                <Text style={styles.eyebrow}>Review</Text>
                <Text style={styles.title}>Fetched prices</Text>
              </View>
            </View>
            <Pressable
              onPress={onClose}
              disabled={saving}
              style={styles.closeBtn}
            >
              <X size={22} color={colors.text2} />
            </Pressable>
          </View>

          <Text style={styles.subtitle}>
            Edit any price before saving it back to your pantry.
          </Text>

          {editableResults.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Store size={32} color={colors.text3} />
              <Text style={styles.emptyText}>No prices found to update.</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.list}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {editableResults.map((item, index) => (
                <View key={item.product_id} style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.item_name}
                    </Text>
                    <Text style={styles.itemMeta} numberOfLines={1}>
                      {item.category || "Uncategorized"} | was Rs{" "}
                      {Number(item.old_price || 0).toLocaleString("en-PK")}
                    </Text>
                  </View>
                  <View style={styles.inputWrap}>
                    <Text style={styles.currencyText}>Rs</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType={
                        Platform.OS === "ios"
                          ? "numbers-and-punctuation"
                          : "numeric"
                      }
                      returnKeyType="done"
                      onSubmitEditing={() => Keyboard.dismiss()}
                      value={item.new_price ? String(item.new_price) : ""}
                      onChangeText={(value) => handlePriceChange(index, value)}
                    />
                  </View>
                </View>
              ))}
            </ScrollView>
          )}

          <View style={styles.footerRow}>
            <Pressable
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={saving}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[
                styles.saveBtn,
                (saving || editableResults.length === 0) && styles.disabledBtn,
              ]}
              onPress={handleSave}
              disabled={saving || editableResults.length === 0}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.bg} />
              ) : (
                <Check size={18} color={colors.bg} />
              )}
              <Text style={styles.saveBtnText}>
                {saving ? "Saving..." : "Save prices"}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (colors: any) => {
  const isDark = colors.bg === "#000000";
  const softAccent = isDark ? "rgba(74, 222, 128, 0.14)" : "#eaf7ef";

  return StyleSheet.create({
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.62)",
      justifyContent: "flex-end",
    },
    modalCard: {
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bg,
      padding: 20,
      maxHeight: "86%",
      gap: 14,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
    },
    titleWrap: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    titleIcon: {
      width: 42,
      height: 42,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: softAccent,
    },
    eyebrow: {
      color: colors.accent1,
      fontSize: 11,
      fontWeight: "900",
      textTransform: "uppercase",
    },
    title: {
      color: colors.text1,
      fontSize: 20,
      fontWeight: "900",
      marginTop: 2,
    },
    closeBtn: {
      width: 40,
      height: 40,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface1,
      borderWidth: 1,
      borderColor: colors.border,
    },
    subtitle: {
      color: colors.text2,
      fontSize: 14,
      lineHeight: 20,
    },
    emptyWrap: {
      alignItems: "center",
      paddingVertical: 34,
      gap: 10,
    },
    emptyText: {
      color: colors.text2,
      fontSize: 14,
      fontWeight: "700",
    },
    list: {
      marginBottom: 4,
    },
    itemRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 12,
    },
    itemInfo: {
      flex: 1,
      gap: 4,
    },
    itemName: {
      color: colors.text1,
      fontSize: 15,
      fontWeight: "900",
    },
    itemMeta: {
      color: colors.text2,
      fontSize: 12,
      fontWeight: "700",
    },
    inputWrap: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface1,
      borderRadius: 14,
      paddingHorizontal: 10,
      minHeight: 46,
      width: 116,
    },
    currencyText: {
      color: colors.text2,
      fontSize: 12,
      fontWeight: "900",
      marginRight: 4,
    },
    input: {
      flex: 1,
      color: colors.accent1,
      fontSize: 15,
      fontWeight: "900",
      textAlign: "right",
      paddingVertical: 0,
    },
    footerRow: {
      flexDirection: "row",
      gap: 12,
      paddingTop: 2,
    },
    cancelBtn: {
      flex: 1,
      minHeight: 52,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface1,
      alignItems: "center",
      justifyContent: "center",
    },
    cancelBtnText: {
      color: colors.text1,
      fontSize: 15,
      fontWeight: "900",
    },
    saveBtn: {
      flex: 1,
      minHeight: 52,
      borderRadius: 16,
      backgroundColor: colors.accent1,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
    },
    disabledBtn: {
      opacity: 0.62,
    },
    saveBtnText: {
      color: colors.bg,
      fontSize: 15,
      fontWeight: "900",
    },
  });
};
