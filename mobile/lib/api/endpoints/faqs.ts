import { api } from "../client";
import type { ApiResponse, Faq } from "@/types/api";

export const faqsApi = {
  list: () =>
    api.get<{ success: boolean; data: Faq[]; count: number }>("/faqs"),

  get: (id: number | string) =>
    api.get<ApiResponse<Faq>>(`/faqs/${id}`),
};
