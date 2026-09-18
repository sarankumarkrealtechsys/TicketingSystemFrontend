import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import {
  TicketStatsData,
  TicketsTableResponse,
  TicketQueryParams,
  MasterDataItem,
} from "./types";

export const adminKeys = {
  all: ["admin"] as const,
  stats: () => [...adminKeys.all, "ticket-stats"] as const,
  tickets: (params: TicketQueryParams) => [...adminKeys.all, "tickets", params] as const,
  projects: () => [...adminKeys.all, "projects"] as const,
  teams: () => [...adminKeys.all, "teams"] as const,
  users: () => [...adminKeys.all, "users"] as const,
  priorities: () => [...adminKeys.all, "priorities"] as const,
  statuses: () => [...adminKeys.all, "statuses"] as const,
};

// GET /api/tickets/stats
export const useTicketStatsQuery = () => {
  return useQuery<TicketStatsData>({
    queryKey: adminKeys.stats(),
    queryFn: async () => {
      const { data } = await apiClient.get<{ status: string; data: TicketStatsData }>(
        "/tickets/stats",
      );
      return data.data;
    },
    refetchInterval: 30000, // refresh stats every 30s
  });
};

// GET /api/tickets
export const useTicketsTableQuery = (params: TicketQueryParams) => {
  return useQuery<TicketsTableResponse>({
    queryKey: adminKeys.tickets(params),
    queryFn: async () => {
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(
          ([, v]) => v !== undefined && v !== "" && v !== null && v !== "all",
        ),
      );
      const { data } = await apiClient.get<{ status: string; data: TicketsTableResponse }>(
        "/tickets",
        { params: cleanParams },
      );
      return data.data;
    },
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
