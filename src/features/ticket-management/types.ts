export interface PriorityItem {
  id: number;
  label?: string;
  name?: string;
  level?: number;
  sortOrder?: number;
  color?: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface TicketStatusItem {
  id: number;
  label?: string;
  name?: string;
  isDefault?: boolean;
  isTerminal?: boolean;
  color?: string;
  teamId?: number;
}

export interface UserSummary {
  id: number;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  username?: string;
}

export interface TicketAttachmentPayload {
  originalFileName?: string;
  fileName?: string;
  storageKey?: string;
  mimeType: string;
  fileSizeBytes: number;
  fileExtension?: string;
  checksum?: string;
}

export interface DepartmentItem {
  id: number;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface CreateTicketPayload {
  projectId: number;
  departmentId?: number;
  teamId: number;
  collaboratingTeamIds?: number[];
  summary: string;
  description: string;
  assigneeIds: number[];
  priorityId: number;
  statusId?: number;
  attachments?: TicketAttachmentPayload[];
  customFields?: Array<{
    fieldDefinitionId: number;
    value: any;
  }>;
}

export interface TicketItem {
  id: number;
  ticketNumber: string;
  summary: string;
  description: string;
  projectId: number;
  teamId: number;
  priorityId: number;
  statusId: number;
  createdById: number;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: number;
    name: string;
  };
  team?: {
    id: number;
    name: string;
  };
  priority?: {
    id: number;
    name: string;
  };
  status?: {
    id: number;
    name: string;
  };
  createdBy?: UserSummary;
}
