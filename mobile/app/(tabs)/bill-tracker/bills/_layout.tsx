import { Stack } from "expo-router";
import { theme } from "@/constants/theme";

export default function BillsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
        headerBackTitle: "Back",
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Bills" }} />
      <Stack.Screen name="[id]" options={{ title: "Bill" }} />
    </Stack>
  );
}
