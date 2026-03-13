import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { theme } from "@/constants/theme";
import { SearchBar } from "@/components/SearchBar";
import { newsApi } from "@/lib/api/endpoints";
import type { NewsPost } from "@/types/api";

function formatDate(s: string | undefined) {
  if (!s) return "";
  try {
    const d = new Date(s);
    return isNaN(d.getTime()) ? s : d.toLocaleDateString(undefined, { dateStyle: "medium" });
  } catch {
    return s;
  }
}

export default function LatestNewsScreen() {
  const router = useRouter();
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await newsApi.latest({ limit: 20 });
      setPosts(res.data ?? []);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.headerScroll} contentContainerStyle={styles.headerContent} scrollEnabled={false}>
        <View style={styles.header}>
          <Image
            source={require("@/assets/naltf-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>NALTF mobile</Text>
          <Text style={styles.subtitle}>National Assembly Library Trust Fund</Text>
        </View>
        <View style={styles.searchWrap}>
          <SearchBar placeholder="Search news, library, bills…" />
        </View>
      </ScrollView>
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => String(item.id)}
          style={styles.listContainer}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={theme.accent} />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No news at the moment.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/(tabs)/news/${item.id}`)}
              activeOpacity={0.8}
            >
              {item.featured_image ? (
                <Image source={{ uri: item.featured_image }} style={styles.cardImage} resizeMode="cover" />
              ) : null}
              <View style={styles.cardBody}>
                <Text style={styles.cardDate}>{formatDate(item.date)}</Text>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                {item.excerpt ? <Text style={styles.cardExcerpt} numberOfLines={2}>{item.excerpt}</Text> : null}
                {item.author ? <Text style={styles.cardAuthor}>{item.author}</Text> : null}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  headerScroll: { flexGrow: 0 },
  headerContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16 },
  header: { alignItems: "center", marginBottom: 20 },
  logo: { width: 80, height: 80, marginBottom: 8 },
  title: { fontSize: 20, fontWeight: "700", color: theme.text, marginBottom: 4 },
  subtitle: { fontSize: 13, color: theme.textMuted, textAlign: "center" },
  searchWrap: { marginBottom: 12 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContainer: { flex: 1 },
  list: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.border,
  },
  cardImage: { width: "100%", height: 160, backgroundColor: theme.border },
  cardBody: { padding: 14 },
  cardDate: { fontSize: 12, color: theme.textMuted, marginBottom: 4 },
  cardTitle: { fontSize: 16, fontWeight: "600", color: theme.text },
  cardExcerpt: { fontSize: 13, color: theme.textMuted, marginTop: 6 },
  cardAuthor: { fontSize: 12, color: theme.placeholder, marginTop: 6 },
  emptyWrap: { padding: 24, alignItems: "center" },
  emptyText: { color: theme.textMuted },
});
