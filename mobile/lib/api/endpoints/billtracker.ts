import { api } from "../client";
import type { Bill, Member, Assembly } from "@/types/api";

export const billTrackerApi = {
  bills: (params?: { status?: string; limit?: number; page?: number }) =>
    api.get<{ success: boolean; data: Bill[]; count: number }>("/billtracker/bills", {
      params: params as Record<string, string | number | undefined>,
    }),

  bill: (id: string) =>
    api.get<{ success: boolean; data: Bill }>(`/billtracker/bills/${id}`),

  billsByStatus: (status: string) =>
    api.get<{ success: boolean; data: Bill[]; count: number }>(`/billtracker/bills/status/${encodeURIComponent(status)}`),

  members: (params?: { party?: string; state?: string; chamber?: string; limit?: number; page?: number }) =>
    api.get<{ success: boolean; data: Member[]; count: number }>("/billtracker/members", {
      params: params as Record<string, string | number | undefined>,
    }),

  member: (id: string) =>
    api.get<{ success: boolean; data: Member }>(`/billtracker/members/${id}`),

  assemblies: (params?: { status?: string; limit?: number; page?: number }) =>
    api.get<{ success: boolean; data: Assembly[]; count: number }>("/billtracker/assemblies", {
      params: params as Record<string, string | number | undefined>,
    }),

  assembly: (id: string) =>
    api.get<{ success: boolean; data: Assembly }>(`/billtracker/assemblies/${id}`),

  activeAssemblies: () =>
    api.get<{ success: boolean; data: Assembly[]; count: number }>("/billtracker/assemblies/active"),
};
