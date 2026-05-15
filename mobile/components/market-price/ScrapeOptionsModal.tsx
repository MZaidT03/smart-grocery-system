import React from "react";
import { Modal, View, Text, Pressable, StyleSheet } from "react-native";
import { useTheme } from "@/context/theme";
import { X, CheckCircle2, Box, PackageOpen } from "lucide-react-native";

interface ScrapeOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  selectedCount: number;
  onScrapeSelected: () => void;
  onScrapeAll: () => void;
}

export default function ScrapeOptionsModal({
  visible,
  onClose,
  selectedCount,
  onScrapeSelected,
  onScrapeAll,
}: ScrapeOptionsModalProps) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalCard, { backgroundColor: colors.bg, borderColor: colors.border }]}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: colors.text1 }]}>Scan Market</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <X size={24} color={colors.text2} />
            </Pressable>
          </View>

          <Text style={[styles.subtitle, { color: colors.text2 }]}>
            Which products would you like to scan for updated prices?
          </Text>

          <View style={styles.optionsList}>
            {selectedCount > 0 && (
              <Pressable
                style={[styles.optionBtn, styles.optionBtnSelected, { backgroundColor: colors.surface1 }]}
                onPress={onScrapeSelected}
              >
                <CheckCircle2 size={24} color="#10B981" />
                <View style={styles.optionTextWrap}>
                  <Text style={[styles.optionTitle, { color: colors.text1 }]}>Selected Items</Text>
                  <Text style={[styles.optionDesc, { color: colors.text3 }]}>Scan only the {selectedCount} items you selected.</Text>
                </View>
              </Pressable>
            )}



            <Pressable
              style={[styles.optionBtn, { backgroundColor: colors.surface1, borderColor: colors.border }]}
              onPress={onScrapeAll}
            >
              <Box size={24} color={colors.text1} />
              <View style={styles.optionTextWrap}>
                <Text style={[styles.optionTitle, { color: colors.text1 }]}>All Products</Text>
                <Text style={[styles.optionDesc, { color: colors.text3 }]}>Scan your entire inventory.</Text>
              </View>
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
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
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
    marginBottom: 24,
    lineHeight: 20,
  },
  optionsList: {
    gap: 12,
  },
  optionBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#27272A", // zinc-800
    gap: 16,
  },
  optionBtnSelected: {
    borderColor: "rgba(16, 185, 129, 0.5)", // Emerald 500 with opacity
  },
  optionTextWrap: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  optionDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
});
