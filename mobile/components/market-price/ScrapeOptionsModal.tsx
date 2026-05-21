import React, { useMemo } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/context/theme";
import { Box, CheckCircle2, Store, X } from "lucide-react-native";

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
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.headerRow}>
            <View style={styles.titleWrap}>
              <View style={styles.titleIcon}>
                <Store size={20} color={colors.accent1} />
              </View>
              <View>
                <Text style={styles.eyebrow}>Market</Text>
                <Text style={styles.title}>Scan prices</Text>
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <X size={22} color={colors.text2} />
            </Pressable>
          </View>

          <Text style={styles.subtitle}>
            Choose which pantry items should be sent for live market price
            lookup.
          </Text>

          <View style={styles.optionsList}>
            {selectedCount > 0 && (
              <Pressable style={styles.optionBtnSelected} onPress={onScrapeSelected}>
                <View style={styles.optionIconSelected}>
                  <CheckCircle2 size={22} color={colors.accent1} />
                </View>
                <View style={styles.optionTextWrap}>
                  <Text style={styles.optionTitle}>Selected items</Text>
                  <Text style={styles.optionDesc}>
                    Scan the {selectedCount} item
                    {selectedCount === 1 ? "" : "s"} you selected.
                  </Text>
                </View>
              </Pressable>
            )}

            <Pressable style={styles.optionBtn} onPress={onScrapeAll}>
              <View style={styles.optionIcon}>
                <Box size={22} color={colors.text1} />
              </View>
              <View style={styles.optionTextWrap}>
                <Text style={styles.optionTitle}>All products</Text>
                <Text style={styles.optionDesc}>
                  Scan your full pantry inventory for updated prices.
                </Text>
              </View>
            </Pressable>
          </View>
        </View>
      </View>
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
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    modalCard: {
      width: "100%",
      borderRadius: 26,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 20,
      backgroundColor: colors.bg,
      gap: 16,
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
    optionsList: {
      gap: 12,
    },
    optionBtn: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface1,
      gap: 12,
    },
    optionBtnSelected: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.accent1,
      backgroundColor: softAccent,
      gap: 12,
    },
    optionIcon: {
      width: 42,
      height: 42,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.bg,
    },
    optionIconSelected: {
      width: 42,
      height: 42,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.bg,
    },
    optionTextWrap: {
      flex: 1,
    },
    optionTitle: {
      color: colors.text1,
      fontSize: 15,
      fontWeight: "900",
    },
    optionDesc: {
      color: colors.text2,
      fontSize: 13,
      lineHeight: 18,
      marginTop: 3,
    },
  });
};
