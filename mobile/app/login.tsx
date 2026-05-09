import { Link, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { API_BASE_URL } from "@/constants/api";
import { Colors } from "@/constants/theme";
import { useTheme } from "@/context/theme";
import ThemeToggle from "@/components/theme-toggle";

export default function LoginScreen() {
  const { scheme } = useTheme();
  const palette = Colors[scheme];
  const styles = useMemo(() => createStyles(palette), [palette]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (data?.success) {
        Alert.alert("Login successful", "Welcome back!");
        router.replace({
          pathname: "/home",
          params: {
            userId: String(data?.user?.id ?? ""),
            name: data?.user?.name ?? "",
          },
        });
        return;
      }

      setError(data?.message || "Invalid credentials");
    } catch (err) {
      setError("Server error. Ensure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.topRow}>
          <ThemeToggle />
        </View>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>
          Log in to manage your smart grocery plan.
        </Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Username or Email</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="Username or email"
            placeholderTextColor={palette.muted}
            autoCapitalize="none"
            style={styles.input}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            placeholderTextColor={palette.muted}
            secureTextEntry
            style={styles.input}
          />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable
          style={[
            styles.primaryButton,
            loading && styles.primaryButtonDisabled,
          ]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={palette.background} />
          ) : (
            <Text style={styles.primaryButtonText}>Log in</Text>
          )}
        </Pressable>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>New here?</Text>
          <Link href="/register" style={styles.footerLink}>
            Create an account
          </Link>
        </View>

        <Link href="/" style={styles.backLink}>
          Back to landing
        </Link>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (palette: typeof Colors.light) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: palette.background,
    },
    container: {
      padding: 24,
      gap: 18,
    },
    topRow: {
      alignItems: "flex-end",
    },
    title: {
      fontSize: 26,
      fontWeight: "700",
      color: palette.text,
    },
    subtitle: {
      fontSize: 14,
      color: palette.muted,
    },
    fieldGroup: {
      gap: 8,
    },
    label: {
      fontSize: 12,
      fontWeight: "600",
      color: palette.text,
    },
    input: {
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
      backgroundColor: palette.surface,
      color: palette.text,
    },
    primaryButton: {
      backgroundColor: palette.accent,
      borderRadius: 16,
      paddingVertical: 12,
      alignItems: "center",
    },
    primaryButtonDisabled: {
      opacity: 0.7,
    },
    primaryButtonText: {
      color: palette.background,
      fontSize: 16,
      fontWeight: "600",
    },
    errorText: {
      color: palette.danger,
      backgroundColor: palette.surfaceAlt,
      borderRadius: 12,
      padding: 10,
      fontSize: 12,
    },
    footerRow: {
      flexDirection: "row",
      gap: 8,
      alignItems: "center",
    },
    footerText: {
      color: palette.muted,
    },
    footerLink: {
      color: palette.accent,
      fontWeight: "600",
    },
    backLink: {
      marginTop: 12,
      color: palette.muted,
    },
  });
