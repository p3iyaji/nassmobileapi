import { Stack } from "expo-router";
import { theme } from "@/constants/theme";

export default function ResourcesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
        headerBackTitle: "Back",
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Resources" }} />
      <Stack.Screen name="[id]" options={{ title: "Resource" }} />
    </Stack>
  );
}
