import { Link, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { API_BASE_URL } from "@/constants/api";
import { Colors } from "@/constants/theme";
import { useTheme } from "@/context/theme";
import ThemeToggle from "@/components/theme-toggle";

export default function RegisterScreen() {
  const { scheme } = useTheme();
  const palette = Colors[scheme];
  const styles = useMemo(() => createStyles(palette), [palette]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [householdSize, setHouseholdSize] = useState("1");
  const [dietType, setDietType] = useState("Non-Veg");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const dietOptions = useMemo(() => ["Non-Veg", "Veg", "Vegan"], []);

  const handleRegister = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: name,
          email,
          password,
          householdSize: Number.parseInt(householdSize || "1", 10),
          dietType,
        }),
      });

      const data = await res.json();

      if (data?.success) {
        const loginRes = await fetch(`${API_BASE_URL}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: name, password }),
        });
        const loginData = await loginRes.json();
        if (loginData?.success) {
          Alert.alert("Account created", "Welcome to Smart Grocery.");
          router.replace({
            pathname: "/home",
            params: {
              userId: String(loginData?.user?.id ?? ""),
              name: loginData?.user?.name ?? "",
            },
          });
        } else {
          Alert.alert("Account created", "Please log in.");
          router.replace("/login");
        }
        return;
      }

      setError(data?.message || "Registration failed");
    } catch (err) {
      setError("Registration failed. Server unreachable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.topRow}>
          <ThemeToggle />
        </View>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>
          Join Smart Grocery and start saving today.
        </Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Your username"
            placeholderTextColor={palette.muted}
            style={styles.input}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={palette.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Household size</Text>
          <TextInput
            value={householdSize}
            onChangeText={setHouseholdSize}
            placeholder="1"
            placeholderTextColor={palette.muted}
            keyboardType="number-pad"
            style={styles.input}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Diet preference</Text>
          <View style={styles.dietRow}>
            {dietOptions.map((option) => {
              const isActive = option === dietType;
              return (
                <Pressable
                  key={option}
                  onPress={() => setDietType(option)}
                  style={[styles.dietPill, isActive && styles.dietPillActive]}
                >
                  <Text
                    style={[
                      styles.dietPillText,
                      isActive && styles.dietPillTextActive,
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Create a password"
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
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={palette.background} />
          ) : (
            <Text style={styles.primaryButtonText}>Create account</Text>
          )}
        </Pressable>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <Link href="/login" style={styles.footerLink}>
            Log in
          </Link>
        </View>

        <Link href="/" style={styles.backLink}>
          Back to landing
        </Link>
      </ScrollView>
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
    dietRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    dietPill: {
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: palette.surface,
    },
    dietPillActive: {
      backgroundColor: palette.accent,
      borderColor: palette.accent,
    },
    dietPillText: {
      color: palette.text,
      fontSize: 12,
      fontWeight: "600",
    },
    dietPillTextActive: {
      color: palette.background,
    },
    primaryButton: {
      backgroundColor: palette.accentAlt,
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
