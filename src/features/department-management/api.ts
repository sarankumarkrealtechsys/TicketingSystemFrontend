import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { apiClient } from "@/shared/api";
import {
  DepartmentItem,
  CreateDepartmentPayload,
  UpdateDepartmentPayload,
} from "./types";

export const departmentKeys = {
  all: ["departments"] as const,
  lists: () => [...departmentKeys.all, "list"] as const,
  list: (params?: { includeInactive?: boolean }) =>
    [...departmentKeys.lists(), params] as const,
  details: () => [...departmentKeys.all, "detail"] as const,
  detail: (id: number | null | undefined) =>
    [...departmentKeys.details(), id] as const,
};

// API Fetchers
export const fetchDepartments = async (params?: {
  includeInactive?: boolean;
}): Promise<DepartmentItem[]> => {
  const { data } = await apiClient.get<{
    status: string;
    data: DepartmentItem[];
  }>("/departments", {
    params: {
      includeInactive: params?.includeInactive ? "true" : "false",
    },
  });
  return data.data;
};

export const fetchDepartmentById = async (
  id: number,
): Promise<DepartmentItem> => {
  const { data } = await apiClient.get<{
    status: string;
    data: DepartmentItem;
  }>(`/departments/${id}`);
  return data.data;
};

export const createDepartmentApi = async (
  payload: CreateDepartmentPayload,
): Promise<DepartmentItem> => {
  const { data } = await apiClient.post<{
    status: string;
    data: DepartmentItem;
  }>("/departments", payload);
  return data.data;
};

export const updateDepartmentApi = async ({
  id,
  data: payload,
}: {
  id: number;
  data: UpdateDepartmentPayload;
}): Promise<DepartmentItem> => {
  const { data } = await apiClient.patch<{
    status: string;
    data: DepartmentItem;
  }>(`/departments/${id}`, payload);
  return data.data;
};

export const retireDepartmentApi = async (
  id: number,
): Promise<DepartmentItem> => {
  const { data } = await apiClient.delete<{
    status: string;
    data: DepartmentItem;
  }>(`/departments/${id}`);
  return data.data;
};

export const deleteDepartmentPermanentApi = async (
  id: number,
): Promise<DepartmentItem> => {
  const { data } = await apiClient.delete<{
    status: string;
    data: DepartmentItem;
  }>(`/departments/${id}?permanent=true`);
  return data.data;
};

// Custom React Query Hooks
export const useDepartmentsQuery = (params?: { includeInactive?: boolean }) => {
  return useQuery({
    queryKey: departmentKeys.list(params),
    queryFn: () => fetchDepartments(params),
    staleTime: 60 * 1000,
  });
};

export const useDepartmentDetailQuery = (id: number | null | undefined) => {
  return useQuery({
    queryKey: departmentKeys.detail(id),
    queryFn: () => fetchDepartmentById(id!),
    enabled: Boolean(id && id > 0),
    staleTime: 60 * 1000,
  });
};

export const useCreateDepartmentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<DepartmentItem, AxiosError<any>, CreateDepartmentPayload>({
    mutationFn: createDepartmentApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.all });
    },
  });
};

export const useUpdateDepartmentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<
    DepartmentItem,
    AxiosError<any>,
    { id: number; data: UpdateDepartmentPayload }
  >({
    mutationFn: updateDepartmentApi,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.all });
      queryClient.invalidateQueries({
        queryKey: departmentKeys.detail(variables.id),
      });
    },
  });
};

export const useRetireDepartmentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<DepartmentItem, AxiosError<any>, number>({
    mutationFn: retireDepartmentApi,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.all });
      queryClient.invalidateQueries({ queryKey: departmentKeys.detail(id) });
    },
  });
};

export const useDeleteDepartmentPermanentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<DepartmentItem, AxiosError<any>, number>({
    mutationFn: deleteDepartmentPermanentApi,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.all });
      queryClient.invalidateQueries({ queryKey: departmentKeys.detail(id) });
    },
  });
};

