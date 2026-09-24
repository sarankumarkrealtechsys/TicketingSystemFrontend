import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { apiClient } from "@/shared/api";
import {
  NotificationsApiResponse,
  NotificationsResponseData,
  MarkReadApiResponse,
} from "./types";

export const notificationKeys = {
  all: ["notifications"] as const,
  list: (unreadOnly?: boolean) =>
    [...notificationKeys.all, "list", { unreadOnly }] as const,
  history: (params?: any) =>
    [...notificationKeys.all, "history", params] as const,
};

/**
 * REST API call to fetch notifications list and unread count.
 */
export const getNotificationsApi = async (
  unreadOnly = false,
  limit = 30,
): Promise<NotificationsResponseData> => {
  const { data } = await apiClient.get<NotificationsApiResponse>(
    "/notifications",
    {
      params: { unreadOnly, limit },
    },
  );
  return data.data;
};

/**
 * REST API call to fetch notification history with pagination, filters, and search.
 */
export const getNotificationHistoryApi = async (
  params?: {
    page?: number;
    limit?: number;
    filter?: "all" | "unread" | "read";
    search?: string;
  },
): Promise<NotificationsResponseData> => {
  const { data } = await apiClient.get<NotificationsApiResponse>(
    "/notifications",
    {
      params,
    },
  );
  return data.data;
};

/**
 * REST API call to mark a single notification as read.
 */
export const markNotificationAsReadApi = async (
  id: number,
): Promise<MarkReadApiResponse> => {
  const { data } = await apiClient.patch<MarkReadApiResponse>(
    `/notifications/${id}/read`,
  );
  return data;
};

/**
 * REST API call to mark all notifications as read.
 */
export const markAllNotificationsAsReadApi =
  async (): Promise<MarkReadApiResponse> => {
    const { data } = await apiClient.patch<MarkReadApiResponse>(
      "/notifications/read-all",
    );
    return data;
  };

/**
 * Query hook to fetch user's notifications.
 * staleTime set to 30s so active work benefits from socket-driven invalidations.
 */
export const useNotificationsQuery = (unreadOnly = false, limit = 30) => {
  return useQuery<NotificationsResponseData, AxiosError>({
    queryKey: notificationKeys.list(unreadOnly),
    queryFn: () => getNotificationsApi(unreadOnly, limit),
    staleTime: 30 * 1000,
  });
};

/**
 * Query hook to fetch user's notification history with pagination, filter, and search.
 */
export const useNotificationHistoryQuery = (params?: {
  page?: number;
  limit?: number;
  filter?: "all" | "unread" | "read";
  search?: string;
}) => {
  return useQuery<NotificationsResponseData, AxiosError>({
    queryKey: notificationKeys.history(params),
    queryFn: () => getNotificationHistoryApi(params),
    staleTime: 15 * 1000,
  });
};

/**
 * Mutation hook to mark a single notification as read.
 */
export const useMarkAsReadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<MarkReadApiResponse, AxiosError, number>({
    mutationFn: markNotificationAsReadApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};

/**
 * Mutation hook to mark all notifications as read.
 */
export const useMarkAllAsReadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<MarkReadApiResponse, AxiosError, void>({
    mutationFn: markAllNotificationsAsReadApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};
