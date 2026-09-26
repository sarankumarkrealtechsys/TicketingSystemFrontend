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
  stats: (
    userId: number | string | undefined,
    scope: string = "personal",
    dateFilters?: { date?: string; startDate?: string; endDate?: string },
  ) => [...userDashboardKeys.all(userId), "stats", scope, dateFilters] as const,
  tickets: (userId: number | string | undefined, params: UserTicketQueryParams) =>
    [...userDashboardKeys.all(userId), "tickets", params] as const,
};

// GET /api/tickets/stats?scope=personal — Scoped to user's created and assigned tickets
export const useUserTicketStatsQuery = (
  userId?: number | string,
  scope: string = "personal",
  dateFilters?: { date?: string; startDate?: string; endDate?: string },
) => {
  return useQuery<TicketStatsData>({
    queryKey: userDashboardKeys.stats(userId, scope, dateFilters),
    queryFn: async () => {
      const cleanParams: Record<string, any> = { scope };
      if (dateFilters?.date) cleanParams.date = dateFilters.date;
      if (dateFilters?.startDate) cleanParams.startDate = dateFilters.startDate;
      if (dateFilters?.endDate) cleanParams.endDate = dateFilters.endDate;

      const { data } = await apiClient.get<{
        status: string;
        data: TicketStatsData;
      }>("/tickets/stats", {
        params: cleanParams,
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
          if (Array.isArray(value)) {
            if (value.length > 0) cleanParams[key] = value.join(",");
          } else {
            cleanParams[key] = value;
          }
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
