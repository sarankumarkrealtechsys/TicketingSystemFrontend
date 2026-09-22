import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { apiClient } from "@/shared/api";
import { TicketFieldDefinition, CreateTicketFieldPayload } from "./types";

export const ticketFieldKeys = {
  all: ["ticketFields"] as const,
  lists: () => [...ticketFieldKeys.all, "list"] as const,
  list: (filters: { teamId?: number | "all"; includeInactive?: boolean }) =>
    [...ticketFieldKeys.lists(), filters] as const,
  detail: (id: number) => [...ticketFieldKeys.all, "detail", id] as const,
};

export const useTicketFieldsQuery = (params?: {
  teamId?: number | "all";
  includeInactive?: boolean;
}) => {
  const teamId = params?.teamId;
  const includeInactive = params?.includeInactive ?? false;

  return useQuery<TicketFieldDefinition[], AxiosError<any>>({
    queryKey: ticketFieldKeys.list({ teamId, includeInactive }),
    queryFn: async () => {
      const queryParams: Record<string, any> = {};
      if (teamId !== undefined && teamId !== null) {
        queryParams.teamId = teamId;
      }
      if (includeInactive) {
        queryParams.includeInactive = true;
      }

      const { data } = await apiClient.get<any>("/ticket-fields", {
        params: queryParams,
      });

      return (data?.data ?? data) as TicketFieldDefinition[];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useCreateTicketFieldMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    TicketFieldDefinition,
    AxiosError<any>,
    CreateTicketFieldPayload
  >({
    mutationFn: async (payload: CreateTicketFieldPayload) => {
      const { data } = await apiClient.post<any>("/ticket-fields", payload);
      return (data?.data ?? data) as TicketFieldDefinition;
    },
    onSuccess: (_data, variables) => {
      // Invalidate all ticket field queries to immediately reflect the new field
      queryClient.invalidateQueries({ queryKey: ticketFieldKeys.all });
      if (variables.teamId) {
        queryClient.invalidateQueries({
          queryKey: ticketFieldKeys.list({ teamId: variables.teamId }),
        });
      }
    },
  });
};
