import { api } from "../client";
import type { ApiResponse, AuthData, User } from "@/types/api";

export const authApi = {
  register: (body: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) =>
    api.post<ApiResponse<{ user: User; token: string; token_type: string }>>(
      "/register",
      body,
      { skipAuth: true }
    ),

  login: (email: string, password: string) =>
    api.post<ApiResponse<AuthData>>("/login", { email, password }, { skipAuth: true }),

  logout: () => api.post<ApiResponse>("/logout"),

  refreshToken: () =>
    api.post<ApiResponse<{ token: string; token_type: string; expires_in?: number }>>(
      "/token/refresh"
    ),

  getProfile: () =>
    api.get<ApiResponse<User>>("/profile"),

  updateProfile: (body: {
    name?: string;
    email?: string;
    current_password?: string;
    password?: string;
    password_confirmation?: string;
  }) => api.put<ApiResponse<User>>("/profile", body),
};
