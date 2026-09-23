import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import {
  UserListItem,
  CreateUserDto,
  UpdateUserDto,
  UserFilterParams,
} from "./types";

export const userManagementKeys = {
  all: ["user-management"] as const,
  users: (filters?: UserFilterParams) =>
    [...userManagementKeys.all, "users", filters] as const,
  detail: (userId: number | null) =>
    [...userManagementKeys.all, "detail", userId] as const,
  performance: (userId: number | null) =>
    [...userManagementKeys.all, "performance", userId] as const,
  userTeams: (userId: number | null) =>
    [...userManagementKeys.all, "user-teams", userId] as const,
};

// GET /api/users
export const useUsersListQuery = (
  filters?: UserFilterParams,
  options?: { enabled?: boolean }
) => {
  return useQuery<UserListItem[]>({
    queryKey: userManagementKeys.users(filters),
    queryFn: async () => {
      const { data } = await apiClient.get<any>("/users", {
        params: {
          departmentId:
            filters?.departmentId && filters.departmentId !== "all"
              ? filters.departmentId
              : undefined,
          roleId:
            filters?.roleId && filters.roleId !== "all"
              ? filters.roleId
              : undefined,
          status:
            filters?.status && filters.status !== "ALL"
              ? filters.status
              : undefined,
          search: filters?.search?.trim() || undefined,
        },
      });
      const list = data?.data?.users ?? data?.data ?? data?.users ?? [];
      return Array.isArray(list) ? list : [];
    },
    enabled: options?.enabled,
    staleTime: 60 * 1000,
  });
};

// GET /api/users/:userId
export const useUserDetailQuery = (userId: number | null) => {
  return useQuery<UserListItem>({
    queryKey: userManagementKeys.detail(userId),
    queryFn: async () => {
      if (!userId) throw new Error("User ID required");
      const { data } = await apiClient.get<any>(`/users/${userId}`);
      return data?.data?.user ?? data?.data ?? data;
    },
    enabled: !!userId,
  });
};

// GET /api/users/:userId/performance
export const useUserPerformanceQuery = (userId: number | null) => {
  return useQuery<import("./types").UserPerformanceData>({
    queryKey: userManagementKeys.performance(userId),
    queryFn: async () => {
      if (!userId) throw new Error("User ID required");
      const { data } = await apiClient.get<any>(`/users/${userId}/performance`);
      return data?.data ?? data;
    },
    enabled: !!userId,
  });
};

// POST /api/users
export const useCreateUserMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateUserDto) => {
      const { data } = await apiClient.post<any>("/users", payload);
      return data?.data?.user ?? data?.data ?? data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userManagementKeys.all });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
};

// PATCH /api/users/:userId
export const useUpdateUserMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      data: payload,
    }: {
      userId: number;
      data: UpdateUserDto;
    }) => {
      const { data } = await apiClient.patch<any>(`/users/${userId}`, payload);
      return data?.data?.user ?? data?.data ?? data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userManagementKeys.all });
      queryClient.invalidateQueries({
        queryKey: userManagementKeys.detail(variables.userId),
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
};

// DELETE /api/users/:userId (Deactivate or soft-retire)
export const useDeactivateUserMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: number) => {
      const { data } = await apiClient.delete<any>(`/users/${userId}`);
      return data?.data?.user ?? data?.data ?? data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userManagementKeys.all });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
};

// DELETE /api/users/:userId?permanent=true (Permanent removal of inactive users)
export const useDeleteUserMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: number) => {
      const { data } = await apiClient.delete<any>(`/users/${userId}`, {
        params: { permanent: true },
      });
      return data?.data ?? data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userManagementKeys.all });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
};

// POST /api/users/:userId/teams (Add user to team)
export const useAddUserTeamMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      teamId,
    }: {
      userId: number;
      teamId: number;
    }) => {
      const { data } = await apiClient.post<any>(`/users/${userId}/teams`, {
        teamId,
      });
      return data?.data ?? data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userManagementKeys.all });
      queryClient.invalidateQueries({ queryKey: ["team-management"] });
    },
  });
};

// DELETE /api/users/:userId/teams/:teamId (Remove user from team)
export const useRemoveUserTeamMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      teamId,
    }: {
      userId: number;
      teamId: number;
    }) => {
      const { data } = await apiClient.delete<any>(
        `/users/${userId}/teams/${teamId}`
      );
      return data?.data ?? data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userManagementKeys.all });
      queryClient.invalidateQueries({ queryKey: ["team-management"] });
    },
  });
};
