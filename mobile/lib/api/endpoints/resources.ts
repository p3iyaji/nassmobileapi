import { api } from "../client";
import type { ApiResponse, Resource } from "@/types/api";

export const resourcesApi = {
  list: (params?: { category_id?: number | string }) =>
    api.get<ApiResponse<Resource[]>>("/resources", { params: params as Record<string, string | number | undefined> }),

  get: (id: number | string) =>
    api.get<ApiResponse<Resource>>(`/resources/${id}`),

  getFile: (id: number | string) =>
    api.get<{ status?: boolean; file_url?: string; data?: { file_url?: string } }>(`/resources/${id}/file`),

  readingList: () =>
    api.get<ApiResponse<Resource[]>>("/my-reading-list"),
};
