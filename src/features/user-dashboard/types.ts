import {
  TicketStatsData,
  TicketListItem,
  TicketsTableResponse,
  MasterDataItem,
} from "@/features/admin/types";

export type {
  TicketStatsData,
  TicketListItem,
  TicketsTableResponse,
  MasterDataItem,
};

export type UserTicketScope = "personal" | "assigned" | "created";

export interface UserTicketQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  scope?: UserTicketScope;
  projectId?: number;
  priorityId?: number;
  statusId?: number;
  ticketType?: "all" | "main" | "sub";
  parentTicketId?: number;
  startDate?: string;
  endDate?: string;
  assigneeId?: number;
  createdById?: number;
}
