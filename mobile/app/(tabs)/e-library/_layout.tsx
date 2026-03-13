import { Stack } from "expo-router";
import { theme } from "@/constants/theme";

export default function ELibraryLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
        headerBackTitle: "Back",
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: "E-Library" }} />
      <Stack.Screen name="categories" options={{ headerShown: false }} />
      <Stack.Screen name="resources" options={{ headerShown: false }} />
      <Stack.Screen name="reading-list" options={{ title: "Reading List" }} />
    </Stack>
  );
}
