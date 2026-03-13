import { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { billTrackerApi } from "@/lib/api/endpoints";
import { theme } from "@/constants/theme";
import type { Bill } from "@/types/api";

function formatDate(s: string | undefined) {
  if (!s) return "—";
  try {
    const d = new Date(s);
    return isNaN(d.getTime()) ? s : d.toLocaleDateString();
  } catch {
    return s;
  }
}

export default function BillDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!id) return;
    try {
      const res = await billTrackerApi.bill(id);
      setBill(res.data ?? null);
    } catch {
      setBill(null);
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

  if (!bill) {
    return (
      <View style={styles.centered}>
        <Text style={styles.empty}>Bill not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={theme.accent} />}
    >
      {bill.number ? <Text style={styles.number}>{bill.number}</Text> : null}
      <Text style={styles.title}>{bill.title}</Text>
      {bill.status ? <Text style={styles.status}>{bill.status}</Text> : null}
      {bill.sponsorName ? <Text style={styles.label}>Sponsor</Text> : null}
      {bill.sponsorName ? <Text style={styles.value}>{bill.sponsorName}</Text> : null}
      {bill.summary ? <Text style={styles.label}>Summary</Text> : null}
      {bill.summary ? <Text style={styles.value}>{bill.summary}</Text> : null}
      <Text style={styles.label}>Introduced</Text>
      <Text style={styles.value}>{formatDate(bill.introduced)}</Text>
      {bill.lastUpdated ? <><Text style={styles.label}>Last updated</Text><Text style={styles.value}>{formatDate(bill.lastUpdated)}</Text></> : null}
      {bill.firstReading ? <><Text style={styles.label}>First reading</Text><Text style={styles.value}>{formatDate(bill.firstReading)}</Text></> : null}
      {bill.secondReading ? <><Text style={styles.label}>Second reading</Text><Text style={styles.value}>{formatDate(bill.secondReading)}</Text></> : null}
      {bill.thirdReading ? <><Text style={styles.label}>Third reading</Text><Text style={styles.value}>{formatDate(bill.thirdReading)}</Text></> : null}
      {bill.tags && bill.tags.length > 0 ? <Text style={styles.label}>Tags</Text> : null}
      {bill.tags && bill.tags.length > 0 ? <Text style={styles.value}>{bill.tags.join(", ")}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.background },
  number: { fontSize: 14, color: theme.primary, fontWeight: "600", marginBottom: 4 },
  title: { fontSize: 20, fontWeight: "700", color: theme.text, marginBottom: 8 },
  status: { fontSize: 14, color: theme.textMuted, marginBottom: 16 },
  label: { fontSize: 12, color: theme.textMuted, marginTop: 12, marginBottom: 4 },
  value: { fontSize: 14, color: theme.text },
  empty: { color: theme.placeholder },
});
