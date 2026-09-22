import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import { TicketQueryParams, TicketsTableResponse } from "@/features/admin/types";
import { ExportTicketItem } from "./utils/exportUtils";

export interface ReportQueryParams extends TicketQueryParams {
  scope?: "created" | "assigned" | "personal" | "all";
}

export const reportsKeys = {
  all: ["reports"] as const,
  tickets: (params: ReportQueryParams) => [...reportsKeys.all, "tickets", params] as const,
  systemAuditLogs: (params: Record<string, any>) => [...reportsKeys.all, "audit-logs", params] as const,
};

// GET /api/tickets — Fetches paginated tickets with active filters
export const useReportTicketsQuery = (params: ReportQueryParams) => {
  return useQuery<TicketsTableResponse>({
    queryKey: reportsKeys.tickets(params),
    queryFn: async () => {
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(
          ([, v]) => v !== undefined && v !== "" && v !== null && v !== "all"
        )
      );
      const { data } = await apiClient.get<{ status: string; data: TicketsTableResponse }>(
        "/tickets",
        { params: cleanParams }
      );
      return data.data;
    },
    placeholderData: keepPreviousData,
  });
};

// Fetches ALL matching tickets for report export (bypassing pagination limits up to 5,000)
export const fetchAllTicketsForExport = async (
  params: ReportQueryParams
): Promise<ExportTicketItem[]> => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(
      ([k, v]) =>
        k !== "page" &&
        k !== "pageSize" &&
        v !== undefined &&
        v !== "" &&
        v !== null &&
        v !== "all"
    )
  );

  cleanParams.format = "json";
  cleanParams.limit = 5000;

  const { data } = await apiClient.get<{ status: string; data: ExportTicketItem[] }>(
    "/tickets/export",
    { params: cleanParams }
  );

  return data.data || [];
};

// GET /api/admin/audit-logs — System Audit Log entries (Admin only)
export const useSystemAuditLogsQuery = (params: Record<string, any>, enabled = true) => {
  return useQuery({
    queryKey: reportsKeys.systemAuditLogs(params),
    queryFn: async () => {
      const { data } = await apiClient.get<any>("/admin/audit-logs", { params });
      return data?.data ?? data;
    },
    enabled,
  });
};

export const fetchSystemAuditLogsForExport = async (): Promise<any[]> => {
  const { data } = await apiClient.get<any>("/admin/audit-logs", {
    params: { page: 1, pageSize: 100 },
  });
  return data?.data?.logs ?? data?.logs ?? [];
};

