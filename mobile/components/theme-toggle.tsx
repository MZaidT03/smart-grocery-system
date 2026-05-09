import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import { useTheme } from "@/context/theme";

export default function ThemeToggle() {
  const { mode, setMode, scheme } = useTheme();
  const palette = Colors[scheme];
  const styles = useMemo(() => createStyles(palette), [palette]);

  const handleToggle = () => {
    if (mode === "system") {
      setMode("dark");
      return;
    }
    setMode(mode === "dark" ? "light" : "dark");
  };

  return (
    <Pressable style={styles.button} onPress={handleToggle}>
      <View style={styles.iconWrap}>
        <Feather
          name={scheme === "dark" ? "moon" : "sun"}
          size={14}
          color={styles.icon.color}
        />
      </View>
      <Text style={styles.label}>{mode === "system" ? "System" : scheme}</Text>
    </Pressable>
  );
}

const createStyles = (palette: typeof Colors.light) =>
  StyleSheet.create({
    button: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: palette.surfaceAlt,
      borderWidth: 1,
      borderColor: palette.border,
    },
    iconWrap: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: palette.surface,
    },
    icon: {
      color: palette.text,
    },
    label: {
      color: palette.text,
      fontSize: 12,
      fontWeight: "600",
      textTransform: "capitalize",
    },
  });
