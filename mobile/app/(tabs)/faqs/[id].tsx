import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { faqsApi } from "@/lib/api/endpoints";
import type { Faq } from "@/types/api";
import { theme } from "@/constants/theme";

export default function FaqDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [faq, setFaq] = useState<Faq | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!id) return;
    try {
      const res = await faqsApi.get(id);
      setFaq(res.data ?? null);
    } catch {
      setFaq(null);
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

  if (!faq) {
    return (
      <View style={styles.centered}>
        <Text style={styles.empty}>FAQ not found.</Text>
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
      <Text style={styles.question}>{faq.question}</Text>
      <Text style={styles.answer}>{faq.answer}</Text>
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
  question: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.text,
    marginBottom: 16,
  },
  answer: { fontSize: 15, color: theme.textMuted, lineHeight: 22 },
  empty: { color: theme.placeholder },
});
