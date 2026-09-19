import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { apiClient } from "@/shared/api";
import {
  RoleItem,
  RoleDetail,
  PermissionItem,
  CreateRoleDto,
  UpdateRoleDto,
  UpdateRolePermissionsDto,
} from "./types";

export const roleKeys = {
  all: ["roles"] as const,
  lists: () => [...roleKeys.all, "list"] as const,
  details: () => [...roleKeys.all, "detail"] as const,
  detail: (id: number | null | undefined) => [...roleKeys.details(), id] as const,
  permissions: ["permissions"] as const,
};

// API Fetchers
export const fetchRoles = async (): Promise<RoleItem[]> => {
  const { data } = await apiClient.get<{
    status: string;
    data: RoleItem[];
  }>("/roles");
  return data.data;
};

export const fetchRoleById = async (id: number): Promise<RoleDetail> => {
  const { data } = await apiClient.get<{
    status: string;
    data: RoleDetail;
  }>(`/roles/${id}`);
  return data.data;
};

export const fetchPermissions = async (): Promise<PermissionItem[]> => {
  const { data } = await apiClient.get<{
    status: string;
    data: PermissionItem[];
  }>("/permissions");
  return data.data;
};

export const createRoleApi = async (payload: CreateRoleDto): Promise<RoleItem> => {
  const { data } = await apiClient.post<{
    status: string;
    data: RoleItem;
  }>("/roles", payload);
  return data.data;
};

export const updateRoleApi = async ({
  id,
  data: payload,
}: {
  id: number;
  data: UpdateRoleDto;
}): Promise<RoleItem> => {
  const { data } = await apiClient.put<{
    status: string;
    data: RoleItem;
  }>(`/roles/${id}`, payload);
  return data.data;
};

export const updateRolePermissionsApi = async ({
  id,
  data: payload,
}: {
  id: number;
  data: UpdateRolePermissionsDto;
}): Promise<{ roleId: number; permissionCount: number }> => {
  const { data } = await apiClient.put<{
    status: string;
    message: string;
    data: { roleId: number; permissionCount: number };
  }>(`/roles/${id}/permissions`, payload);
  return data.data;
};

export const deleteRoleApi = async (id: number): Promise<void> => {
  await apiClient.delete(`/roles/${id}`);
};

// React Query Hooks
export const useRolesQuery = () => {
  return useQuery<RoleItem[], AxiosError<{ message?: string }>>({
    queryKey: roleKeys.lists(),
    queryFn: fetchRoles,
    staleTime: 30_000,
  });
};

export const useRoleDetailsQuery = (id: number | null | undefined) => {
  return useQuery<RoleDetail, AxiosError<{ message?: string }>>({
    queryKey: roleKeys.detail(id),
    queryFn: () => fetchRoleById(id!),
    enabled: typeof id === "number" && id > 0,
    staleTime: 15_000,
  });
};

export const usePermissionsQuery = () => {
  return useQuery<PermissionItem[], AxiosError<{ message?: string }>>({
    queryKey: roleKeys.permissions,
    queryFn: fetchPermissions,
    staleTime: 60_000,
  });
};

export const useCreateRoleMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<RoleItem, AxiosError<{ message?: string }>, CreateRoleDto>({
    mutationFn: createRoleApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
    },
  });
};

export const useUpdateRoleMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<
    RoleItem,
    AxiosError<{ message?: string }>,
    { id: number; data: UpdateRoleDto }
  >({
    mutationFn: updateRoleApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(data.id) });
    },
  });
};

export const useUpdateRolePermissionsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<
    { roleId: number; permissionCount: number },
    AxiosError<{ message?: string }>,
    { id: number; data: UpdateRolePermissionsDto }
  >({
    mutationFn: updateRolePermissionsApi,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(variables.id) });
    },
  });
};

export const useDeleteRoleMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<void, AxiosError<{ message?: string }>, number>({
    mutationFn: deleteRoleApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
    },
  });
};
