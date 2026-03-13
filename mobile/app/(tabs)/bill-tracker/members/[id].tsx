import { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { billTrackerApi } from "@/lib/api/endpoints";
import { theme } from "@/constants/theme";
import type { Member } from "@/types/api";

export default function MemberDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!id) return;
    try {
      const res = await billTrackerApi.member(id);
      setMember(res.data ?? null);
    } catch {
      setMember(null);
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

  if (!member) {
    return (
      <View style={styles.centered}>
        <Text style={styles.empty}>Member not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={theme.accent} />}
    >
      <Text style={styles.title}>{member.name}</Text>
      {member.position ? <Text style={styles.subtitle}>{member.position}</Text> : null}
      {member.party ? <><Text style={styles.label}>Party</Text><Text style={styles.value}>{member.party}</Text></> : null}
      {member.chamber ? <><Text style={styles.label}>Chamber</Text><Text style={styles.value}>{member.chamber}</Text></> : null}
      {member.state ? <><Text style={styles.label}>State</Text><Text style={styles.value}>{member.state}</Text></> : null}
      {member.constituency ? <><Text style={styles.label}>Constituency</Text><Text style={styles.value}>{member.constituency}</Text></> : null}
      {member.district ? <><Text style={styles.label}>District</Text><Text style={styles.value}>{member.district}</Text></> : null}
      {member.biography ? <><Text style={styles.label}>Biography</Text><Text style={styles.value}>{member.biography}</Text></> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.background },
  title: { fontSize: 22, fontWeight: "700", color: theme.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: theme.textMuted, marginBottom: 16 },
  label: { fontSize: 12, color: theme.textMuted, marginTop: 12, marginBottom: 4 },
  value: { fontSize: 14, color: theme.text },
  empty: { color: theme.placeholder },
});
