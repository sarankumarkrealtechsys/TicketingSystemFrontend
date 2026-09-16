export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthDepartment {
  id: number;
  name: string;
}

export interface AuthRole {
  id: number;
  name: string;
}

export interface AuthUser {
  id: number;
  name: string;
  username: string;
  email?: string;
  roleId: number;
  role: AuthRole;
  departmentId: number;
  department?: AuthDepartment;
}

export type PermissionsMap = Record<string, string[]>;

export interface AuthData {
  user: AuthUser;
  permissions: PermissionsMap;
}

export interface LoginResponse {
  status: "success";
  message: string;
  data: AuthData;
}

export interface MeResponse {
  status: "success";
  data: AuthData;
}

export interface LogoutResponse {
  status: "success";
  message: string;
}

export interface ApiErrorResponse {
  status: "error";
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}
