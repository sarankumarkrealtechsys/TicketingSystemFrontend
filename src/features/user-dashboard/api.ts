import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import {
  TicketStatsData,
  TicketsTableResponse,
  UserTicketQueryParams,
} from "./types";
import {
  useProjectsQuery,
  usePrioritiesQuery,
  useStatusesQuery,
} from "@/features/admin/api";

export { useProjectsQuery, usePrioritiesQuery, useStatusesQuery };

export const userDashboardKeys = {
  all: (userId?: number | string) => ["user-dashboard", userId ?? "anon"] as const,
  stats: (userId: number | string | undefined, scope: string = "personal") =>
    [...userDashboardKeys.all(userId), "stats", scope] as const,
  tickets: (userId: number | string | undefined, params: UserTicketQueryParams) =>
    [...userDashboardKeys.all(userId), "tickets", params] as const,
};

// GET /api/tickets/stats?scope=personal — Scoped to user's created and assigned tickets
export const useUserTicketStatsQuery = (
  userId?: number | string,
  scope: string = "personal",
) => {
  return useQuery<TicketStatsData>({
    queryKey: userDashboardKeys.stats(userId, scope),
    queryFn: async () => {
      const { data } = await apiClient.get<{
        status: string;
        data: TicketStatsData;
      }>("/tickets/stats", {
        params: { scope },
      });
      return data.data;
    },
    refetchInterval: 30000,
  });
};

// GET /api/tickets — Paginated personal tickets
export const useUserTicketsTableQuery = (
  userId: number | string | undefined,
  params: UserTicketQueryParams,
) => {
  return useQuery<TicketsTableResponse>({
    queryKey: userDashboardKeys.tickets(userId, params),
    queryFn: async () => {
      const cleanParams: Record<string, any> = {
        scope: params.scope || "personal",
      };

      Object.entries(params).forEach(([key, value]) => {
        if (
          value !== undefined &&
          value !== "" &&
          value !== null &&
          value !== "all"
        ) {
          cleanParams[key] = value;
        }
      });

      const { data } = await apiClient.get<{
        status: string;
        data: TicketsTableResponse;
      }>("/tickets", {
        params: cleanParams,
      });
      return data.data;
    },
    placeholderData: keepPreviousData,
  });
};
