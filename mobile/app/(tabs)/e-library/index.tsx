import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@/constants/theme";
import { SearchBar } from "@/components/SearchBar";

export default function ELibraryScreen() {
  const router = useRouter();

  const options = [
    {
      title: "Categories",
      description: "Browse by category",
      icon: "folder-open" as const,
      route: "/(tabs)/e-library/categories",
    },
    {
      title: "Resources",
      description: "All library resources",
      icon: "library" as const,
      route: "/(tabs)/e-library/resources",
    },
    {
      title: "Reading List",
      description: "Your saved items",
      icon: "bookmark" as const,
      route: "/(tabs)/e-library/reading-list",
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <SearchBar placeholder="Search E-Library, FAQs…" />
      </View>
      <Text style={styles.subtitle}>Choose what to explore</Text>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt.route}
          style={styles.card}
          onPress={() => router.push(opt.route as any)}
          activeOpacity={0.8}
        >
          <View style={styles.iconWrap}>
            <Ionicons name={opt.icon} size={28} color={theme.primary} />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>{opt.title}</Text>
            <Text style={styles.cardDesc}>{opt.description}</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={theme.placeholder} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 24 },
  searchWrap: { marginBottom: 16 },
  subtitle: {
    fontSize: 14,
    color: theme.textMuted,
    marginBottom: 20,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.border,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: "600", color: theme.text },
  cardDesc: { fontSize: 13, color: theme.textMuted, marginTop: 2 },
});
