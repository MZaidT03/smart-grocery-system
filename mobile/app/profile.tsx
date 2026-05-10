import { API_BASE_URL } from "@/constants/api";
import { useTheme } from "@/context/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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
import {
  ArrowLeft,
  Edit2,
  List,
  LogOut,
  Mail,
  Save,
  ShieldCheck,
  User,
  Users,
  XCircle,
} from "lucide-react-native";

export default function ProfileScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const params = useLocalSearchParams();
  const userId = Array.isArray(params.userId)
    ? params.userId[0]
    : params.userId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Keep a backup of the original profile to restore if the user cancels edits
  const [originalProfile, setOriginalProfile] = useState({
    name: "",
    email: "",
    household_size: "1",
    dietary_pref: "Non-Veg",
  });

  const [profile, setProfile] = useState({ ...originalProfile });

  useEffect(() => {
    if (userId) fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/user/${userId}/profile`);
      const data = await res.json();
      if (data.success) {
        const fetchedData = {
          name: data.user.name || "",
          email: data.user.email || "",
          household_size: String(data.user.household_size || 1),
          dietary_pref: data.user.dietary_pref || "Non-Veg",
        };
        setProfile(fetchedData);
        setOriginalProfile(fetchedData);
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!profile.name.trim() || !profile.household_size) {
      Alert.alert("Invalid Input", "Please fill out all editable fields.");
      return;
    }

    setSaving(true);
    try {
      await fetch(`${API_BASE_URL}/user/${userId}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          household_size: parseInt(profile.household_size, 10),
          dietary_pref: profile.dietary_pref,
        }),
      });

      setOriginalProfile(profile); // Save new state as original
      setIsEditing(false);
      Alert.alert("Success", "Profile Updated Successfully!");
    } catch (err) {
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setProfile(originalProfile); // Revert to original state
    setIsEditing(false);
  };

  const handleLogout = async () => {
    Alert.alert("Sign Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.clear();
          router.replace("/login");
        },
      },
    ]);
  };

  const cycleDietaryPref = () => {
    if (!isEditing) return;
    const prefs = ["Non-Veg", "Veg", "Vegan"];
    const idx = prefs.indexOf(profile.dietary_pref);
    setProfile({ ...profile, dietary_pref: prefs[(idx + 1) % prefs.length] });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.accent1} />
          <Text style={styles.loadingText}>Loading Profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}>
          <ArrowLeft size={24} color={colors.text1} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Account Profile</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Identity Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(profile.name || "U").charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.proBadgeAbs}>
              <ShieldCheck size={12} color={colors.bg} />
              <Text style={styles.proText}>PRO</Text>
            </View>
          </View>
          <Text style={styles.nameText}>{profile.name || "User"}</Text>
          <Text style={styles.emailText}>{profile.email}</Text>
        </View>

        {/* Settings Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderTitle}>
              <User size={20} color={colors.text1} />
              <Text style={styles.sectionTitle}>Personal Details</Text>
            </View>
            {!isEditing && (
              <Pressable style={styles.editButton} onPress={() => setIsEditing(true)}>
                <Edit2 size={14} color={colors.text1} />
                <Text style={styles.editButtonText}>Edit</Text>
              </Pressable>
            )}
          </View>

          {/* Form Fields */}
          <View style={styles.formGroup}>
            {/* Name Field */}
            <View style={[styles.inputRow, isEditing && styles.inputRowActive]}>
              <View style={[styles.iconWrap, isEditing && styles.iconWrapActive]}>
                <User size={18} color={isEditing ? colors.accent1 : colors.text3} />
              </View>
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>FULL NAME</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={profile.name}
                    onChangeText={(text) => setProfile({ ...profile, name: text })}
                    placeholder="Enter your name"
                    placeholderTextColor={colors.text3}
                    autoFocus
                  />
                ) : (
                  <Text style={styles.readOnlyText}>{profile.name || "Not provided"}</Text>
                )}
              </View>
            </View>

            {/* Email Field (Always read-only) */}
            <View style={[styles.inputRow, { opacity: isEditing ? 0.6 : 1 }]}>
              <View style={styles.iconWrap}>
                <Mail size={18} color={colors.text3} />
              </View>
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                <Text style={styles.readOnlyText}>{profile.email}</Text>
              </View>
            </View>

            {/* Household Size Field */}
            <View style={[styles.inputRow, isEditing && styles.inputRowActive]}>
              <View style={[styles.iconWrap, isEditing && styles.iconWrapActive]}>
                <Users size={18} color={isEditing ? colors.accent1 : colors.text3} />
              </View>
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>HOUSEHOLD SIZE</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={profile.household_size}
                    onChangeText={(text) => setProfile({ ...profile, household_size: text })}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                ) : (
                  <Text style={styles.readOnlyText}>{profile.household_size} Member(s)</Text>
                )}
              </View>
            </View>

            {/* Dietary Preference Field */}
            <Pressable
              style={[styles.inputRow, isEditing && styles.inputRowActive]}
              onPress={cycleDietaryPref}
              disabled={!isEditing}
            >
              <View style={[styles.iconWrap, isEditing && styles.iconWrapActive]}>
                <List size={18} color={isEditing ? colors.accent1 : colors.text3} />
              </View>
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>DIETARY PREFERENCE</Text>
                <Text style={isEditing ? styles.inputActiveText : styles.readOnlyText}>
                  {profile.dietary_pref}
                </Text>
              </View>
              {isEditing && (
                <Text style={styles.cycleHint}>Tap to change</Text>
              )}
            </Pressable>
          </View>

          {/* Action Buttons (Only visible in Edit Mode) */}
          {isEditing && (
            <View style={styles.actionRow}>
              <Pressable style={styles.cancelBtn} onPress={handleCancel} disabled={saving}>
                <XCircle size={18} color={colors.text2} />
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>

              <Pressable style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={handleUpdate} disabled={saving}>
                {saving ? (
                  <ActivityIndicator size="small" color={colors.bg} />
                ) : (
                  <>
                    <Save size={18} color={colors.bg} />
                    <Text style={styles.saveBtnText}>Save Changes</Text>
                  </>
                )}
              </Pressable>
            </View>
          )}
        </View>

        {/* Logout Zone */}
        <View style={styles.logoutCard}>
          <View style={styles.logoutTextContainer}>
            <Text style={styles.logoutTitle}>Sign Out</Text>
            <Text style={styles.logoutDesc}>Securely log out of your account on this device.</Text>
          </View>
          <Pressable style={styles.logoutBtn} onPress={handleLogout}>
            <LogOut size={16} color="#ef4444" />
            <Text style={styles.logoutBtnText}>Logout</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    // Header
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.bg,
    },
    iconButton: {
      padding: 8,
      marginLeft: -8,
    },
    headerCenter: {
      flex: 1,
      alignItems: "center",
    },
    title: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.text1,
      letterSpacing: -0.5,
    },
    headerSpacer: {
      width: 40,
    },
    loadingWrap: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      color: colors.text2,
      marginTop: 12,
      fontSize: 14,
      fontWeight: "500",
    },
    content: {
      padding: 20,
      gap: 20,
      paddingBottom: 40,
    },

    // Hero / Identity Card
    heroCard: {
      backgroundColor: colors.surface1,
      borderRadius: 24,
      padding: 24,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    avatarContainer: {
      position: "relative",
      marginBottom: 16,
    },
    avatar: {
      width: 86,
      height: 86,
      borderRadius: 43,
      backgroundColor: colors.accent1,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 4,
      borderColor: colors.surface2,
    },
    avatarText: {
      fontSize: 36,
      fontWeight: "800",
      color: colors.bg,
    },
    proBadgeAbs: {
      position: "absolute",
      bottom: -4,
      alignSelf: "center",
      backgroundColor: colors.text1,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 100,
      borderWidth: 2,
      borderColor: colors.surface1,
    },
    proText: {
      color: colors.bg,
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 0.5,
    },
    nameText: {
      fontSize: 24,
      fontWeight: "800",
      color: colors.text1,
      letterSpacing: -0.5,
    },
    emailText: {
      fontSize: 14,
      color: colors.text3,
      marginTop: 4,
      fontWeight: "500",
    },

    // Section Card
    sectionCard: {
      backgroundColor: colors.surface1,
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 20,
    },
    sectionHeaderTitle: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text1,
      letterSpacing: -0.3,
    },
    editButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface2,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 100,
      gap: 6,
    },
    editButtonText: {
      color: colors.text1,
      fontSize: 13,
      fontWeight: "600",
    },

    // Form Elements
    formGroup: {
      gap: 12,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface2,
      borderRadius: 16,
      padding: 12,
      gap: 12,
      borderWidth: 1,
      borderColor: "transparent",
    },
    inputRowActive: {
      backgroundColor: colors.bg,
      borderColor: colors.border,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.surface1,
      alignItems: "center",
      justifyContent: "center",
    },
    iconWrapActive: {
      backgroundColor: "rgba(16, 185, 129, 0.1)", // Assuming accent1 is a green
    },
    inputContent: {
      flex: 1,
      justifyContent: "center",
    },
    inputLabel: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.text3,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: 2,
    },
    readOnlyText: {
      fontSize: 15,
      color: colors.text1,
      fontWeight: "600",
    },
    input: {
      fontSize: 15,
      color: colors.text1,
      fontWeight: "600",
      padding: 0,
      margin: 0,
    },
    inputActiveText: {
      fontSize: 15,
      color: colors.accent1,
      fontWeight: "700",
    },
    cycleHint: {
      fontSize: 11,
      color: colors.accent1,
      fontWeight: "600",
      paddingRight: 8,
    },

    // Action Row (Save/Cancel)
    actionRow: {
      flexDirection: "row",
      gap: 12,
      marginTop: 24,
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    cancelBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      paddingVertical: 14,
      gap: 8,
    },
    cancelBtnText: {
      color: colors.text2,
      fontWeight: "700",
      fontSize: 14,
    },
    saveBtn: {
      flex: 1.5,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accent1,
      borderRadius: 14,
      paddingVertical: 14,
      gap: 8,
    },
    saveBtnText: {
      color: colors.bg,
      fontWeight: "700",
      fontSize: 14,
    },

    // Logout Card
    logoutCard: {
      backgroundColor: "rgba(239, 68, 68, 0.05)",
      borderWidth: 1,
      borderColor: "rgba(239, 68, 68, 0.2)",
      borderRadius: 20,
      padding: 20,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    logoutTextContainer: {
      flex: 1,
      paddingRight: 10,
    },
    logoutTitle: {
      color: "#ef4444",
      fontWeight: "700",
      fontSize: 15,
    },
    logoutDesc: {
      color: "rgba(239, 68, 68, 0.7)",
      fontSize: 12,
      marginTop: 4,
      lineHeight: 18,
    },
    logoutBtn: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(239, 68, 68, 0.1)",
      borderWidth: 1,
      borderColor: "rgba(239, 68, 68, 0.2)",
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
      gap: 6,
    },
    logoutBtnText: {
      color: "#ef4444",
      fontWeight: "700",
      fontSize: 13,
    },
  });