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
import { resourcesApi } from "@/lib/api/endpoints";
import type { Resource } from "@/types/api";
import { theme } from "@/constants/theme";
import { SearchBar } from "@/components/SearchBar";

export default function ResourcesListScreen() {
  const router = useRouter();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await resourcesApi.list();
      setResources((res.data as Resource[]) ?? []);
    } catch {
      setResources([]);
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
    <FlatList
      data={resources}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View style={styles.searchWrap}>
          <SearchBar placeholder="Search resources, categories, FAQs…" compact />
        </View>
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
          tintColor={theme.accent}
        />
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.item}
          onPress={() => router.push(`/(tabs)/e-library/resources/${item.id}`)}
          activeOpacity={0.7}
        >
          <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
          {item.authors ? (
            <Text style={styles.itemMeta} numberOfLines={1}>{item.authors}</Text>
          ) : null}
          {item.abstract ? (
            <Text style={styles.itemAbstract} numberOfLines={2}>{item.abstract}</Text>
          ) : null}
        </TouchableOpacity>
      )}
      ListEmptyComponent={
        <Text style={styles.empty}>No resources found.</Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 32 },
  searchWrap: { marginBottom: 12 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.background,
  },
  item: {
    padding: 16,
    backgroundColor: theme.surface,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  itemTitle: { fontSize: 16, fontWeight: "600", color: theme.text },
  itemMeta: { fontSize: 13, color: theme.textMuted, marginTop: 4 },
  itemAbstract: { fontSize: 12, color: theme.placeholder, marginTop: 4 },
  empty: { color: theme.placeholder, textAlign: "center", marginTop: 24 },
});
