export type PermissionScope =
  | 'GLOBAL'
  | 'DEPARTMENT'
  | 'TEAM'
  | 'ASSIGNED'
  | 'OWN';

export interface RoleItem {
  id: number;
  name: string;
  description: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  isSystem: boolean;
  userCount: number;
  permissionCount: number;
  createdAt: string;
}

export interface RolePermissionDetail {
  id: number;
  permissionId: number;
  permissionKey: string;
  category: string;
  description: string;
  scope: PermissionScope | null;
}

export interface RoleDetail {
  id: number;
  name: string;
  description: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  isSystem: boolean;
  userCount: number;
  permissionCount: number;
  createdAt: string;
  rolePermissions: RolePermissionDetail[];
}

export interface PermissionItem {
  id: number;
  key: string;
  description: string;
  category: string;
  createdAt?: string;
}

export interface CreateRoleDto {
  name: string;
  description?: string;
  cloneFromRoleId?: number;
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface PermissionGrantInput {
  permissionId: number;
  scope: PermissionScope | null;
}

export interface UpdateRolePermissionsDto {
  permissions: PermissionGrantInput[];
}
