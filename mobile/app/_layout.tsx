import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { ThemeProvider, useTheme } from "@/context/theme";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function RootStack() {
  const { scheme } = useTheme();

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="home" />
        <Stack.Screen name="products" />
        <Stack.Screen name="product" />
        <Stack.Screen name="market-price" />
        <Stack.Screen name="shopping-list" />
        <Stack.Screen name="forecast" />
        <Stack.Screen name="analytics" />
        <Stack.Screen name="recipes" />
      </Stack>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
    </>
  );
}

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    // Request notification permissions
    const requestPermissions = async () => {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") {
        console.log("Failed to get push token for push notification!");
      }
    };
    requestPermissions();

    // Setup notification category with Restock All action
    Notifications.setNotificationCategoryAsync("FINISHED_ITEMS", [
      {
        identifier: "RESTOCK_ALL",
        buttonTitle: "Restock All Finished Items",
        options: {
          opensAppToForeground: true,
        },
      },
    ]);

    // Handle deep linking when user taps the notification or button
    const subscription = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        const actionIdentifier = response.actionIdentifier;
        const data = response.notification.request.content.data;
        const userId = data?.userId || 1;

        if (
          actionIdentifier === "RESTOCK_ALL" ||
          data?.action === "RESTOCK_ALL"
        ) {
          router.push({
            pathname: "/shopping-list",
            params: { userId: data?.userId || 1, autoGenerate: "stock" },
          });
        }
      }
    );

    return () => subscription.remove();
  }, [router]);

  return (
    <ThemeProvider>
      <RootStack />
    </ThemeProvider>
  );
}
