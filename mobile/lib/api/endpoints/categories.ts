import { api } from "../client";
import type { ApiResponse, Category } from "@/types/api";

export const categoriesApi = {
  list: () =>
    api.get<{ success: boolean; data: Category[]; count: number }>("/categories"),

  get: (id: number | string) =>
    api.get<ApiResponse<Category>>(`/categories/${id}`),
};
