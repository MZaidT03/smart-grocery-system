import React, { useEffect, useState, useMemo } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Info, AlertTriangle, CheckCircle2, Activity } from "lucide-react-native";
import { API_BASE_URL } from "@/constants/api";
import { useTheme } from "@/context/theme";

type Notification = {
  id: number;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "system";
  is_read: number;
  created_at: string;
  count: number;
};

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const router = useRouter();
  const params = useLocalSearchParams();
  const userId = Array.isArray(params.userId) ? params.userId[0] : params.userId;

  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!userId) return;

    const fetchAndMarkRead = async () => {
      try {
        setLoading(true);
        // Fetch notifications
        const res = await fetch(`${API_BASE_URL}/notifications?userId=${userId}`);
        const data = await res.json();
        
        if (data.success && data.notifications) {
          setNotifications(data.notifications);
        }

        // Mark as read in the background
        await fetch(`${API_BASE_URL}/notifications/mark-read`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
      } catch (err) {
        console.error("Error fetching notifications:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAndMarkRead();
  }, [userId]);

  const renderIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle2 size={24} color={colors.success} />;
      case "warning":
        return <AlertTriangle size={24} color={colors.warning} />;
      case "system":
        return <Activity size={24} color={colors.accent1} />;
      case "info":
      default:
        return <Info size={24} color={colors.text2} />;
    }
  };

  const getIconBackground = (type: Notification["type"]) => {
    const isDark = colors.bg === "#000000";
    switch (type) {
      case "success":
        return isDark ? "rgba(34, 197, 94, 0.15)" : "rgba(34, 197, 94, 0.1)";
      case "warning":
        return isDark ? "rgba(234, 179, 8, 0.15)" : "rgba(234, 179, 8, 0.1)";
      case "system":
        return isDark ? "rgba(74, 222, 128, 0.15)" : "rgba(22, 101, 52, 0.08)";
      case "info":
      default:
        return isDark ? "rgba(136, 136, 136, 0.15)" : "rgba(102, 102, 102, 0.08)";
    }
  };

  const renderItem = ({ item }: { item: Notification }) => {
    const isUnread = item.is_read === 0;
    const dateStr = new Date(item.created_at).toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });

    return (
      <View style={[styles.notificationCard, isUnread && styles.unreadCard]}>
        <View style={[styles.iconWrap, { backgroundColor: getIconBackground(item.type) }]}>
          {renderIcon(item.type)}
        </View>
        <View style={styles.cardContent}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDate}>{dateStr}</Text>
          </View>
          <Text style={styles.cardMessage}>{item.message}</Text>
          {item.count > 1 && (
            <View style={styles.badgeWrap}>
              <Text style={styles.badgeText}>+ {item.count - 1} similar updates</Text>
            </View>
          )}
        </View>
        {isUnread && <View style={styles.unreadDot} />}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text1} />
        </Pressable>
        <Text style={styles.title}>Notifications</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.accent1} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <BellOffIcon color={colors.text3} size={48} />
          <Text style={styles.emptyTitle}>You're all caught up!</Text>
          <Text style={styles.emptyBody}>No new notifications to display right now.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

// Just a quick inline fallback icon since BellOff wasn't imported from lucide to keep imports clean
const BellOffIcon = ({ color, size }: { color: string; size: number }) => (
  <View style={{ width: size, height: size, borderRadius: size/2, backgroundColor: color, opacity: 0.2, alignItems: 'center', justifyContent: 'center' }} />
);

const createStyles = (colors: any) => {
  const isDark = colors.bg === "#000000";

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    headerRow: {
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 20,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: colors.surface1,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    title: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.text1,
    },
    headerSpacer: {
      width: 44,
    },
    loadingWrap: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 40,
      paddingBottom: 100,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: "900",
      color: colors.text1,
      marginTop: 20,
      marginBottom: 8,
    },
    emptyBody: {
      fontSize: 15,
      color: colors.text2,
      textAlign: "center",
      lineHeight: 22,
    },
    listContent: {
      paddingHorizontal: 20,
      paddingBottom: 40,
      gap: 16,
    },
    notificationCard: {
      backgroundColor: colors.surface1,
      borderRadius: 24,
      padding: 16,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 16,
      borderWidth: 1,
      borderColor: colors.border,
      position: "relative",
    },
    unreadCard: {
      backgroundColor: isDark ? "rgba(74, 222, 128, 0.05)" : "#f4fdf7",
      borderColor: isDark ? "rgba(74, 222, 128, 0.2)" : "#dcfce7",
    },
    iconWrap: {
      width: 48,
      height: 48,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    cardContent: {
      flex: 1,
    },
    cardHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 6,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: colors.text1,
      flex: 1,
      marginRight: 8,
    },
    cardDate: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.text3,
    },
    cardMessage: {
      fontSize: 14,
      color: colors.text2,
      lineHeight: 20,
    },
    badgeWrap: {
      alignSelf: "flex-start",
      marginTop: 10,
      backgroundColor: colors.surface2,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.text1,
    },
    unreadDot: {
      position: "absolute",
      top: 16,
      right: 16,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.accent1,
    },
  });
};
