import { api } from "../client";
import type { SearchResponse } from "@/types/api";

export const searchApi = {
  advanced: (params: { q?: string; type?: "all" | "categories" | "resources" | "faqs" | "bills" | "members" | "assemblies" | "news" | "billtracker" | "wordpress" }) =>
    api.get<SearchResponse>("/search", {
      params: params as Record<string, string>,
    }),
};
