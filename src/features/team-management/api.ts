import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import {
  TeamItem,
  TeamDetailResponse,
  CreateTeamPayload,
  UpdateTeamPayload,
  DepartmentItem,
  UserSummary,
  TeamStatusItem,
  CreateStatusPayload,
  UpdateStatusPayload,
} from "./types";

export const teamManagementKeys = {
  all: ["team-management"] as const,
  teams: (params?: Record<string, any>) =>
    [...teamManagementKeys.all, "teams", params] as const,
  detail: (teamId: number | null) =>
    [...teamManagementKeys.all, "detail", teamId] as const,
  departments: () => [...teamManagementKeys.all, "departments"] as const,
  departmentUsers: (departmentId?: number) =>
    [...teamManagementKeys.all, "department-users", departmentId] as const,
  statuses: (teamId?: number | null) =>
    [...teamManagementKeys.all, "statuses", teamId] as const,
};

// GET /api/teams
export const useTeamsQuery = (params?: {
  departmentId?: number;
  includeInactive?: boolean;
}) => {
  return useQuery<TeamItem[]>({
    queryKey: teamManagementKeys.teams(params),
    queryFn: async () => {
      const { data } = await apiClient.get<any>("/teams", {
        params: {
          departmentId: params?.departmentId,
          includeInactive: params?.includeInactive,
        },
      });
      const list = data?.data ?? data;
      return Array.isArray(list) ? list : [];
    },
  });
};

// GET /api/teams/:id
export const useTeamDetailQuery = (teamId: number | null) => {
  return useQuery<TeamDetailResponse>({
    queryKey: teamManagementKeys.detail(teamId),
    queryFn: async () => {
      if (!teamId) throw new Error("Team ID required");
      const { data } = await apiClient.get<any>(`/teams/${teamId}`);
      return data?.data ?? data;
    },
    enabled: !!teamId,
  });
};

// POST /api/teams (Full CRUD: Create)
export const useCreateTeamMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateTeamPayload) => {
      const { initialMemberIds, ...teamData } = payload;
      const { data } = await apiClient.post<any>("/teams", teamData);
      const createdTeam = data?.data ?? data;

      // If initial members were selected, add them sequentially
      if (
        initialMemberIds &&
        initialMemberIds.length > 0 &&
        createdTeam?.id
      ) {
        for (const userId of initialMemberIds) {
          try {
            await apiClient.post(`/users/${userId}/teams`, {
              teamId: createdTeam.id,
            });
          } catch (err) {
            console.warn(`Failed to add initial member ${userId} to team ${createdTeam.id}:`, err);
          }
        }
      }

      return createdTeam;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamManagementKeys.all });
      queryClient.invalidateQueries({ queryKey: ["admin", "teams"] });
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
};

// PATCH /api/teams/:id (Full CRUD: Update)
export const useUpdateTeamMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: UpdateTeamPayload;
    }) => {
      const res = await apiClient.patch<any>(`/teams/${id}`, data);
      return res.data?.data ?? res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: teamManagementKeys.all });
      queryClient.invalidateQueries({ queryKey: teamManagementKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ["admin", "teams"] });
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
};

// DELETE /api/teams/:id (Full CRUD: Delete / Retire)
export const useRetireTeamMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.delete<any>(`/teams/${id}`);
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamManagementKeys.all });
      queryClient.invalidateQueries({ queryKey: ["admin", "teams"] });
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
};

export const useDeleteTeamPermanentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.delete<any>(`/teams/${id}?permanent=true`);
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamManagementKeys.all });
      queryClient.invalidateQueries({ queryKey: ["admin", "teams"] });
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
};

// POST /api/users/:userId/teams (Add Member to Team)
export const useAddTeamMemberMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      teamId,
    }: {
      userId: number;
      teamId: number;
    }) => {
      const res = await apiClient.post<any>(`/users/${userId}/teams`, { teamId });
      return res.data?.data ?? res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: teamManagementKeys.detail(variables.teamId) });
      queryClient.invalidateQueries({ queryKey: teamManagementKeys.teams() });
    },
  });
};

// DELETE /api/users/:userId/teams/:teamId (Remove Member from Team)
export const useRemoveTeamMemberMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      teamId,
    }: {
      userId: number;
      teamId: number;
    }) => {
      const res = await apiClient.delete<any>(`/users/${userId}/teams/${teamId}`);
      return res.data?.data ?? res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: teamManagementKeys.detail(variables.teamId) });
      queryClient.invalidateQueries({ queryKey: teamManagementKeys.teams() });
    },
  });
};

// POST /api/teams/:teamId/members/bulk (Bulk Add Members to Team)
export const useBulkAddTeamMembersMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      teamId,
      userIds,
    }: {
      teamId: number;
      userIds: number[];
    }) => {
      const res = await apiClient.post<any>(`/teams/${teamId}/members/bulk`, { userIds });
      return res.data?.data ?? res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: teamManagementKeys.detail(variables.teamId) });
      queryClient.invalidateQueries({ queryKey: teamManagementKeys.teams() });
    },
  });
};

// POST /api/teams/:teamId/members/bulk-remove (Bulk Remove Members from Team)
export const useBulkRemoveTeamMembersMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      teamId,
      userIds,
    }: {
      teamId: number;
      userIds: number[];
    }) => {
      const res = await apiClient.post<any>(`/teams/${teamId}/members/bulk-remove`, { userIds });
      return res.data?.data ?? res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: teamManagementKeys.detail(variables.teamId) });
      queryClient.invalidateQueries({ queryKey: teamManagementKeys.teams() });
    },
  });
};

// GET /api/departments
export const useDepartmentsQuery = () => {
  return useQuery<DepartmentItem[]>({
    queryKey: teamManagementKeys.departments(),
    queryFn: async () => {
      const { data } = await apiClient.get<any>("/departments");
      const list = data?.data ?? data;
      return Array.isArray(list) ? list : [];
    },
    staleTime: 5 * 60 * 1000,
  });
};

// GET /api/users (strictly filtered by department)
export const useDepartmentUsersQuery = (departmentId?: number) => {
  return useQuery<UserSummary[]>({
    queryKey: teamManagementKeys.departmentUsers(departmentId),
    queryFn: async () => {
      if (!departmentId) return [];
      const { data } = await apiClient.get<any>("/users", {
        params: { departmentId },
      });
      const list = data?.data?.users ?? data?.data ?? data?.users ?? [];
      return Array.isArray(list) ? list : [];
    },
    enabled: Boolean(departmentId && departmentId > 0),
    staleTime: 60 * 1000,
  });
};

// GET /api/ticket-statuses?teamId=:id
export const useTeamStatusesQuery = (
  teamId?: number | null,
  includeInactive: boolean = true,
) => {
  return useQuery<TeamStatusItem[]>({
    queryKey: [...teamManagementKeys.statuses(teamId), { includeInactive }],
    queryFn: async () => {
      if (!teamId) return [];
      const { data } = await apiClient.get<any>("/ticket-statuses", {
        params: { teamId, includeInactive },
      });
      const list = data?.data ?? data;
      return Array.isArray(list) ? list : [];
    },
    enabled: !!teamId,
  });
};

// POST /api/ticket-statuses
export const useCreateTeamStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateStatusPayload) => {
      const res = await apiClient.post<any>("/ticket-statuses", payload);
      return res.data?.data ?? res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: teamManagementKeys.statuses(variables.teamId),
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "statuses"] });
      queryClient.invalidateQueries({ queryKey: ["ticket-statuses"] });
    },
  });
};

// PATCH /api/ticket-statuses/:id
export const useUpdateTeamStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateStatusPayload) => {
      const res = await apiClient.patch<any>(`/ticket-statuses/${id}`, payload);
      return res.data?.data ?? res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: teamManagementKeys.statuses(variables.teamId),
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "statuses"] });
      queryClient.invalidateQueries({ queryKey: ["ticket-statuses"] });
    },
  });
};

// DELETE /api/ticket-statuses/:id
export const useRetireTeamStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: number; teamId?: number | null }) => {
      const res = await apiClient.delete<any>(`/ticket-statuses/${id}`);
      return res.data?.data ?? res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: teamManagementKeys.statuses(variables.teamId),
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "statuses"] });
      queryClient.invalidateQueries({ queryKey: ["ticket-statuses"] });
    },
  });
};

