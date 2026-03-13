import { create } from "zustand";
import type { User } from "@/types/api";
import * as authStorage from "./auth";

interface AuthState {
  user: User | null;
  isHydrated: boolean;
  setUser: (user: User | null) => void;
  hydrate: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isHydrated: false,

  setUser: (user) => set({ user }),

  hydrate: async () => {
    const user = await authStorage.getStoredUser();
    set({ user, isHydrated: true });
  },

  logout: async () => {
    await authStorage.clearToken();
    set({ user: null });
  },
}));
