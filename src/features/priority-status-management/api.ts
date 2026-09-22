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
      queryClient.invalidateQueries({ queryKey: ['priority-levels'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
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
      queryClient.invalidateQueries({ queryKey: ['priority-levels'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
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
      queryClient.invalidateQueries({ queryKey: ['priority-levels'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
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
      queryClient.invalidateQueries({ queryKey: ['ticket-statuses'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
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
      queryClient.invalidateQueries({ queryKey: ['ticket-statuses'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
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
      queryClient.invalidateQueries({ queryKey: ['ticket-statuses'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
};
