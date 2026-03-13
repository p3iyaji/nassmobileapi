import { useEffect } from "react";
import { Platform } from "react-native";
import { Stack } from "expo-router";
import { useAuthStore } from "@/store/useAuthStore";
import * as SplashScreen from "expo-splash-screen";

if (Platform.OS !== "web") {
  SplashScreen.preventAutoHideAsync();
}

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (isHydrated && Platform.OS !== "web") {
      SplashScreen.hideAsync();
    }
  }, [isHydrated]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
