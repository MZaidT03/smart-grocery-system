import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
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

export default function LoginScreen() {
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
            placeholderTextColor="#9C9085"
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
            placeholderTextColor="#9C9085"
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
            <ActivityIndicator color="#FDE7C6" />
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F4F1EA",
  },
  container: {
    padding: 24,
    gap: 18,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1F2A24",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B5E55",
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#52453D",
  },
  input: {
    borderWidth: 1,
    borderColor: "#D8CEC4",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    color: "#1F2A24",
  },
  primaryButton: {
    backgroundColor: "#0E3A32",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: "#FDE7C6",
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    color: "#B42318",
    backgroundColor: "#FEE4E2",
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
    color: "#6B5E55",
  },
  footerLink: {
    color: "#0E3A32",
    fontWeight: "600",
  },
  backLink: {
    marginTop: 12,
    color: "#8C7C71",
  },
});
