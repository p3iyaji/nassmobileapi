import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { billTrackerApi } from "@/lib/api/endpoints";
import { SearchBar } from "@/components/SearchBar";
import { theme } from "@/constants/theme";
import type { Bill } from "@/types/api";

const STATUS_OPTIONS = ["All", "Passed", "Awaiting 2nd Reading", "Awaiting 3rd Reading", "Committee", "Withdrawn"];

export default function BillsListScreen() {
  const router = useRouter();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = statusFilter && statusFilter !== "All"
        ? await billTrackerApi.billsByStatus(statusFilter)
        : await billTrackerApi.bills({ limit: 100 });
      setBills(res.data ?? []);
    } catch {
      setBills([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, [statusFilter]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <SearchBar placeholder="Search bills…" compact />
      </View>
      <Text style={styles.filterLabel}>Filter by status</Text>
      <FlatList
        horizontal
        data={STATUS_OPTIONS}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.chips}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.chip, statusFilter === item || (item === "All" && !statusFilter) ? styles.chipActive : null]}
            onPress={() => setStatusFilter(item === "All" ? null : item)}
          >
            <Text style={[styles.chipText, statusFilter === item || (item === "All" && !statusFilter) ? styles.chipTextActive : null]}>{item}</Text>
          </TouchableOpacity>
        )}
      />
      <FlatList
        data={bills}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={theme.accent} />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => router.push(`/(tabs)/bill-tracker/bills/${item.id}`)}
            activeOpacity={0.7}
          >
            <Text style={styles.itemNumber}>{item.number ?? item.id}</Text>
            <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
            {item.status ? <Text style={styles.itemMeta}>{item.status}</Text> : null}
            {item.sponsorName ? <Text style={styles.itemSponsor}>Sponsor: {item.sponsorName}</Text> : null}
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No bills found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.background },
  searchWrap: { padding: 16, paddingBottom: 8 },
  filterLabel: { fontSize: 12, color: theme.textMuted, paddingHorizontal: 16, marginBottom: 4 },
  chips: { paddingHorizontal: 16, marginBottom: 6, gap: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 14, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, marginRight: 6 },
  chipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  chipText: { color: theme.textMuted, fontSize: 12 },
  chipTextActive: { color: theme.primaryContrast, fontWeight: "600" },
  list: { padding: 16, paddingBottom: 32 },
  item: { padding: 16, backgroundColor: theme.surface, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: theme.border },
  itemNumber: { fontSize: 12, color: theme.primary, fontWeight: "600", marginBottom: 4 },
  itemTitle: { fontSize: 16, fontWeight: "600", color: theme.text },
  itemMeta: { fontSize: 13, color: theme.textMuted, marginTop: 4 },
  itemSponsor: { fontSize: 12, color: theme.placeholder, marginTop: 2 },
  empty: { color: theme.placeholder, textAlign: "center", marginTop: 24 },
});
