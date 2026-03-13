import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

function confirmLogout(message: string): Promise<boolean> {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return Promise.resolve(window.confirm(message));
  }
  return new Promise((resolve) => {
    Alert.alert("Log out", message, [
      { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
      { text: "Log out", style: "destructive", onPress: () => resolve(true) },
    ]);
  });
}
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/useAuthStore";
import { getToken } from "@/store/auth";
import { authApi } from "@/lib/api/endpoints";
import { setStoredUser } from "@/store/auth";
import { ApiError } from "@/lib/api/client";
import { theme } from "@/constants/theme";

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const loadProfile = async () => {
    const token = await getToken();
    if (!token) {
      setLoadingProfile(false);
      return;
    }
    try {
      const res = await authApi.getProfile();
      const u = res.data;
      if (u) {
        setUser(u);
        setName(u.name);
        setEmail(u.email);
      }
    } catch {
      // keep store state
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
    loadProfile();
  }, []);

  const handleSave = async () => {
    const token = await getToken();
    if (!token) {
      Alert.alert("Sign in required", "Sign in to update your profile.");
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match.");
      return;
    }
    if (newPassword && newPassword.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const body: { name?: string; email?: string; current_password?: string; password?: string; password_confirmation?: string } = {
        name: name.trim(),
        email: email.trim(),
      };
      if (newPassword) {
        body.current_password = currentPassword;
        body.password = newPassword;
        body.password_confirmation = confirmPassword;
      }
      const res = await authApi.updateProfile(body);
      if (res.data) {
        setUser(res.data);
        await setStoredUser(res.data);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        Alert.alert("Success", "Profile updated.");
      }
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Update failed.";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const ok = await confirmLogout("Are you sure you want to log out?");
    if (!ok) return;
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    await logout();
    router.replace("/(auth)/login");
  };

  const isSignedIn = !!user;

  if (loadingProfile && !user) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {!isSignedIn ? (
          <>
            <Text style={styles.title}>Profile</Text>
            <Text style={styles.subtitle}>Sign in to view and edit your profile.</Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.replace("/(auth)/login")}
            >
              <Text style={styles.primaryButtonText}>Sign in</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.replace("/(auth)/register")}
            >
              <Text style={styles.secondaryButtonText}>Create account</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.title}>Profile</Text>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Name"
              placeholderTextColor={theme.placeholder}
              editable={!loading}
            />
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={theme.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
            <Text style={styles.sectionTitle}>Change password (optional)</Text>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Current password"
              placeholderTextColor={theme.placeholder}
              secureTextEntry
              editable={!loading}
            />
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="New password"
              placeholderTextColor={theme.placeholder}
              secureTextEntry
              editable={!loading}
            />
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              placeholderTextColor={theme.placeholder}
              secureTextEntry
              editable={!loading}
            />
            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Save changes</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              disabled={loading}
            >
              <Text style={styles.logoutButtonText}>Log out</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
  title: { fontSize: 24, fontWeight: "700", color: theme.text, marginBottom: 8 },
  subtitle: { fontSize: 14, color: theme.textMuted, marginBottom: 24 },
  label: { fontSize: 13, color: theme.textMuted, marginBottom: 6, marginTop: 12 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.textMuted,
    marginTop: 20,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: theme.text,
    borderWidth: 1,
    borderColor: theme.border,
  },
  primaryButton: {
    backgroundColor: theme.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 24,
  },
  primaryButtonText: { color: theme.primaryContrast, fontSize: 16, fontWeight: "600" },
  secondaryButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  secondaryButtonText: { color: theme.primary, fontSize: 16, fontWeight: "600" },
  buttonDisabled: { opacity: 0.7 },
  logoutButton: {
    marginTop: 24,
    padding: 16,
    alignItems: "center",
  },
  logoutButtonText: { color: theme.destructive, fontSize: 16 },
});
