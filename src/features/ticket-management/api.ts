import { useQuery, useMutation, useQueryClient, useQueries } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { apiClient } from "@/shared/api";
import {
  PriorityItem,
  TicketStatusItem,
  CreateTicketPayload,
  TicketItem,
  TicketDetailResponse,
  TicketHistoryItem,
  TimeEntryItem,
  TicketTimeSummaryResponse,
  ChangeStatusPayload,
  ChangePriorityPayload,
  ReassignTicketPayload,
  CloseTicketPayload,
  AddRemarkPayload,
  LogTimePayload,
  UpdateTicketPayload,
  UserSummary,
} from "./types";
import { ProjectItem } from "@/features/project-management/types";
import { TeamItem, TeamDetailResponse } from "@/features/team-management/types";

export const ticketKeys = {
  all: ["tickets"] as const,
  lists: () => [...ticketKeys.all, "list"] as const,
  priorities: () => [...ticketKeys.all, "priorities"] as const,
  statuses: (teamId?: number | null) => [...ticketKeys.all, "statuses", teamId] as const,
  detail: (id?: number | null) => [...ticketKeys.all, "detail", id] as const,
  history: (id?: number | null) => [...ticketKeys.all, "history", id] as const,
  timeEntries: (id?: number | null) => [...ticketKeys.all, "time-entries", id] as const,
  timeSummary: (id?: number | null) => [...ticketKeys.all, "time-summary", id] as const,
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

// GET /api/teams/:id for fetching single team detail & members
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

// GET /api/teams/:id for fetching multiple selected teams' details & members in parallel
export const useSelectedTeamsDetailsQuery = (teamIds: number[]) => {
  return useQueries({
    queries: teamIds.map((teamId) => ({
      queryKey: ["team-detail", teamId],
      queryFn: async () => {
        const { data } = await apiClient.get<any>(`/teams/${teamId}`);
        return (data?.data ?? data) as TeamDetailResponse;
      },
      enabled: Boolean(teamId && teamId > 0),
      staleTime: 60 * 1000,
    })),
  });
};

// GET /api/teams/:teamId/assignees — candidate assignees matching team's department
export const useTeamAssigneesQuery = (teamId: number | null) => {
  return useQuery<UserSummary[]>({
    queryKey: ["team-assignees", teamId],
    queryFn: async () => {
      if (!teamId) return [];
      const { data } = await apiClient.get<any>(`/teams/${teamId}/assignees`);
      const payload = data?.data ?? data;
      const assignees = payload?.assignees ?? (Array.isArray(payload) ? payload : []);
      return Array.isArray(assignees) ? assignees : [];
    },
    enabled: Boolean(teamId && teamId > 0),
    staleTime: 60 * 1000,
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

// GET /api/tickets/:id — View single ticket details
export const useTicketDetailQuery = (ticketId: number | null) => {
  return useQuery<TicketDetailResponse>({
    queryKey: ticketKeys.detail(ticketId),
    queryFn: async () => {
      if (!ticketId) throw new Error("Ticket ID is required");
      const { data } = await apiClient.get<any>(`/tickets/${ticketId}`);
      return data?.data ?? data;
    },
    enabled: Boolean(ticketId && ticketId > 0),
  });
};

// GET /api/tickets/:id/history — Ticket audit history
export const useTicketHistoryQuery = (ticketId: number | null) => {
  return useQuery<TicketHistoryItem[]>({
    queryKey: ticketKeys.history(ticketId),
    queryFn: async () => {
      if (!ticketId) return [];
      const { data } = await apiClient.get<any>(`/tickets/${ticketId}/history`);
      const list = data?.data?.history ?? data?.data ?? data;
      return Array.isArray(list) ? list : [];
    },
    enabled: Boolean(ticketId && ticketId > 0),
  });
};

// GET /api/tickets/:id/time-entries — List time entries
export const useTicketTimeEntriesQuery = (ticketId: number | null) => {
  return useQuery<TimeEntryItem[]>({
    queryKey: ticketKeys.timeEntries(ticketId),
    queryFn: async () => {
      if (!ticketId) return [];
      const { data } = await apiClient.get<any>(`/tickets/${ticketId}/time-entries`);
      const list = data?.data?.entries ?? data?.data ?? data;
      return Array.isArray(list) ? list : [];
    },
    enabled: Boolean(ticketId && ticketId > 0),
  });
};

// GET /api/tickets/:id/time-entries/summary — Aggregate time summary
export const useTicketTimeSummaryQuery = (ticketId: number | null) => {
  return useQuery<TicketTimeSummaryResponse>({
    queryKey: ticketKeys.timeSummary(ticketId),
    queryFn: async () => {
      if (!ticketId) throw new Error("Ticket ID required");
      const { data } = await apiClient.get<any>(`/tickets/${ticketId}/time-entries/summary`);
      return data?.data ?? data;
    },
    enabled: Boolean(ticketId && ticketId > 0),
  });
};

// PATCH /api/tickets/:id/status — Change status
export const useChangeStatusMutation = (ticketId: number) => {
  const queryClient = useQueryClient();

  return useMutation<any, AxiosError<any>, ChangeStatusPayload>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.patch(`/tickets/${ticketId}/status`, payload);
      return data?.data ?? data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.history(ticketId) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["user-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
    },
  });
};

// PATCH /api/tickets/:id/priority — Change priority
export const useChangePriorityMutation = (ticketId: number) => {
  const queryClient = useQueryClient();

  return useMutation<any, AxiosError<any>, ChangePriorityPayload>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.patch(`/tickets/${ticketId}/priority`, payload);
      return data?.data ?? data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.history(ticketId) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["user-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
    },
  });
};

// PATCH /api/tickets/:id/reassign — Reassign ticket
export const useReassignTicketMutation = (ticketId: number) => {
  const queryClient = useQueryClient();

  return useMutation<any, AxiosError<any>, ReassignTicketPayload>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.patch(`/tickets/${ticketId}/reassign`, payload);
      return data?.data ?? data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.history(ticketId) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["user-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
    },
  });
};

// POST /api/tickets/:id/close — Close ticket
export const useCloseTicketMutation = (ticketId: number) => {
  const queryClient = useQueryClient();

  return useMutation<any, AxiosError<any>, CloseTicketPayload>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post(`/tickets/${ticketId}/close`, payload);
      return data?.data ?? data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.history(ticketId) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["user-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
    },
  });
};

// POST /api/tickets/:id/remarks — Add remark
export const useAddRemarkMutation = (ticketId: number) => {
  const queryClient = useQueryClient();

  return useMutation<any, AxiosError<any>, AddRemarkPayload>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post(`/tickets/${ticketId}/remarks`, payload);
      return data?.data ?? data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.history(ticketId) });
    },
  });
};

// POST /api/tickets/:id/attachments — Upload attachment
export const useUploadAttachmentMutation = (ticketId: number) => {
  const queryClient = useQueryClient();

  return useMutation<any, AxiosError<any>, FormData>({
    mutationFn: async (formData) => {
      const { data } = await apiClient.post(`/tickets/${ticketId}/attachments`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data?.data ?? data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.history(ticketId) });
    },
  });
};

// POST /api/tickets/:id/time-entries — Log time
export const useLogTimeMutation = (ticketId: number) => {
  const queryClient = useQueryClient();

  return useMutation<any, AxiosError<any>, LogTimePayload>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post(`/tickets/${ticketId}/time-entries`, payload);
      return data?.data ?? data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.timeEntries(ticketId) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.timeSummary(ticketId) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.history(ticketId) });
    },
  });
};

// POST /api/tickets/:id/teams — Add collaborating team
export const useAddCollaboratingTeamMutation = (ticketId: number) => {
  const queryClient = useQueryClient();

  return useMutation<any, AxiosError<any>, { teamId: number }>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post(`/tickets/${ticketId}/teams`, payload);
      return data?.data ?? data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.history(ticketId) });
    },
  });
};

// DELETE /api/tickets/:id/teams/:teamId — Remove collaborating team
export const useRemoveCollaboratingTeamMutation = (ticketId: number) => {
  const queryClient = useQueryClient();

  return useMutation<any, AxiosError<any>, { teamId: number }>({
    mutationFn: async ({ teamId }) => {
      const { data } = await apiClient.delete(`/tickets/${ticketId}/teams/${teamId}`);
      return data?.data ?? data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.history(ticketId) });
    },
  });
};

// POST /api/tickets/:id/subtickets — Create sub-ticket
export const useCreateSubTicketMutation = (parentTicketId: number) => {
  const queryClient = useQueryClient();

  return useMutation<TicketItem, AxiosError<any>, CreateTicketPayload>({
    mutationFn: async (payload: CreateTicketPayload) => {
      const { data } = await apiClient.post<any>(`/tickets/${parentTicketId}/subtickets`, payload);
      return data?.data ?? data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(parentTicketId) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.history(parentTicketId) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.all });
    },
  });
};

// PATCH /api/tickets/:id — Update ticket summary, description, and custom fields
export const useUpdateTicketMutation = (defaultTicketId?: number) => {
  const queryClient = useQueryClient();

  return useMutation<any, AxiosError<any>, { ticketId?: number; payload: UpdateTicketPayload } | UpdateTicketPayload>({
    mutationFn: async (arg) => {
      const targetId = (arg && "payload" in arg && arg.ticketId) ? arg.ticketId : defaultTicketId;
      const payload = (arg && "payload" in arg) ? arg.payload : arg;
      const { data } = await apiClient.patch(`/tickets/${targetId}`, payload);
      return data?.data ?? data;
    },
    onSuccess: (_data, arg) => {
      const targetId = (arg && "payload" in arg && arg.ticketId) ? arg.ticketId : defaultTicketId;
      if (targetId) {
        queryClient.invalidateQueries({ queryKey: ticketKeys.detail(targetId) });
        queryClient.invalidateQueries({ queryKey: ticketKeys.history(targetId) });
      }
      if (defaultTicketId && defaultTicketId !== targetId) {
        queryClient.invalidateQueries({ queryKey: ticketKeys.detail(defaultTicketId) });
      }
      queryClient.invalidateQueries({ queryKey: ticketKeys.all });
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["user-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
    },
  });
};

// DELETE /api/tickets/:id — Delete ticket and its associated records
export const useDeleteTicketMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<any, AxiosError<any>, number>({
    mutationFn: async (ticketId: number) => {
      const { data } = await apiClient.delete(`/tickets/${ticketId}`);
      return data?.data ?? data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.all });
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["user-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
    },
  });
};
