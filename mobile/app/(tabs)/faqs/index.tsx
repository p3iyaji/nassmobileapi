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
import { faqsApi } from "@/lib/api/endpoints";
import type { Faq } from "@/types/api";
import { theme } from "@/constants/theme";
import { SearchBar } from "@/components/SearchBar";

export default function FaqsListScreen() {
  const router = useRouter();
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await faqsApi.list();
      setFaqs(res.data ?? []);
    } catch {
      setFaqs([]);
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
      data={faqs}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View style={styles.searchWrap}>
          <SearchBar placeholder="Search FAQs, E-Library…" compact />
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
          onPress={() => router.push(`/(tabs)/faqs/${item.id}`)}
          activeOpacity={0.7}
        >
          <Text style={styles.itemTitle} numberOfLines={2}>{item.question}</Text>
        </TouchableOpacity>
      )}
      ListEmptyComponent={
        <Text style={styles.empty}>No FAQs found.</Text>
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
  itemTitle: { fontSize: 15, color: theme.text, fontWeight: "500" },
  empty: { color: theme.placeholder, textAlign: "center", marginTop: 24 },
});
