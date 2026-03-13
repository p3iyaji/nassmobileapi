/**
 * Web implementation: use localStorage instead of expo-secure-store.
 * Used when building for platform=web so SecureStore is never loaded.
 */
import type { User } from "@/types/api";

const TOKEN_KEY = "nass_auth_token";
const USER_KEY = "nass_auth_user";

export async function getToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export async function getStoredUser(): Promise<User | null> {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export async function setStoredUser(user: User | null): Promise<void> {
  if (typeof window === "undefined") return;
  if (user) {
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    window.localStorage.removeItem(USER_KEY);
  }
}
