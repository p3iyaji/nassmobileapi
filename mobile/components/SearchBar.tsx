import { useState } from "react";
import { View, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@/constants/theme";

type Props = {
  /** Optional placeholder override */
  placeholder?: string;
  /** Optional compact style (e.g. smaller height) */
  compact?: boolean;
};

export function SearchBar({ placeholder = "Search E-Library, FAQs…", compact }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSubmit = () => {
    const q = query.trim();
    router.push({
      pathname: "/(tabs)/search",
      params: q ? { q } : {},
    });
  };

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <TextInput
        style={[styles.input, compact && styles.inputCompact]}
        placeholder={placeholder}
        placeholderTextColor={theme.placeholder}
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={handleSubmit}
        returnKeyType="search"
      />
      <TouchableOpacity style={[styles.btn, compact && styles.btnCompact]} onPress={handleSubmit}>
        <Ionicons name="search" size={compact ? 18 : 22} color={theme.primaryContrast} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: "hidden",
  },
  wrapCompact: {
    borderRadius: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: theme.text,
  },
  inputCompact: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  btn: {
    backgroundColor: theme.primary,
    paddingVertical: 12,
    paddingHorizontal: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  btnCompact: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
});
