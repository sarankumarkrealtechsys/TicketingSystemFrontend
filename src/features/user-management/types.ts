import { PermissionScope } from "@/features/auth";

export interface RolePermissionDetail {
  id: number;
  scope: PermissionScope | null;
  permission: {
    id: number;
    key: string;
    description: string;
    category: string;
  };
}

export interface UserRoleDetail {
  id: number;
  name: string;
  description?: string | null;
  rolePermissions?: RolePermissionDetail[];
}

export interface DepartmentSummary {
  id: number;
  name: string;
}

export interface TeamSummary {
  id: number;
  name: string;
}

export interface UserListItem {
  id: number;
  name: string;
  username: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE';
  departmentId: number;
  roleId: number;
  legacyRole: string;
  createdAt: string;
  updatedAt: string;
  department: DepartmentSummary;
  role: UserRoleDetail;
  teams: TeamSummary[];
}

export interface CreateUserDto {
  name: string;
  username: string;
  password: string;
  email: string;
  departmentId: number;
  roleId: number;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  departmentId?: number;
  roleId?: number;
  status?: 'ACTIVE' | 'INACTIVE';
  password?: string;
}

export interface UserFilterParams {
  departmentId?: number | string;
  roleId?: number | string;
  status?: 'ALL' | 'ACTIVE' | 'INACTIVE';
  search?: string;
}

export interface UserPerformanceMetrics {
  totalAssigned: number;
  activeInQueue: number;
  completedCount: number;
  totalCreated: number;
  totalTimeLoggedMinutes: number;
  totalTimeLoggedHours: number;
  avgResolutionHours: number;
  statusBreakdown: {
    resolved: number;
    inProgress: number;
    open: number;
    onHold: number;
    closed: number;
    total: number;
  };
  priorityBreakdown: {
    high: number;
    medium: number;
    low: number;
    total: number;
  };
}

export interface ScopedTicketItem {
  id: number;
  ticketNumber: string;
  title: string;
  status: { id: number; name: string; behavior: string } | null;
  priority: { id: number; name: string; colorHex?: string } | null;
  department: { id: number; name: string } | null;
  team: { id: number; name: string } | null;
  createdAt: string;
  resolvedAt?: string | null;
  totalTimeLoggedMinutes: number;
}

export interface UserPerformanceData {
  user: UserListItem;
  metrics: UserPerformanceMetrics;
  tickets: ScopedTicketItem[];
  assignedTickets: ScopedTicketItem[];
  createdTickets: ScopedTicketItem[];
}

