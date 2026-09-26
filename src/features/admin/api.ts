import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import {
  TicketStatsData,
  TicketsTableResponse,
  TicketQueryParams,
  MasterDataItem,
} from "./types";

export const adminKeys = {
  all: (userId?: number | string) => ["admin", userId ?? "anon"] as const,
  stats: (
    userId?: number | string,
    dateFilters?: { date?: string; startDate?: string; endDate?: string },
  ) => [...adminKeys.all(userId), "ticket-stats", dateFilters] as const,
  tickets: (userId: number | string | undefined, params: TicketQueryParams) =>
    [...adminKeys.all(userId), "tickets", params] as const,
  projects: () => ["admin", "projects"] as const,
  teams: () => ["admin", "teams"] as const,
  users: () => ["admin", "users"] as const,
  priorities: () => ["admin", "priorities"] as const,
  statuses: () => ["admin", "statuses"] as const,
};

// GET /api/tickets/stats
export const useTicketStatsQuery = (
  userId?: number | string,
  dateFilters?: { date?: string; startDate?: string; endDate?: string },
) => {
  return useQuery<TicketStatsData>({
    queryKey: adminKeys.stats(userId, dateFilters),
    queryFn: async () => {
      const cleanParams = dateFilters
        ? Object.fromEntries(
            Object.entries(dateFilters).filter(
              ([, v]) => v !== undefined && v !== "",
            ),
          )
        : {};
      const { data } = await apiClient.get<{
        status: string;
        data: TicketStatsData;
      }>("/tickets/stats", { params: cleanParams });
      return data.data;
    },
    refetchInterval: 30000, // refresh stats every 30s
  });
};

// GET /api/tickets
export const useTicketsTableQuery = (
  userId: number | string | undefined,
  params: TicketQueryParams,
) => {
  return useQuery<TicketsTableResponse>({
    queryKey: adminKeys.tickets(userId, params),
    queryFn: async () => {
      const cleanParams: Record<string, any> = {};
      Object.entries(params).forEach(([k, v]) => {
        if (v === undefined || v === "" || v === null || v === "all") return;
        if (Array.isArray(v)) {
          if (v.length > 0) cleanParams[k] = v.join(",");
        } else {
          cleanParams[k] = v;
        }
      });
      const { data } = await apiClient.get<{ status: string; data: TicketsTableResponse }>(
        "/tickets",
        { params: cleanParams },
      );
      return data.data;
    },
    placeholderData: keepPreviousData,
  });
};

// GET /api/projects
export const useProjectsQuery = () => {
  return useQuery<MasterDataItem[]>({
    queryKey: adminKeys.projects(),
    queryFn: async () => {
      const { data } = await apiClient.get<any>("/projects");
      const list = data?.data ?? data;
      return Array.isArray(list) ? list : [];
    },
    staleTime: 5 * 60 * 1000,
  });
};

// GET /api/teams
export const useTeamsQuery = () => {
  return useQuery<MasterDataItem[]>({
    queryKey: adminKeys.teams(),
    queryFn: async () => {
      const { data } = await apiClient.get<any>("/teams");
      const list = data?.data ?? data;
      return Array.isArray(list) ? list : [];
    },
    staleTime: 5 * 60 * 1000,
  });
};

// GET /api/users
export const useUsersQuery = () => {
  return useQuery<MasterDataItem[]>({
    queryKey: adminKeys.users(),
    queryFn: async () => {
      const { data } = await apiClient.get<any>("/users");
      const list = data?.data?.users ?? data?.data ?? data?.users ?? [];
      return Array.isArray(list) ? list : [];
    },
    staleTime: 5 * 60 * 1000,
  });
};

// GET /api/priority-levels
export const usePrioritiesQuery = () => {
  return useQuery<MasterDataItem[]>({
    queryKey: adminKeys.priorities(),
    queryFn: async () => {
      const { data } = await apiClient.get<any>("/priority-levels");
      const list = data?.data ?? data;
      return Array.isArray(list) ? list : [];
    },
    staleTime: 5 * 60 * 1000,
  });
};

// GET /api/ticket-statuses
export const useStatusesQuery = () => {
  return useQuery<MasterDataItem[]>({
    queryKey: adminKeys.statuses(),
    queryFn: async () => {
      const { data } = await apiClient.get<any>("/ticket-statuses");
      const list = data?.data ?? data;
      return Array.isArray(list) ? list : [];
    },
    staleTime: 5 * 60 * 1000,
  });
};
