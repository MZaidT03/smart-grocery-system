import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { ThemeProvider, useTheme } from "@/context/theme";

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
  return (
    <ThemeProvider>
      <RootStack />
    </ThemeProvider>
  );
}
