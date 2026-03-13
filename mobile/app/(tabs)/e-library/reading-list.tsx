import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { getToken } from "@/store/auth";
import { resourcesApi } from "@/lib/api/endpoints";
import type { Resource } from "@/types/api";
import { theme } from "@/constants/theme";
import { SearchBar } from "@/components/SearchBar";

export default function ReadingListScreen() {
  const router = useRouter();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const token = await getToken();
      if (!token) {
        setResources([]);
        return;
      }
      const res = await resourcesApi.readingList();
      setResources((res.data as Resource[]) ?? []);
    } catch (e) {
      setResources([]);
      Alert.alert(
        "Error",
        "Could not load reading list. Sign in to see your saved items."
      );
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
        <SearchBar placeholder="Search E-Library, FAQs…" compact />
      </View>
      <Text style={styles.subtitle}>
        Resources you've saved. Sign in to see your list.
      </Text>
      <FlatList
        data={resources}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
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
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Your reading list is empty. Sign in to add items.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.background,
  },
  searchWrap: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  subtitle: {
    fontSize: 14,
    color: theme.textMuted,
    padding: 16,
    paddingBottom: 0,
  },
  list: { padding: 16, paddingBottom: 32 },
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
  empty: { color: theme.placeholder, textAlign: "center", marginTop: 24 },
});
