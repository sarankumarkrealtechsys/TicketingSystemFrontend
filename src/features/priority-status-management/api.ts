import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api';
import {
  PriorityLevelItem,
  CreatePriorityPayload,
  UpdatePriorityPayload,
  TicketStatusItem,
  CreateTicketStatusPayload,
  UpdateTicketStatusPayload,
} from './types';

// ============================================================================
// PRIORITY LEVELS API HOOKS
// ============================================================================

export const usePrioritiesQuery = (options?: { includeInactive?: boolean }) => {
  const includeInactive = options?.includeInactive ?? true;
  return useQuery({
    queryKey: ['priority-levels', { includeInactive }],
    queryFn: async () => {
      const { data } = await apiClient.get<{ status: string; data: PriorityLevelItem[] }>(
        `/priority-levels?includeInactive=${includeInactive}`
      );
      return data.data || [];
    },
    staleTime: 30000,
  });
};

const invalidatePriorityData = (queryClient: any) => {
  queryClient.invalidateQueries({ queryKey: ['priority-levels'] });
  queryClient.invalidateQueries({ queryKey: ['admin'] });
  queryClient.invalidateQueries({ queryKey: ['user-dashboard'] });
  queryClient.invalidateQueries({ queryKey: ['tickets'] });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('rts_masterdata_updated'));
  }
};

const invalidateStatusData = (queryClient: any) => {
  queryClient.invalidateQueries({ queryKey: ['ticket-statuses'] });
  queryClient.invalidateQueries({ queryKey: ['admin'] });
  queryClient.invalidateQueries({ queryKey: ['user-dashboard'] });
  queryClient.invalidateQueries({ queryKey: ['tickets'] });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('rts_masterdata_updated'));
  }
};

export const useCreatePriorityMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreatePriorityPayload) => {
      const { data } = await apiClient.post<{ status: string; data: PriorityLevelItem }>(
        '/priority-levels',
        payload
      );
      return data.data;
    },
    onSuccess: () => {
      invalidatePriorityData(queryClient);
    },
  });
};

export const useUpdatePriorityMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data: payload }: { id: number; data: UpdatePriorityPayload }) => {
      const { data } = await apiClient.patch<{ status: string; data: PriorityLevelItem }>(
        `/priority-levels/${id}`,
        payload
      );
      return data.data;
    },
    onSuccess: () => {
      invalidatePriorityData(queryClient);
    },
  });
};

export const useRetirePriorityMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.delete<{ status: string; data: PriorityLevelItem }>(
        `/priority-levels/${id}`
      );
      return data.data;
    },
    onSuccess: () => {
      invalidatePriorityData(queryClient);
    },
  });
};

// ============================================================================
// TICKET STATUSES API HOOKS
// ============================================================================

export const useTicketStatusesQuery = (options?: { includeInactive?: boolean; teamId?: string | number }) => {
  const includeInactive = options?.includeInactive ?? true;
  const teamId = options?.teamId ?? 'all';
  return useQuery({
    queryKey: ['ticket-statuses', { includeInactive, teamId }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (includeInactive) params.append('includeInactive', 'true');
      if (teamId === 'all') {
        params.append('all', 'true');
      } else if (teamId) {
        params.append('teamId', String(teamId));
      }
      const { data } = await apiClient.get<{ status: string; data: TicketStatusItem[] }>(
        `/ticket-statuses?${params.toString()}`
      );
      return data.data || [];
    },
    staleTime: 30000,
  });
};

export const useCreateTicketStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateTicketStatusPayload) => {
      const { data } = await apiClient.post<{ status: string; data: TicketStatusItem }>(
        '/ticket-statuses',
        payload
      );
      return data.data;
    },
    onSuccess: () => {
      invalidateStatusData(queryClient);
    },
  });
};

export const useUpdateTicketStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data: payload }: { id: number; data: UpdateTicketStatusPayload }) => {
      const { data } = await apiClient.patch<{ status: string; data: TicketStatusItem }>(
        `/ticket-statuses/${id}`,
        payload
      );
      return data.data;
    },
    onSuccess: () => {
      invalidateStatusData(queryClient);
    },
  });
};

export const useDeletePriorityPermanentlyMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.delete<{ status: string; data: PriorityLevelItem }>(
        `/priority-levels/${id}/permanent`
      );
      return data.data;
    },
    onSuccess: () => {
      invalidatePriorityData(queryClient);
    },
  });
};

export const useRetireTicketStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.delete<{ status: string; data: TicketStatusItem }>(
        `/ticket-statuses/${id}`
      );
      return data.data;
    },
    onSuccess: () => {
      invalidateStatusData(queryClient);
    },
  });
};

export const useDeleteTicketStatusPermanentlyMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.delete<{ status: string; data: TicketStatusItem }>(
        `/ticket-statuses/${id}/permanent`
      );
      return data.data;
    },
    onSuccess: () => {
      invalidateStatusData(queryClient);
    },
  });
};

// ============================================================================
// COLOR REGISTRY API HOOKS
// ============================================================================

export const useColorRegistryQuery = () => {
  return useQuery({
    queryKey: ['color-registry'],
    queryFn: async () => {
      const { data } = await apiClient.get<{
        status: string;
        data: { priorityColors: Record<string, string>; statusColors: Record<string, string> };
      }>('/color-registry');
      return data.data;
    },
    staleTime: 60000,
  });
};

export const useUpdateColorRegistryMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      priorityColors?: Record<string, string>;
      statusColors?: Record<string, string>;
    }) => {
      const { data } = await apiClient.put<{
        status: string;
        data: { priorityColors: Record<string, string>; statusColors: Record<string, string> };
      }>('/color-registry', payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['color-registry'] });
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      queryClient.invalidateQueries({ queryKey: ['user-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
};

