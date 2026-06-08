import React, { useMemo } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Sparkles } from "lucide-react-native";
import { useTheme } from "@/context/theme";

export default function SuggestionModal({ visible, suggestion, onClose, onAdd }: any) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!suggestion) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.container}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        
        <View style={styles.card}>
          <View style={styles.iconWrap}>
             <Sparkles size={32} color={colors.accent1} />
          </View>
          
          <Text style={styles.title}>Similar Pattern Found</Text>
          <Text style={styles.suggestionText}>
             People who bought this often buy <Text style={{fontWeight: '700'}}>{suggestion.item_name}</Text>.
          </Text>
          
          <View style={styles.reasonBox}>
             <Text style={styles.reasonText}>{suggestion.reason}</Text>
          </View>

          <View style={styles.footer}>
            <Pressable style={styles.ignoreButton} onPress={onClose}>
              <Text style={styles.ignoreText}>Ignore</Text>
            </Pressable>
            <Pressable style={styles.addButton} onPress={() => { onAdd(suggestion); onClose(); }}>
              <Text style={styles.addText}>Add {suggestion.item_name}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },
    card: {
      width: "100%",
      backgroundColor: colors.surface1,
      borderRadius: 24,
      padding: 24,
      alignItems: "center",
      elevation: 5,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
    },
    iconWrap: {
      width: 60, height: 60, borderRadius: 30, backgroundColor: colors.accent1 + "15",
      alignItems: "center", justifyContent: "center", marginBottom: 16,
    },
    title: { fontSize: 20, fontWeight: "800", color: colors.text1, marginBottom: 8 },
    suggestionText: { fontSize: 15, color: colors.text2, textAlign: "center", marginBottom: 16, lineHeight: 22 },
    reasonBox: { backgroundColor: colors.surface2, padding: 12, borderRadius: 12, marginBottom: 24, width: "100%" },
    reasonText: { fontSize: 13, color: colors.text3, textAlign: "center", fontStyle: "italic" },
    footer: { flexDirection: "row", gap: 12, width: "100%" },
    ignoreButton: { flex: 1, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface2 },
    ignoreText: { color: colors.text2, fontSize: 15, fontWeight: "700" },
    addButton: { flex: 1.5, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.accent1 },
    addText: { color: colors.bg, fontSize: 15, fontWeight: "800" },
  });
