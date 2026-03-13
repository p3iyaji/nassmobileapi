import { Stack } from "expo-router";
import { theme } from "@/constants/theme";

export default function AssembliesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
        headerBackTitle: "Back",
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Assemblies" }} />
      <Stack.Screen name="[id]" options={{ title: "Assembly" }} />
    </Stack>
  );
}
