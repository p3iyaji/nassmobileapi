import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { resourcesApi } from "@/lib/api/endpoints";
import type { Resource } from "@/types/api";
import { theme } from "@/constants/theme";

export default function ResourceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!id) return;
    try {
      const res = await resourcesApi.get(id);
      setResource(res.data ?? null);
    } catch {
      setResource(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const openFile = async () => {
    const r = resource;
    if (!r) return;
    const url = r.file ?? null;
    if (url) {
      const can = await Linking.canOpenURL(url);
      if (can) Linking.openURL(url);
      else Alert.alert("Error", "Cannot open this file.");
    } else if (r.file_accessible === false && r.can_fetch_file) {
      try {
        const fileRes = await resourcesApi.getFile(id!);
        const fileUrl = fileRes.file_url ?? (fileRes as { data?: { file_url?: string } }).data?.file_url;
        if (fileUrl) {
          const can = await Linking.canOpenURL(fileUrl);
          if (can) Linking.openURL(fileUrl);
          else Alert.alert("Error", "Cannot open this file.");
        } else {
          Alert.alert("Not available", "File is not available for this resource.");
        }
      } catch {
        Alert.alert("Error", "Could not load file.");
      }
    } else {
      Alert.alert("Not available", "Sign in to access member-only files, or this resource has no file.");
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (!resource) {
    return (
      <View style={styles.centered}>
        <Text style={styles.empty}>Resource not found.</Text>
      </View>
    );
  }

  const hasFile = resource.file_accessible || resource.can_fetch_file || !!resource.file;

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
      <Text style={styles.title}>{resource.title}</Text>

      {resource.authors ? (
        <>
          <Text style={styles.label}>Authors</Text>
          <Text style={styles.value}>{resource.authors}</Text>
        </>
      ) : null}
      {resource.publisher ? (
        <>
          <Text style={styles.label}>Publisher</Text>
          <Text style={styles.value}>{resource.publisher}</Text>
        </>
      ) : null}
      {resource.date_of_publication || resource.year_of_publication ? (
        <>
          <Text style={styles.label}>Publication</Text>
          <Text style={styles.value}>
            {resource.date_of_publication || resource.year_of_publication}
          </Text>
        </>
      ) : null}
      {resource.abstract ? (
        <>
          <Text style={styles.label}>Abstract</Text>
          <Text style={styles.value}>{resource.abstract}</Text>
        </>
      ) : null}
      {resource.tags ? (
        <>
          <Text style={styles.label}>Tags</Text>
          <Text style={styles.value}>{resource.tags}</Text>
        </>
      ) : null}

      {hasFile && (
        <TouchableOpacity style={styles.fileButton} onPress={openFile}>
          <Text style={styles.fileButtonText}>Open / Download file</Text>
        </TouchableOpacity>
      )}
      {resource.is_restricted && !resource.file_accessible && (
        <Text style={styles.restricted}>Sign in to access this file.</Text>
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
  title: { fontSize: 20, fontWeight: "700", color: theme.text, marginBottom: 16 },
  label: { fontSize: 12, color: theme.textMuted, marginTop: 12, marginBottom: 4 },
  value: { fontSize: 14, color: theme.textMuted },
  empty: { color: theme.placeholder },
  fileButton: {
    marginTop: 24,
    padding: 16,
    backgroundColor: theme.primary,
    borderRadius: 12,
    alignItems: "center",
  },
  fileButtonText: { color: theme.primaryContrast, fontWeight: "600" },
  restricted: { marginTop: 8, fontSize: 13, color: theme.textMuted },
});
