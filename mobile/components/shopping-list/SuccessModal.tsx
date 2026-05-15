import React from 'react';
import { View, Text, Modal, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/context/theme';

interface SuccessModalProps {
  visible: boolean;
  onDone: () => void;
  confirmedItemsCount: number;
  confirmedItemsList: {name: string; qty: number; unit: string}[];
}

export default function SuccessModal({
  visible,
  onDone,
  confirmedItemsCount,
  confirmedItemsList,
}: SuccessModalProps) {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDone}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface1, borderColor: colors.border }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text1 }]}>List Confirmed!</Text>
          </View>
          <View style={{ paddingHorizontal: 22, paddingBottom: 22, paddingTop: 16 }}>
            <Text style={[styles.sectionBody, { color: colors.text2 }]}>
              Successfully added {confirmedItemsCount} items to your inventory.
            </Text>
            <ScrollView style={{ maxHeight: 200, marginVertical: 16 }}>
              {confirmedItemsList.map((item, idx) => (
                <View key={idx} style={[styles.itemRow, { borderBottomColor: colors.border }]}>
                  <Text style={{ color: colors.text1, fontWeight: '600' }}>{item.name}</Text>
                  <Text style={{ color: colors.text2 }}>{item.qty} {item.unit}</Text>
                </View>
              ))}
            </ScrollView>
            <Pressable
              style={[styles.primaryButton, { backgroundColor: colors.accent1 }]}
              onPress={onDone}
            >
              <Text style={[styles.primaryButtonText, { color: colors.bg }]}>Done & Go to Home</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  sectionBody: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  itemRow: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingVertical: 10, 
    borderBottomWidth: 1, 
  },
  primaryButton: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
});
