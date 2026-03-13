import { api } from "../client";
import type { NewsPost } from "@/types/api";

export const newsApi = {
  /** Latest news (WordPress posts) */
  latest: (params?: { limit?: number }) =>
    api.get<{ success: boolean; data: NewsPost[]; count: number }>("/wordpress/news", {
      params: params as Record<string, number | undefined>,
    }),

  /** Single post by ID */
  post: (id: number | string) =>
    api.get<{ success: boolean; data: NewsPost }>(`/wordpress/posts/${id}`),
};
