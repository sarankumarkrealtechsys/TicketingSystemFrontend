import { useMutation, useQuery, UseQueryOptions } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { apiClient } from "@/shared/api";
import {
  LoginRequest,
  LoginResponse,
  MeResponse,
  LogoutResponse,
  ApiErrorResponse,
} from "./types";

export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
};

export const loginApi = async (
  credentials: LoginRequest,
): Promise<LoginResponse> => {
  const { data } = await apiClient.post<LoginResponse>(
    "/auth/login",
    credentials,
  );
  return data;
};

export const logoutApi = async (): Promise<LogoutResponse> => {
  const { data } = await apiClient.post<LogoutResponse>("/auth/logout");
  return data;
};

export const getMeApi = async (): Promise<MeResponse> => {
  const { data } = await apiClient.get<MeResponse>("/auth/me");
  return data;
};

export const useLoginMutation = () => {
  return useMutation<LoginResponse, AxiosError<ApiErrorResponse>, LoginRequest>(
    {
      mutationFn: loginApi,
    },
  );
};

export const useLogoutMutation = () => {
  return useMutation<LogoutResponse, AxiosError<ApiErrorResponse>, void>({
    mutationFn: logoutApi,
  });
};

export const useMeQuery = (
  options?: Omit<
    UseQueryOptions<MeResponse, AxiosError<ApiErrorResponse>>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery<MeResponse, AxiosError<ApiErrorResponse>>({
    queryKey: authKeys.me(),
    queryFn: getMeApi,
    retry: false,
    refetchOnWindowFocus: true,
    staleTime: 0,
    ...options,
  });
};
