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
import type { Member } from "@/types/api";

export default function MembersListScreen() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await billTrackerApi.members({ limit: 100 });
      setMembers(res.data ?? []);
    } catch {
      setMembers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

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
        <SearchBar placeholder="Search members…" compact />
      </View>
      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={theme.accent} />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => router.push(`/(tabs)/bill-tracker/members/${item.id}`)}
            activeOpacity={0.7}
          >
            <Text style={styles.itemTitle}>{item.name}</Text>
            {item.party || item.chamber ? <Text style={styles.itemMeta}>{[item.party, item.chamber].filter(Boolean).join(" · ")}</Text> : null}
            {item.state ? <Text style={styles.itemState}>{item.state}</Text> : null}
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No members found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.background },
  searchWrap: { padding: 16, paddingBottom: 8 },
  list: { padding: 16, paddingBottom: 32 },
  item: { padding: 16, backgroundColor: theme.surface, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: theme.border },
  itemTitle: { fontSize: 16, fontWeight: "600", color: theme.text },
  itemMeta: { fontSize: 13, color: theme.textMuted, marginTop: 4 },
  itemState: { fontSize: 12, color: theme.placeholder, marginTop: 2 },
  empty: { color: theme.placeholder, textAlign: "center", marginTop: 24 },
});
