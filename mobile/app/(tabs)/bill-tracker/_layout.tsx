import { Stack } from "expo-router";
import { theme } from "@/constants/theme";

export default function BillTrackerLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
        headerBackTitle: "Back",
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Bill Tracker" }} />
      <Stack.Screen name="bills" options={{ headerShown: false }} />
      <Stack.Screen name="members" options={{ headerShown: false }} />
      <Stack.Screen name="assemblies" options={{ headerShown: false }} />
    </Stack>
  );
}
