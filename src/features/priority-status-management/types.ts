export type MasterDataStatus = 'ACTIVE' | 'INACTIVE';

export type TicketStatusBehavior =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'RESOLVED'
  | 'CLOSED';

export interface PriorityLevelItem {
  id: number;
  label: string;
  sortOrder: number;
  status: MasterDataStatus;
  createdById?: number;
  createdAt?: string;
  _count?: {
    tickets?: number;
  };
}

export interface CreatePriorityPayload {
  label: string;
  sortOrder?: number;
  status?: MasterDataStatus;
}

export interface UpdatePriorityPayload {
  label?: string;
  sortOrder?: number;
  status?: MasterDataStatus;
}

export interface TicketStatusItem {
  id: number;
  label: string;
  description?: string | null;
  sortOrder: number;
  status: MasterDataStatus;
  isDefault: boolean;
  behavior: TicketStatusBehavior;
  teamId?: number | null;
  team?: {
    id: number;
    name: string;
  } | null;
  createdById?: number | null;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    tickets?: number;
  };
}

export interface CreateTicketStatusPayload {
  label: string;
  description?: string;
  behavior: TicketStatusBehavior;
  sortOrder?: number;
  teamId?: number | null;
  status?: MasterDataStatus;
}

export interface UpdateTicketStatusPayload {
  label?: string;
  description?: string;
  behavior?: TicketStatusBehavior;
  sortOrder?: number;
  status?: MasterDataStatus;
}
