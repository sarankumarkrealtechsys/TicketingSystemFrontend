import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api';
import {
  EmailNotificationsSetting,
  UpdateEmailNotificationsPayload,
  InAppNotificationsSetting,
  UpdateInAppNotificationsPayload,
} from './types';

export const SETTINGS_QUERY_KEYS = {
  emailNotifications: ['admin', 'settings', 'email-notifications'] as const,
  inAppNotifications: ['admin', 'settings', 'in-app-notifications'] as const,
};

export const useEmailNotificationsQuery = () => {
  return useQuery({
    queryKey: SETTINGS_QUERY_KEYS.emailNotifications,
    queryFn: async (): Promise<EmailNotificationsSetting> => {
      const { data } = await apiClient.get<{ status: string; data: EmailNotificationsSetting }>(
        '/admin/settings/email-notifications'
      );
      return data.data;
    },
    staleTime: 30000,
  });
};

export const useUpdateEmailNotificationsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateEmailNotificationsPayload): Promise<EmailNotificationsSetting> => {
      const { data } = await apiClient.patch<{ status: string; data: EmailNotificationsSetting; message: string }>(
        '/admin/settings/email-notifications',
        payload
      );
      return data.data;
    },
    onSuccess: (updatedData) => {
      queryClient.setQueryData(SETTINGS_QUERY_KEYS.emailNotifications, updatedData);
      queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEYS.emailNotifications });
    },
  });
};

export const useInAppNotificationsQuery = () => {
  return useQuery({
    queryKey: SETTINGS_QUERY_KEYS.inAppNotifications,
    queryFn: async (): Promise<InAppNotificationsSetting> => {
      const { data } = await apiClient.get<{ status: string; data: InAppNotificationsSetting }>(
        '/admin/settings/in-app-notifications'
      );
      return data.data;
    },
    staleTime: 30000,
  });
};

export const useUpdateInAppNotificationsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateInAppNotificationsPayload): Promise<InAppNotificationsSetting> => {
      const { data } = await apiClient.patch<{ status: string; data: InAppNotificationsSetting; message: string }>(
        '/admin/settings/in-app-notifications',
        payload
      );
      return data.data;
    },
    onSuccess: (updatedData) => {
      queryClient.setQueryData(SETTINGS_QUERY_KEYS.inAppNotifications, updatedData);
      queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEYS.inAppNotifications });
    },
  });
};

