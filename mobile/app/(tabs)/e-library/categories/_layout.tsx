import { Stack } from "expo-router";
import { theme } from "@/constants/theme";

export default function CategoriesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
        headerBackTitle: "Back",
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Categories" }} />
      <Stack.Screen name="[id]" options={{ title: "Category" }} />
    </Stack>
  );
}
