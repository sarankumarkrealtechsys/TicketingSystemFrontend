export type DepartmentStatus = "ACTIVE" | "INACTIVE";

export interface DepartmentItem {
  id: number;
  name: string;
  description?: string | null;
  status: DepartmentStatus;
  createdById?: number;
  createdAt?: string;
  _count?: {
    teams?: number;
    users?: number;
  };
  teams?: Array<{
    id: number;
    name: string;
    description?: string | null;
    status: string;
    teamAdminEmail?: string;
    _count?: {
      members?: number;
    };
  }>;
  users?: Array<{
    id: number;
    name: string;
    username: string;
    email: string;
    status: string;
    userRole?: {
      name: string;
    };
  }>;
}

export interface CreateDepartmentPayload {
  name: string;
  description?: string;
  status?: DepartmentStatus;
}

export interface UpdateDepartmentPayload {
  name?: string;
  description?: string | null;
  status?: DepartmentStatus;
}
