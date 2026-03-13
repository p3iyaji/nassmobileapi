import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
  useWindowDimensions,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { newsApi } from "@/lib/api/endpoints";
import { theme } from "@/constants/theme";
import type { NewsPost } from "@/types/api";

function formatDate(s: string | undefined) {
  if (!s) return "";
  try {
    const d = new Date(s);
    return isNaN(d.getTime()) ? s : d.toLocaleDateString(undefined, { dateStyle: "long" });
  } catch {
    return s;
  }
}

export default function NewsDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [post, setPost] = useState<NewsPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { width } = useWindowDimensions();

  const load = async () => {
    if (!id) return;
    try {
      const res = await newsApi.post(id);
      setPost(res.data ?? null);
    } catch {
      setPost(null);
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

  if (!post) {
    return (
      <View style={styles.centered}>
        <Text style={styles.empty}>Article not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={theme.accent} />
      }
    >
      {post.featured_image ? (
        <Image
          source={{ uri: post.featured_image }}
          style={[styles.image, { width }]}
          resizeMode="cover"
        />
      ) : null}
      <View style={styles.body}>
        {post.date ? <Text style={styles.date}>{formatDate(post.date)}</Text> : null}
        <Text style={styles.title}>{post.title}</Text>
        {post.author ? <Text style={styles.author}>By {post.author}</Text> : null}
        {post.excerpt ? <Text style={styles.excerpt}>{post.excerpt}</Text> : null}
        {post.content ? (
          <Text style={styles.contentText} selectable>
            {post.content.replace(/<[^>]+>/g, "").trim()}
          </Text>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  content: { paddingBottom: 40 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.background },
  image: { height: 220, backgroundColor: theme.border },
  body: { padding: 20 },
  date: { fontSize: 13, color: theme.textMuted, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: "700", color: theme.text, marginBottom: 8 },
  author: { fontSize: 14, color: theme.placeholder, marginBottom: 16 },
  excerpt: { fontSize: 15, color: theme.textMuted, lineHeight: 22, marginBottom: 16 },
  contentText: { fontSize: 15, color: theme.text, lineHeight: 24 },
  empty: { color: theme.placeholder },
});
