import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { categoriesApi, resourcesApi } from "@/lib/api/endpoints";
import type { Category, Resource } from "@/types/api";
import { theme } from "@/constants/theme";

export default function CategoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [category, setCategory] = useState<Category | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!id) return;
    try {
      const [catRes, resRes] = await Promise.all([
        categoriesApi.get(id),
        resourcesApi.list({ category_id: id }),
      ]);
      setCategory(catRes.data ?? null);
      setResources((resRes.data as Resource[]) ?? []);
    } catch {
      setCategory(null);
      setResources([]);
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

  if (!category) {
    return (
      <View style={styles.centered}>
        <Text style={styles.empty}>Category not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
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
    >
      <Text style={styles.title}>{category.name}</Text>
      {category.description ? (
        <Text style={styles.desc}>{category.description}</Text>
      ) : null}

      <Text style={styles.sectionTitle}>Resources</Text>
      {resources.length === 0 ? (
        <Text style={styles.empty}>No resources in this category.</Text>
      ) : (
        resources.map((r) => (
          <TouchableOpacity
            key={r.id}
            style={styles.resourceRow}
            onPress={() => router.push(`/(tabs)/e-library/resources/${r.id}`)}
            activeOpacity={0.7}
          >
            <Text style={styles.resourceTitle} numberOfLines={2}>{r.title}</Text>
            {r.authors ? (
              <Text style={styles.resourceMeta} numberOfLines={1}>{r.authors}</Text>
            ) : null}
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  content: { padding: 20, paddingBottom: 40 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.background,
  },
  title: { fontSize: 22, fontWeight: "700", color: theme.text, marginBottom: 8 },
  desc: { fontSize: 14, color: theme.textMuted, marginBottom: 24 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.textMuted,
    marginBottom: 12,
  },
  resourceRow: {
    padding: 16,
    backgroundColor: theme.surface,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  resourceTitle: { fontSize: 15, color: theme.text, fontWeight: "500" },
  resourceMeta: { fontSize: 12, color: theme.textMuted, marginTop: 4 },
  empty: { color: theme.placeholder, fontSize: 14 },
});
