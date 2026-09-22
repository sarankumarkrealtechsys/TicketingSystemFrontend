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
  behavior?: string;
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
  departmentId?: number | null;
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
    behavior?: string;
  };
  createdBy?: UserSummary;
}

export interface UpdateTicketPayload {
  summary?: string;
  description?: string;
  priorityId?: number;
  version?: number;
  remarks?: string;
  customFields?: Array<{
    fieldDefinitionId: number;
    value: any;
  }>;
}

export interface TicketActions {
  canChangeStatus?: boolean;
  canChangePriority?: boolean;
  canReassign?: boolean;
  canClose?: boolean;
  canAddRemark?: boolean;
  canLogTime?: boolean;
  canCreateSubTicket?: boolean;
  canManageAttachments?: boolean;
  canManageTeams?: boolean;
  changeStatus?: boolean;
  changePriority?: boolean;
  reassign?: boolean;
  close?: boolean;
  addRemark?: boolean;
  logTime?: boolean;
  createSubticket?: boolean;
  addAttachment?: boolean;
  removeAttachment?: boolean;
  manageTeams?: boolean;
}

export interface TicketAssigneeItem {
  id: number;
  ticketId: number;
  userId: number;
  teamId?: number | null;
  assignedAt: string;
  user: UserSummary;
}

export interface CollaboratingTeamItem {
  id: number;
  ticketId: number;
  teamId: number;
  team: {
    id: number;
    name: string;
    departmentId?: number | null;
  };
}

export interface TicketAttachmentItem {
  id: number;
  ticketId: number;
  originalFileName: string;
  fileExtension?: string;
  mimeType: string;
  fileSizeBytes: number;
  storageKey?: string;
  uploadedById: number;
  createdAt: string;
  uploadedBy?: UserSummary;
}

export interface CustomFieldValueItem {
  id: number;
  ticketId: number;
  fieldDefinitionId: number;
  value: any;
  fieldDefinition: {
    id: number;
    name: string;
    fieldType: string;
    isRequired: boolean;
    options?: any;
  };
}

export interface SubTicketItem {
  id: number;
  ticketNumber: string;
  summary: string;
  description?: string;
  projectId?: number;
  teamId?: number;
  createdById?: number;
  priorityId?: number;
  statusId?: number;
  version?: number;
  createdAt?: string;
  updatedAt?: string;
  resolvedAt?: string | null;
  closedAt?: string | null;
  status?: { id: number; label?: string; name?: string; behavior?: string; color?: string };
  priority?: { id: number; label?: string; name?: string; color?: string; sortOrder?: number };
  team?: { id: number; name: string };
  assignees?: Array<{
    id: number;
    userId: number;
    user?: UserSummary;
  }>;
  createdBy?: UserSummary;
  actions?: TicketActions;
}

export interface TicketDetailResponse {
  id: number;
  ticketNumber: string;
  summary: string;
  description: string;
  projectId: number;
  teamId: number;
  priorityId: number;
  statusId: number;
  parentTicketId?: number | null;
  createdById: number;
  version?: number;
  createdAt: string;
  updatedAt: string;
  closedAt?: string | null;
  resolvedAt?: string | null;
  project?: { id: number; name: string };
  team?: { id: number; name: string; departmentId?: number | null };
  priority?: { id: number; name: string; color?: string; level?: number };
  status?: { id: number; name: string; behavior?: string; color?: string };
  createdBy?: UserSummary;
  parentTicket?: { id: number; ticketNumber: string; summary: string } | null;
  assignees: TicketAssigneeItem[];
  collaboratingTeams: CollaboratingTeamItem[];
  customFieldValues: CustomFieldValueItem[];
  attachments: TicketAttachmentItem[];
  subTickets: SubTicketItem[];
  actions: TicketActions;
}

export interface TicketHistoryItem {
  id: number;
  ticketId: number;
  updatedById?: number | null;
  userId?: number | null;
  action: string;
  previousStatusId?: number | null;
  newStatusId?: number | null;
  previousStatus?: { id: number; label: string; behavior?: string } | null;
  newStatus?: { id: number; label: string; behavior?: string } | null;
  previousPriorityId?: number | null;
  newPriorityId?: number | null;
  previousPriority?: { id: number; label: string } | null;
  newPriority?: { id: number; label: string } | null;
  previousTeamId?: number | null;
  newTeamId?: number | null;
  previousTeam?: { id: number; name: string } | null;
  newTeam?: { id: number; name: string } | null;
  previousBehavior?: string | null;
  newBehavior?: string | null;
  previousValue?: string | null;
  newValue?: string | null;
  remarks?: string | null;
  fieldName?: string | null;
  oldValue?: string | null;
  updatedAt?: string;
  createdAt?: string;
  updatedBy?: UserSummary | null;
  user?: UserSummary | null;
}

export interface TimeEntryItem {
  id: number;
  ticketId: number;
  userId: number;
  minutesSpent: number;
  workType: string;
  workDate: string;
  startTime?: string | null;
  endTime?: string | null;
  note?: string | null;
  billable?: boolean;
  createdAt: string;
  user?: UserSummary;
}

export interface TicketTimeSummaryResponse {
  ticketId: number;
  totalMinutes: number;
  totalHoursFormatted: string;
  breakdownByWorkType: Record<string, number>;
}

export interface ChangeStatusPayload {
  statusId: number;
  remarks?: string;
}

export interface ChangePriorityPayload {
  priorityId: number;
  remarks?: string;
}

export interface ReassignTicketPayload {
  teamId?: number;
  assigneeIds: number[];
  remarks?: string;
}

export interface CloseTicketPayload {
  remarks?: string;
}

export interface AddRemarkPayload {
  remarks: string;
}

export interface LogTimePayload {
  minutesSpent: number;
  workType: string;
  workDate: string;
  startTime?: string | null;
  endTime?: string | null;
  note?: string | null;
  billable?: boolean;
}
