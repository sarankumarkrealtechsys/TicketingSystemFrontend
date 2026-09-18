export interface DepartmentItem {
  id: number;
  name: string;
  description?: string | null;
  status: "ACTIVE" | "INACTIVE";
}

export interface UserSummary {
  id: number;
  name: string;
  username: string;
  email: string;
  departmentId: number;
  status: string;
  roleId?: number;
  userRole?: {
    id: number;
    name: string;
  };
}

export interface TeamMemberItem {
  id: number;
  userId: number;
  teamId: number;
  joinedAt: string;
  removedAt?: string | null;
  user: UserSummary;
}

export interface TeamItem {
  id: number;
  name: string;
  description?: string | null;
  teamAdminEmail: string;
  status: "ACTIVE" | "INACTIVE";
  departmentId: number;
  department?: DepartmentItem;
  createdAt?: string;
  _count?: {
    members: number;
    tickets: number;
  };
}

export interface TeamDetailResponse extends TeamItem {
  members: TeamMemberItem[];
  _count: {
    members: number;
    tickets: number;
  };
}

export interface CreateTeamPayload {
  name: string;
  description?: string;
  teamAdminEmail: string;
  departmentId: number;
  status?: "ACTIVE" | "INACTIVE";
  initialMemberIds?: number[];
}

export interface UpdateTeamPayload {
  name?: string;
  description?: string | null;
  teamAdminEmail?: string;
  departmentId?: number;
  status?: "ACTIVE" | "INACTIVE";
}

export type TicketStatusBehavior =
  | "OPEN"
  | "IN_PROGRESS"
  | "ON_HOLD"
  | "RESOLVED"
  | "CLOSED";

export interface TeamStatusItem {
  id: number;
  label: string;
  description?: string | null;
  behavior: TicketStatusBehavior;
  teamId?: number | null;
  status: "ACTIVE" | "INACTIVE";
  sortOrder: number;
  color?: string;
}

export interface CreateStatusPayload {
  label: string;
  description?: string;
  behavior: TicketStatusBehavior;
  teamId: number;
  sortOrder?: number;
}
