export type ProjectStatus = "ACTIVE" | "INACTIVE";

export interface ProjectItem {
  id: number;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  createdById: number;
  createdAt: string;
  createdBy?: {
    id: number;
    name: string;
    email: string;
  };
  _count?: {
    tickets: number;
  };
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
  status?: ProjectStatus;
}

export interface UpdateProjectPayload {
  name?: string;
  description?: string | null;
  status?: ProjectStatus;
}
