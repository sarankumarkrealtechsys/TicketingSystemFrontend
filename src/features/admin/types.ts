export interface TicketStatsData {
  total: number;
  byStatusBehavior: {
    OPEN: number;
    IN_PROGRESS: number;
    ON_HOLD: number;
    RESOLVED: number;
    CLOSED: number;
  };
  byPriority: Array<{
    priorityId: number;
    label: string;
    count: number;
  }>;
}

export interface TicketListItem {
  id: number;
  ticketNumber: string;
  summary: string;
  project?: {
    id: number;
    name: string;
  };
  team?: {
    id: number;
    name: string;
    departmentId?: number;
  };
  priority?: {
    id: number;
    label: string;
  };
  status?: {
    id: number;
    label: string;
    behavior: string;
  };
  createdBy?: {
    id: number;
    name: string;
    email: string;
  };
  assignees?: Array<{
    teamId?: number;
    user: {
      id: number;
      name: string;
      email: string;
    };
  }>;
  createdAt: string;
}

export interface TicketsTableResponse {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  tickets: TicketListItem[];
}

export interface TicketQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  projectId?: string | number;
  teamId?: string | number;
  assigneeId?: string | number;
  priorityId?: string | number;
  statusId?: string | number;
  startDate?: string;
  endDate?: string;
}

export interface MasterDataItem {
  id: number;
  name?: string;
  label?: string;
  behavior?: string;
  email?: string;
}
