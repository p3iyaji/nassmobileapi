import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { searchApi } from "@/lib/api/endpoints";
import type { Category, Resource, Faq, Bill, Member, Assembly, NewsPost, SearchResults } from "@/types/api";
import { theme } from "@/constants/theme";

type SearchType = "all" | "categories" | "resources" | "faqs" | "bills" | "members" | "assemblies" | "news";

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string }>();
  const [query, setQuery] = useState("");
  const [type, setType] = useState<SearchType>("all");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (params.q != null && params.q !== "") {
      setQuery(params.q);
      setSearched(true);
      setLoading(true);
      setResults(null);
      searchApi.advanced({ q: params.q.trim(), type: "all" })
        .then((res) => setResults(normalizeSearchResults(res.results)))
        .catch(() => setResults(emptyResults()))
        .finally(() => setLoading(false));
    }
  }, [params.q]);

  const runSearch = async () => {
    Keyboard.dismiss();
    setSearched(true);
    setLoading(true);
    setResults(null);
    try {
      const res = await searchApi.advanced({ q: query.trim(), type });
      setResults(normalizeSearchResults(res.results));
    } catch {
      setResults(emptyResults());
    } finally {
      setLoading(false);
    }
  };

  function normalizeSearchResults(r: SearchResults): SearchResults {
    const bt = r.bill_tracker ?? { bills: [], members: [], assemblies: [] };
    const wp = r.wordpress ?? { news: [], pages: [] };
    return {
      categories: r.categories ?? [],
      resources: r.resources ?? [],
      faqs: r.faqs ?? [],
      bill_tracker: bt,
      wordpress: { news: wp.news ?? [], pages: wp.pages ?? [] },
    };
  }

  function emptyResults(): SearchResults {
    return {
      categories: [],
      resources: [],
      faqs: [],
      bill_tracker: { bills: [], members: [], assemblies: [] },
      wordpress: { news: [], pages: [] },
    };
  }

  const total =
    results
      ? results.categories.length + results.resources.length + results.faqs.length +
        (results.bill_tracker?.bills?.length ?? 0) +
        (results.bill_tracker?.members?.length ?? 0) +
        (results.bill_tracker?.assemblies?.length ?? 0) +
        (results.wordpress?.news?.length ?? 0)
      : 0;

  const types: { key: SearchType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "categories", label: "Categories" },
    { key: "resources", label: "Resources" },
    { key: "faqs", label: "FAQs" },
    { key: "news", label: "News" },
    { key: "bills", label: "Bills" },
    { key: "members", label: "Members" },
    { key: "assemblies", label: "Assemblies" },
  ];

  type ListItem = { type: "category" | "resource" | "faq" | "news" | "bill" | "member" | "assembly"; item: Category | Resource | Faq | NewsPost | Bill | Member | Assembly };
  const listData: ListItem[] = [];
  if (results) {
    const cat = Array.isArray(results.categories) ? results.categories : [];
    const res = Array.isArray(results.resources) ? results.resources : [];
    const faqs = Array.isArray(results.faqs) ? results.faqs : [];
    const news = Array.isArray(results.wordpress?.news) ? results.wordpress!.news : [];
    const bills = Array.isArray(results.bill_tracker?.bills) ? results.bill_tracker!.bills : [];
    const members = Array.isArray(results.bill_tracker?.members) ? results.bill_tracker!.members : [];
    const assemblies = Array.isArray(results.bill_tracker?.assemblies) ? results.bill_tracker!.assemblies : [];

    cat.forEach((c) => listData.push({ type: "category", item: c }));
    res.forEach((r) => listData.push({ type: "resource", item: r }));
    faqs.forEach((f) => listData.push({ type: "faq", item: f }));
    news.forEach((n) => listData.push({ type: "news", item: n }));
    bills.forEach((b) => listData.push({ type: "bill", item: b }));
    members.forEach((m) => listData.push({ type: "member", item: m }));
    assemblies.forEach((a) => listData.push({ type: "assembly", item: a }));
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Search..."
          placeholderTextColor={theme.placeholder}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={runSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchButton} onPress={runSearch}>
          <Ionicons name="search" size={22} color={theme.primaryContrast} />
        </TouchableOpacity>
      </View>

      <View style={styles.chips}>
        {types.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.chip, type === t.key && styles.chipActive]}
            onPress={() => setType(t.key)}
          >
            <Text style={[styles.chipText, type === t.key && styles.chipTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      )}

      {!loading && searched && results && (
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>
            {total} result{total !== 1 ? "s" : ""}
          </Text>
        </View>
      )}

      {!loading && results && listData.length === 0 && (
        <Text style={styles.empty}>No results found.</Text>
      )}

      {!loading && listData.length > 0 && (
        <FlatList
          data={listData}
          keyExtractor={(item) => `${item.type}-${(item.item as Category & Resource & Faq & NewsPost & Bill & Member & Assembly).id}`}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            if (item.type === "category") {
              const c = item.item as Category;
              return (
                <TouchableOpacity
                  style={styles.resultItem}
                  onPress={() => router.push(`/(tabs)/e-library/categories/${c.id}`)}
                >
                  <Ionicons name="folder-open" size={20} color={theme.primary} />
                  <View style={styles.resultContent}>
                    <Text style={styles.resultTitle}>{c.name}</Text>
                    <Text style={styles.resultType}>Category</Text>
                  </View>
                </TouchableOpacity>
              );
            }
            if (item.type === "resource") {
              const r = item.item as Resource;
              return (
                <TouchableOpacity
                  style={styles.resultItem}
                  onPress={() => router.push(`/(tabs)/e-library/resources/${r.id}`)}
                >
                  <Ionicons name="document-text" size={20} color={theme.primary} />
                  <View style={styles.resultContent}>
                    <Text style={styles.resultTitle} numberOfLines={2}>{r.title}</Text>
                    <Text style={styles.resultType}>Resource</Text>
                  </View>
                </TouchableOpacity>
              );
            }
            if (item.type === "faq") {
              const f = item.item as Faq;
              return (
                <TouchableOpacity
                  style={styles.resultItem}
                  onPress={() => router.push(`/(tabs)/faqs/${f.id}`)}
                >
                  <Ionicons name="help-circle" size={20} color={theme.primary} />
                  <View style={styles.resultContent}>
                    <Text style={styles.resultTitle} numberOfLines={2}>{f.question}</Text>
                    <Text style={styles.resultType}>FAQ</Text>
                  </View>
                </TouchableOpacity>
              );
            }
            if (item.type === "news") {
              const n = item.item as NewsPost;
              return (
                <TouchableOpacity
                  style={styles.resultItem}
                  onPress={() => router.push(`/(tabs)/news/${n.id}`)}
                >
                  <Ionicons name="newspaper" size={20} color={theme.primary} />
                  <View style={styles.resultContent}>
                    <Text style={styles.resultTitle} numberOfLines={2}>{n.title}</Text>
                    <Text style={styles.resultType}>News</Text>
                  </View>
                </TouchableOpacity>
              );
            }
            if (item.type === "bill") {
              const b = item.item as Bill;
              return (
                <TouchableOpacity
                  style={styles.resultItem}
                  onPress={() => router.push(`/(tabs)/bill-tracker/bills/${b.id}`)}
                >
                  <Ionicons name="document-text" size={20} color={theme.primary} />
                  <View style={styles.resultContent}>
                    <Text style={styles.resultTitle} numberOfLines={2}>{b.number ? `${b.number} – ` : ""}{b.title}</Text>
                    <Text style={styles.resultType}>Bill{b.status ? ` · ${b.status}` : ""}</Text>
                  </View>
                </TouchableOpacity>
              );
            }
            if (item.type === "member") {
              const m = item.item as Member;
              return (
                <TouchableOpacity
                  style={styles.resultItem}
                  onPress={() => router.push(`/(tabs)/bill-tracker/members/${m.id}`)}
                >
                  <Ionicons name="person" size={20} color={theme.primary} />
                  <View style={styles.resultContent}>
                    <Text style={styles.resultTitle}>{m.name}</Text>
                    <Text style={styles.resultType}>Member{m.chamber ? ` · ${m.chamber}` : ""}</Text>
                  </View>
                </TouchableOpacity>
              );
            }
            const a = item.item as Assembly;
            return (
              <TouchableOpacity
                style={styles.resultItem}
                onPress={() => router.push(`/(tabs)/bill-tracker/assemblies/${a.id}`)}
              >
                <Ionicons name="business" size={20} color={theme.primary} />
                <View style={styles.resultContent}>
                  <Text style={styles.resultTitle}>{a.name}</Text>
                  <Text style={styles.resultType}>Assembly{a.status ? ` · ${a.status}` : ""}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background, padding: 16 },
  searchRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  input: {
    flex: 1,
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: theme.text,
    borderWidth: 1,
    borderColor: theme.border,
  },
  searchButton: {
    backgroundColor: theme.primary,
    borderRadius: 12,
    padding: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  chips: { flexDirection: "row", gap: 8, marginBottom: 16 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  chipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  chipText: { color: theme.textMuted, fontSize: 13 },
  chipTextActive: { color: theme.primaryContrast, fontWeight: "600" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  resultsHeader: { marginBottom: 12 },
  resultsCount: { color: theme.textMuted, fontSize: 14 },
  list: { paddingBottom: 32 },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    backgroundColor: theme.surface,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 12,
  },
  resultContent: { flex: 1 },
  resultTitle: { color: theme.text, fontSize: 15, fontWeight: "500" },
  resultType: { color: theme.placeholder, fontSize: 12, marginTop: 2 },
  empty: { color: theme.placeholder, textAlign: "center", marginTop: 24 },
});
