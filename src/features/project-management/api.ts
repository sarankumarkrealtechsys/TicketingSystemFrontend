import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { apiClient } from "@/shared/api";
import {
  ProjectItem,
  CreateProjectPayload,
  UpdateProjectPayload,
} from "./types";

export const projectKeys = {
  all: ["projects"] as const,
  lists: () => [...projectKeys.all, "list"] as const,
  list: (params?: { includeInactive?: boolean }) =>
    [...projectKeys.lists(), params] as const,
  details: () => [...projectKeys.all, "detail"] as const,
  detail: (id: number | null | undefined) =>
    [...projectKeys.details(), id] as const,
};

// API Fetchers
export const fetchProjects = async (params?: {
  includeInactive?: boolean;
}): Promise<ProjectItem[]> => {
  const { data } = await apiClient.get<{
    status: string;
    data: ProjectItem[];
  }>("/projects", {
    params: {
      includeInactive: params?.includeInactive ? "true" : "false",
    },
  });
  return data.data;
};

export const fetchProjectById = async (id: number): Promise<ProjectItem> => {
  const { data } = await apiClient.get<{
    status: string;
    data: ProjectItem;
  }>(`/projects/${id}`);
  return data.data;
};

export const createProjectApi = async (
  payload: CreateProjectPayload,
): Promise<ProjectItem> => {
  const { data } = await apiClient.post<{
    status: string;
    data: ProjectItem;
  }>("/projects", payload);
  return data.data;
};

export const updateProjectApi = async ({
  id,
  data: payload,
}: {
  id: number;
  data: UpdateProjectPayload;
}): Promise<ProjectItem> => {
  const { data } = await apiClient.patch<{
    status: string;
    data: ProjectItem;
  }>(`/projects/${id}`, payload);
  return data.data;
};

export const retireProjectApi = async (id: number): Promise<ProjectItem> => {
  const { data } = await apiClient.delete<{
    status: string;
    data: ProjectItem;
  }>(`/projects/${id}`);
  return data.data;
};

export const deleteProjectPermanentApi = async (id: number): Promise<ProjectItem> => {
  const { data } = await apiClient.delete<{
    status: string;
    data: ProjectItem;
  }>(`/projects/${id}?permanent=true`);
  return data.data;
};

// Custom React Query Hooks
export const useProjectsQuery = (params?: { includeInactive?: boolean }) => {
  return useQuery({
    queryKey: projectKeys.list(params),
    queryFn: () => fetchProjects(params),
    staleTime: 60 * 1000,
  });
};

export const useProjectDetailQuery = (id: number | null | undefined) => {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => fetchProjectById(id!),
    enabled: Boolean(id && id > 0),
    staleTime: 60 * 1000,
  });
};

export const useCreateProjectMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<ProjectItem, AxiosError<any>, CreateProjectPayload>({
    mutationFn: createProjectApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
};

export const useUpdateProjectMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<
    ProjectItem,
    AxiosError<any>,
    { id: number; data: UpdateProjectPayload }
  >({
    mutationFn: updateProjectApi,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({
        queryKey: projectKeys.detail(variables.id),
      });
    },
  });
};

export const useRetireProjectMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<ProjectItem, AxiosError<any>, number>({
    mutationFn: retireProjectApi,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(id) });
    },
  });
};

export const useDeleteProjectPermanentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<ProjectItem, AxiosError<any>, number>({
    mutationFn: deleteProjectPermanentApi,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(id) });
    },
  });
};

