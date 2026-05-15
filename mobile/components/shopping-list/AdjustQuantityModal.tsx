import React from 'react';
import { View, Text, Modal, TextInput, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/context/theme';

interface AdjustQuantityModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  itemName: string;
  qty: string;
  onQtyChange: (qty: string) => void;
}

export default function AdjustQuantityModal({
  visible,
  onClose,
  onSave,
  itemName,
  qty,
  onQtyChange,
}: AdjustQuantityModalProps) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalCard, { backgroundColor: colors.surface1, borderColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.text1 }]}>Adjust quantity</Text>
          <Text style={[styles.sectionBody, { color: colors.text2 }]}>{itemName}</Text>
          <TextInput
            value={qty}
            onChangeText={onQtyChange}
            placeholder="Adjusted quantity"
            placeholderTextColor={colors.text3}
            keyboardType="decimal-pad"
            style={[styles.input, { color: colors.text1, borderColor: colors.border, backgroundColor: colors.bg }]}
          />
          <View style={styles.modalActions}>
            <Pressable
              style={[styles.secondaryButton, { borderColor: colors.border }]}
              onPress={onClose}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.text2 }]}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.primaryButton, { backgroundColor: colors.accent1 }]} onPress={onSave}>
              <Text style={[styles.primaryButtonText, { color: colors.bg }]}>Update</Text>
            </Pressable>
          </View>
        </View>
      </View>
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
  sectionBody: {
    fontSize: 16,
    lineHeight: 22,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
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
