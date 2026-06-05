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
  Switch,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { API_BASE_URL } from "@/constants/api";
import { Colors } from "@/constants/theme";
import { useTheme } from "@/context/theme";
import ThemeToggle from "@/components/theme-toggle";
import * as LocalAuthentication from "expo-local-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScanFace } from "lucide-react-native";

export default function LoginScreen() {
  const { scheme } = useTheme();
  const palette = Colors[scheme];
  const styles = useMemo(() => createStyles(palette), [palette]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const router = useRouter();

  React.useEffect(() => {
    (async () => {
      const hardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setIsBiometricSupported(hardware && enrolled);

      const remainLogged = await AsyncStorage.getItem("remain_logged_in");
      if (remainLogged === "true") {
        const storedUser = await AsyncStorage.getItem("user_creds");
        if (storedUser) {
          const { username: u, password: p } = JSON.parse(storedUser);
          setUsername(u);
          setPassword(p);

          if (hardware && enrolled) {
            const authResult = await LocalAuthentication.authenticateAsync({
              promptMessage: "Unlock Smart Grocery",
              fallbackLabel: "",
            });
            if (authResult.success) {
              performLogin(u, p, false);
            } else {
              Alert.alert("Biometric Error", authResult.error || "Authentication failed.");
            }
          } else {
            // Auto-login if no biometrics are available on device
            performLogin(u, p, false);
          }
        }
      }
    })();
  }, []);

  const handleBiometricLogin = async () => {
    setError("");
    const storedUser = await AsyncStorage.getItem("user_creds");
    if (!storedUser) {
      setError("No saved credentials. Please login manually first and check 'Remain Logged In'.");
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Login with Face ID / Touch ID",
      fallbackLabel: "",
    });

    if (result.success) {
      const { username: u, password: p } = JSON.parse(storedUser);
      setUsername(u);
      setPassword(p);
      performLogin(u, p, false);
    } else {
      setError(result.error ? `Biometric Error: ${result.error}` : "Authentication failed.");
    }
  };

  const performLogin = async (loginUser: string, loginPass: string, saveCreds: boolean) => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUser, password: loginPass }),
      });

      const data = await res.json();

      if (data?.success) {
        if (saveCreds && rememberMe) {
          await AsyncStorage.setItem("remain_logged_in", "true");
          await AsyncStorage.setItem("user_creds", JSON.stringify({ username: loginUser, password: loginPass }));
        } else if (saveCreds && !rememberMe) {
          await AsyncStorage.removeItem("remain_logged_in");
          // Optionally keep user_creds for FaceID but require tap, or clear it. Let's keep for FaceID.
          await AsyncStorage.setItem("user_creds", JSON.stringify({ username: loginUser, password: loginPass }));
        }
        
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

  const handleLogin = () => {
    performLogin(username, password, true);
  };



  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
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

        <View style={styles.optionsRow}>
          <View style={styles.rememberWrap}>
            <Switch
              value={rememberMe}
              onValueChange={setRememberMe}
              trackColor={{ false: palette.border, true: palette.accent }}
              thumbColor={palette.surface}
            />
            <Text style={styles.rememberText}>Remain Logged In</Text>
          </View>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.buttonRow}>
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

          {isBiometricSupported && (
            <Pressable
              style={styles.biometricButton}
              onPress={handleBiometricLogin}
              disabled={loading}
            >
              <ScanFace size={24} color={palette.background} />
            </Pressable>
          )}
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>New here?</Text>
          <Link href="/register" style={styles.footerLink}>
            Create an account
          </Link>
        </View>

        <Link href="/" style={styles.backLink}>
          Back to landing
        </Link>
        </ScrollView>
      </KeyboardAvoidingView>
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
      flex: 1,
      height: 48,
      justifyContent: "center",
    },
    primaryButtonDisabled: {
      opacity: 0.7,
    },
    primaryButtonText: {
      color: palette.background,
      fontSize: 16,
      fontWeight: "600",
    },
    buttonRow: {
      flexDirection: "row",
      gap: 12,
    },
    biometricButton: {
      backgroundColor: palette.accent,
      borderRadius: 16,
      width: 48,
      height: 48,
      alignItems: "center",
      justifyContent: "center",
    },
    optionsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: -4,
      marginBottom: 8,
    },
    rememberWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    rememberText: {
      fontSize: 14,
      color: palette.text,
      fontWeight: "500",
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
