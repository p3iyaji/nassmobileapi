import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@/constants/theme";
import { SearchBar } from "@/components/SearchBar";

const items = [
  { title: "Search", subtitle: "Search across E-Library and more", icon: "search" as const, route: "/(tabs)/search" },
  { title: "FAQs", subtitle: "Frequently asked questions", icon: "help-circle" as const, route: "/(tabs)/faqs" },
  { title: "Profile", subtitle: "Account and settings", icon: "person" as const, route: "/(tabs)/profile" },
];

export default function MoreScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <SearchBar />
      </View>
      <Text style={styles.title}>More</Text>
      <Text style={styles.subtitle}>Search, FAQs, and your profile</Text>
      {items.map((item) => (
        <TouchableOpacity
          key={item.route}
          style={styles.card}
          onPress={() => router.push(item.route as any)}
          activeOpacity={0.8}
        >
          <View style={styles.iconWrap}>
            <Ionicons name={item.icon} size={24} color={theme.primary} />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDesc}>{item.subtitle}</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={theme.placeholder} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background, padding: 20 },
  searchWrap: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "700", color: theme.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: theme.textMuted, marginBottom: 24 },
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
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: theme.border,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: "600", color: theme.text },
  cardDesc: { fontSize: 13, color: theme.textMuted, marginTop: 2 },
});
