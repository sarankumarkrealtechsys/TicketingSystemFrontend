import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { apiClient } from "@/shared/api";
import {
  PriorityItem,
  TicketStatusItem,
  CreateTicketPayload,
  TicketItem,
} from "./types";
import { ProjectItem } from "@/features/project-management/types";
import { TeamItem, TeamDetailResponse } from "@/features/team-management/types";

export const ticketKeys = {
  all: ["tickets"] as const,
  lists: () => [...ticketKeys.all, "list"] as const,
  priorities: () => [...ticketKeys.all, "priorities"] as const,
  statuses: (teamId?: number | null) => [...ticketKeys.all, "statuses", teamId] as const,
};

// GET /api/priority-levels
export const usePrioritiesQuery = () => {
  return useQuery<PriorityItem[]>({
    queryKey: ticketKeys.priorities(),
    queryFn: async () => {
      const { data } = await apiClient.get<any>("/priority-levels");
      const list = data?.data ?? data;
      return Array.isArray(list) ? list : [];
    },
    staleTime: 5 * 60 * 1000,
  });
};

// GET /api/ticket-statuses?teamId=:teamId
export const useTeamStatusesQuery = (teamId?: number | null) => {
  return useQuery<TicketStatusItem[]>({
    queryKey: ticketKeys.statuses(teamId),
    queryFn: async () => {
      if (!teamId) return [];
      const { data } = await apiClient.get<any>("/ticket-statuses", {
        params: { teamId },
      });
      const list = data?.data ?? data;
      return Array.isArray(list) ? list : [];
    },
    enabled: Boolean(teamId && teamId > 0),
    staleTime: 60 * 1000,
  });
};

// GET /api/ticket-statuses (Global statuses)
export const useGlobalStatusesQuery = () => {
  return useQuery<TicketStatusItem[]>({
    queryKey: ticketKeys.statuses(null),
    queryFn: async () => {
      const { data } = await apiClient.get<any>("/ticket-statuses");
      const list = data?.data ?? data;
      return Array.isArray(list) ? list : [];
    },
    staleTime: 5 * 60 * 1000,
  });
};

// GET /api/departments
export const useActiveDepartmentsQuery = () => {
  return useQuery<Array<{ id: number; name: string; status: string }>>({
    queryKey: ["departments", "active"],
    queryFn: async () => {
      const { data } = await apiClient.get<any>("/departments", {
        params: { includeInactive: "false" },
      });
      const list = data?.data ?? data;
      return Array.isArray(list) ? list : [];
    },
    staleTime: 60 * 1000,
  });
};

// GET /api/projects
export const useActiveProjectsQuery = () => {
  return useQuery<ProjectItem[]>({
    queryKey: ["projects", "active"],
    queryFn: async () => {
      const { data } = await apiClient.get<any>("/projects", {
        params: { includeInactive: "false" },
      });
      const list = data?.data ?? data;
      return Array.isArray(list) ? list : [];
    },
    staleTime: 60 * 1000,
  });
};

// GET /api/teams
export const useActiveTeamsQuery = () => {
  return useQuery<TeamItem[]>({
    queryKey: ["teams", "active"],
    queryFn: async () => {
      const { data } = await apiClient.get<any>("/teams", {
        params: { includeInactive: "false" },
      });
      const list = data?.data ?? data;
      return Array.isArray(list) ? list : [];
    },
    staleTime: 60 * 1000,
  });
};

// GET /api/teams/:id for fetching team members
export const useSelectedTeamDetailQuery = (teamId: number | null) => {
  return useQuery<TeamDetailResponse>({
    queryKey: ["team-detail", teamId],
    queryFn: async () => {
      if (!teamId) throw new Error("Team ID required");
      const { data } = await apiClient.get<any>(`/teams/${teamId}`);
      return data?.data ?? data;
    },
    enabled: Boolean(teamId && teamId > 0),
  });
};

// POST /api/tickets — Create Ticket
export const useCreateTicketMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<TicketItem, AxiosError<any>, CreateTicketPayload>({
    mutationFn: async (payload: CreateTicketPayload) => {
      const { data } = await apiClient.post<any>("/tickets", payload);
      return data?.data ?? data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.all });
    },
  });
};
