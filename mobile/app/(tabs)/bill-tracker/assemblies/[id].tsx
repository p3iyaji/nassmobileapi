import { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { billTrackerApi } from "@/lib/api/endpoints";
import { theme } from "@/constants/theme";
import type { Assembly } from "@/types/api";

function formatDate(s: string | undefined) {
  if (!s) return "—";
  try {
    const d = new Date(s);
    return isNaN(d.getTime()) ? s : d.toLocaleDateString();
  } catch {
    return s;
  }
}

export default function AssemblyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [assembly, setAssembly] = useState<Assembly | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!id) return;
    try {
      const res = await billTrackerApi.assembly(id);
      setAssembly(res.data ?? null);
    } catch {
      setAssembly(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (!assembly) {
    return (
      <View style={styles.centered}>
        <Text style={styles.empty}>Assembly not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={theme.accent} />}
    >
      <Text style={styles.title}>{assembly.name}</Text>
      {assembly.status ? <Text style={styles.status}>{assembly.status}</Text> : null}
      <Text style={styles.label}>Start date</Text>
      <Text style={styles.value}>{formatDate(assembly.startDate)}</Text>
      <Text style={styles.label}>End date</Text>
      <Text style={styles.value}>{assembly.endDate ? formatDate(assembly.endDate) : "Present"}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.background },
  title: { fontSize: 22, fontWeight: "700", color: theme.text, marginBottom: 8 },
  status: { fontSize: 14, color: theme.textMuted, marginBottom: 16 },
  label: { fontSize: 12, color: theme.textMuted, marginTop: 12, marginBottom: 4 },
  value: { fontSize: 14, color: theme.text },
  empty: { color: theme.placeholder },
});
