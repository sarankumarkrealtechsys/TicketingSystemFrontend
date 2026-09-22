import React, { useState, useMemo, useEffect } from 'react';
import { AppLayout } from '@/layout/AppLayout';
import {
  useRolesQuery,
  useRoleDetailsQuery,
  usePermissionsQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useUpdateRolePermissionsMutation,
  useArchiveRoleMutation,
  useRestoreRoleMutation,
  useDeleteRoleMutation,
} from '../api';
import { RoleItem, PermissionItem, PermissionScope } from '../types';
import { PERMISSION_ALLOWED_SCOPES } from '@/features/auth';
import { SelectDropdown } from '@/shared/components';
import CreateRoleModal from './CreateRoleModal';
import EditRoleModal from './EditRoleModal';
import DeleteRoleModal from './DeleteRoleModal';
import ArchiveRoleModal from './ArchiveRoleModal';
import RolesGuideModal from './RolesGuideModal';
import MyPermissionsView from './MyPermissionsView';

const SCOPES: PermissionScope[] = ['GLOBAL', 'DEPARTMENT', 'TEAM', 'ASSIGNED', 'OWN'];

const SCOPE_LABELS: Record<PermissionScope, string> = {
  GLOBAL: 'Global (Org-wide)',
  DEPARTMENT: 'Department Only',
  TEAM: 'Team Only',
  ASSIGNED: 'Assigned Only',
  OWN: 'Own / Created Only',
};

const CATEGORY_ICONS: Record<string, string> = {
  User: 'person',
  Department: 'domain',
  Team: 'group',
  Project: 'folder_open',
  Priority: 'flag',
  Status: 'checklist',
  Ticket: 'confirmation_number',
  Dashboard: 'dashboard',
  Role: 'admin_panel_settings',
  System: 'settings',
};

export const AdminRolesPermissions: React.FC = () => {
  // View mode switcher: 'admin' (Matrix) or 'user' (My Permissions)
  const [viewMode, setViewMode] = useState<'admin' | 'user'>('admin');

  // Queries
  const {
    data: roles = [],
    isLoading: rolesLoading,
    isFetching: rolesFetching,
    refetch: refetchRoles,
  } = useRolesQuery();

  const {
    data: permissions = [],
    isLoading: permissionsLoading,
    refetch: refetchPermissions,
  } = usePermissionsQuery();

  // Mutations
  const createRoleMutation = useCreateRoleMutation();
  const updateRoleMutation = useUpdateRoleMutation();
  const updatePermissionsMutation = useUpdateRolePermissionsMutation();
  const archiveRoleMutation = useArchiveRoleMutation();
  const restoreRoleMutation = useRestoreRoleMutation();
  const deleteRoleMutation = useDeleteRoleMutation();

  // Selected Role State (default to first role, e.g. ADMIN)
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);

  // Auto-select first role when list loads
  useEffect(() => {
    if (roles.length > 0 && selectedRoleId === null) {
      setSelectedRoleId(roles[0].id);
    }
  }, [roles, selectedRoleId]);

  const {
    data: roleDetail,
    isLoading: roleDetailLoading,
    refetch: refetchRoleDetail,
  } = useRoleDetailsQuery(selectedRoleId);

  // Search filter and status filter for left role selector
  const [roleSearchQuery, setRoleSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Local state for Permission Matrix: Record<permissionId, PermissionScope>
  const [selectedGrants, setSelectedGrants] = useState<Record<number, PermissionScope>>({});
  const [isDirty, setIsDirty] = useState(false);

  // Sync server role permissions into local state whenever selected role changes
  useEffect(() => {
    if (roleDetail && roleDetail.rolePermissions) {
      const grants: Record<number, PermissionScope> = {};
      roleDetail.rolePermissions.forEach((rp) => {
        // If multiple entries exist, keep GLOBAL if present, or first scope
        if (!grants[rp.permissionId] || rp.scope === 'GLOBAL') {
          grants[rp.permissionId] = (rp.scope as PermissionScope) || 'GLOBAL';
        }
      });
      setSelectedGrants(grants);
      setIsDirty(false);
    }
  }, [roleDetail]);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

  // Bottom Toast Notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Status counts
  const activeRolesCount = useMemo(() => roles.filter((r) => r.status === 'ACTIVE').length, [roles]);
  const archivedRolesCount = useMemo(() => roles.filter((r) => r.status === 'INACTIVE').length, [roles]);

  // Group permissions by category
  const categorizedPermissions = useMemo(() => {
    const map: Record<string, PermissionItem[]> = {};
    for (const p of permissions) {
      const cat = p.category || 'General';
      if (!map[cat]) map[cat] = [];
      map[cat].push(p);
    }
    return map;
  }, [permissions]);

  // Filtered roles in left panel
  const filteredRoles = useMemo(() => {
    return roles.filter((r) => {
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      const matchesSearch =
        r.name.toLowerCase().includes(roleSearchQuery.toLowerCase()) ||
        (r.description && r.description.toLowerCase().includes(roleSearchQuery.toLowerCase()));
      return matchesSearch;
    });
  }, [roles, roleSearchQuery, statusFilter]);

  // Current selected role object
  const currentRole = useMemo(() => {
    return roles.find((r) => r.id === selectedRoleId) || null;
  }, [roles, selectedRoleId]);

  // Checkbox toggle handler for single permission
  const handleTogglePermission = (permissionId: number, permKey: string) => {
    const allowedScopes = PERMISSION_ALLOWED_SCOPES[permKey] || ['GLOBAL'];
    setSelectedGrants((prev) => {
      const next = { ...prev };
      if (next[permissionId]) {
        delete next[permissionId];
      } else {
        const defaultScope = allowedScopes.includes('OWN')
          ? 'OWN'
          : allowedScopes[allowedScopes.length - 1] || 'GLOBAL';
        next[permissionId] = defaultScope;
      }
      return next;
    });
    setIsDirty(true);
  };

  // Scope change dropdown handler
  const handleScopeChange = (permissionId: number, scope: PermissionScope) => {
    setSelectedGrants((prev) => ({
      ...prev,
      [permissionId]: scope,
    }));
    setIsDirty(true);
  };

  // Category Bulk Toggle
  const handleToggleCategory = (items: PermissionItem[]) => {
    const allEnabled = items.every((p) => Boolean(selectedGrants[p.id]));
    setSelectedGrants((prev) => {
      const next = { ...prev };
      if (allEnabled) {
        items.forEach((p) => delete next[p.id]);
      } else {
        items.forEach((p) => {
          if (!next[p.id]) {
            const allowedScopes = PERMISSION_ALLOWED_SCOPES[p.key] || ['GLOBAL'];
            next[p.id] = allowedScopes.includes('OWN')
              ? 'OWN'
              : allowedScopes[allowedScopes.length - 1] || 'GLOBAL';
          }
        });
      }
      return next;
    });
    setIsDirty(true);
  };

  // Discard changes
  const handleDiscard = () => {
    if (roleDetail && roleDetail.rolePermissions) {
      const grants: Record<number, PermissionScope> = {};
      roleDetail.rolePermissions.forEach((rp) => {
        if (!grants[rp.permissionId] || rp.scope === 'GLOBAL') {
          grants[rp.permissionId] = (rp.scope as PermissionScope) || 'GLOBAL';
        }
      });
      setSelectedGrants(grants);
      setIsDirty(false);
      showToast('Modifications discarded. Reverted to saved matrix.');
    }
  };

  // Save matrix changes
  const handleSaveChanges = async () => {
    if (!selectedRoleId) return;

    try {
      const payloadPermissions: Array<{ permissionId: number; scope: PermissionScope }> = [];
      Object.entries(selectedGrants).forEach(([pIdStr, scope]) => {
        const permissionId = parseInt(pIdStr, 10);
        if (!isNaN(permissionId) && scope) {
          payloadPermissions.push({ permissionId, scope });
        }
      });

      await updatePermissionsMutation.mutateAsync({
        id: selectedRoleId,
        data: { permissions: payloadPermissions },
      });

      setIsDirty(false);
      showToast('Permission matrix changes saved successfully.');
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to save permission matrix');
    }
  };

  // Role creation handler
  const handleCreateRole = async (data: {
    name: string;
    description?: string;
    cloneFromRoleId?: number;
  }) => {
    const newRole = await createRoleMutation.mutateAsync(data);
    setSelectedRoleId(newRole.id);
    showToast(`Role "${newRole.name}" created successfully.`);
  };

  // Role metadata update handler
  const handleUpdateRole = async (data: {
    name?: string;
    description?: string;
    status?: 'ACTIVE' | 'INACTIVE';
  }) => {
    if (!selectedRoleId) return;
    const updated = await updateRoleMutation.mutateAsync({
      id: selectedRoleId,
      data,
    });
    showToast(`Role "${updated.name}" updated successfully.`);
  };

  // Role archive handler
  const handleArchiveRole = async (id: number) => {
    await archiveRoleMutation.mutateAsync(id);
    showToast('Role archived successfully.');
  };

  // Role restore handler
  const handleRestoreRole = async (id: number) => {
    await restoreRoleMutation.mutateAsync(id);
    showToast('Role restored to active status successfully.');
  };

  // Role delete handler
  const handleDeleteRole = async (id: number) => {
    await deleteRoleMutation.mutateAsync(id);
    showToast('Role and associated permissions deleted successfully.');
    // Pick another role
    const remaining = roles.filter((r) => r.id !== id);
    if (remaining.length > 0) {
      setSelectedRoleId(remaining[0].id);
    } else {
      setSelectedRoleId(null);
    }
  };

  // Refresh handler
  const handleRefresh = async () => {
    await Promise.all([refetchRoles(), refetchPermissions(), refetchRoleDetail()]);
    showToast('Roles and permissions refreshed.');
  };

  const getRoleIcon = (name: string) => {
    switch (name.toUpperCase()) {
      case 'ADMIN': return 'shield';
      case 'USER': return 'person';
      default: return 'badge';
    }
  };

  const isRoleSystem = (role: RoleItem | null) => {
    if (!role) return false;
    return role.isSystem || ['ADMIN', 'USER'].includes(role.name.toUpperCase());
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto px-4 py-6">
        {/* Top Header & View Mode Switcher */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
              Roles & Permissions
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl shadow-inner border border-gray-200">
              <button
                type="button"
                onClick={() => setViewMode('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'admin'
                    ? 'bg-white text-[#1F3864] shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  tune
                </span>
                <span>Role Matrix</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('user')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'user'
                    ? 'bg-white text-[#1F3864] shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  verified_user
                </span>
                <span>My Permissions</span>
              </button>
            </div>

            {/* How to Use Guide Button */}
            <button
              type="button"
              onClick={() => setIsGuideModalOpen(true)}
              className="h-8 px-3.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-xs active:scale-[0.98]"
              title="View instructions on how to use roles and permissions"
            >
              <span className="material-symbols-outlined text-[17px] text-white">
                help_outline
              </span>
              <span>How to Use</span>
            </button>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={rolesFetching}
              className="h-8 px-3.5 bg-white hover:bg-gray-50 border border-[#E2E8F0] text-[#1F3864] text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-xs active:scale-[0.98] disabled:opacity-50"
              title="Refresh roles and permissions"
            >
              <span
                className={`material-symbols-outlined text-[17px] text-[#1F3864] ${
                  rolesFetching ? 'animate-spin' : ''
                }`}
              >
                refresh
              </span>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* View Mode Conditional Rendering */}
        {viewMode === 'user' ? (
          <MyPermissionsView onOpenGuide={() => setIsGuideModalOpen(true)} />
        ) : (
          /* ========================================================================= */
          /* ADMIN VIEW: TWO-COLUMN ROLE MATRIX */
          /* ========================================================================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
            {/* LEFT PANEL: Role Selector & System Roles */}
            <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-4">
              {/* Role List Container Card */}
              <div className="bg-white rounded-xl p-4 shadow-xs border border-[#E2E8F0] flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-sm text-[#0F172A]">
                      System Roles
                    </h2>
                    <p className="text-xs text-gray-500">
                      {roles.length} defined privilege levels
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(true)}
                    className="h-8 px-3 bg-[#1F3864] hover:bg-[#284980] text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-all shadow-xs active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      add
                    </span>
                    <span>New Role</span>
                  </button>
                </div>

                {/* Search & Status Filter Tabs */}
                <div className="flex flex-col gap-2">
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
                      search
                    </span>
                    <input
                      type="text"
                      value={roleSearchQuery}
                      onChange={(e) => setRoleSearchQuery(e.target.value)}
                      placeholder="Search roles..."
                      className="w-full h-8 pl-8 pr-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#1E88E5] focus:bg-white transition-all"
                    />
                  </div>

                  {/* Status Tabs */}
                  <div className="flex items-center gap-1 p-1 bg-[#F1F5F9] rounded-lg text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setStatusFilter('ALL')}
                      className={`flex-1 py-1 rounded-md transition-all ${
                        statusFilter === 'ALL'
                          ? 'bg-white text-[#1F3864] shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      All ({roles.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('ACTIVE')}
                      className={`flex-1 py-1 rounded-md transition-all ${
                        statusFilter === 'ACTIVE'
                          ? 'bg-white text-[#1F3864] shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Active ({activeRolesCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('INACTIVE')}
                      className={`flex-1 py-1 rounded-md transition-all ${
                        statusFilter === 'INACTIVE'
                          ? 'bg-white text-amber-800 shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Archived ({archivedRolesCount})
                    </button>
                  </div>
                </div>

                {/* Role Cards List */}
                <div className="space-y-2 max-h-[calc(100vh-340px)] overflow-y-auto pr-1">
                  {rolesLoading ? (
                    <div className="p-6 flex flex-col items-center justify-center gap-2 text-gray-400">
                      <div className="w-6 h-6 border-2 border-[#1F3864]/20 border-t-[#1F3864] rounded-full animate-spin" />
                      <span className="text-xs">Loading roles...</span>
                    </div>
                  ) : filteredRoles.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-400">
                      No matching roles found.
                    </div>
                  ) : (
                    filteredRoles.map((role) => {
                      const isSelected = role.id === selectedRoleId;
                      const isSystem = isRoleSystem(role);
                      const isArchived = role.status === 'INACTIVE';

                      return (
                        <div
                          key={role.id}
                          onClick={() => setSelectedRoleId(role.id)}
                          className={`cursor-pointer p-3 rounded-xl transition-all border flex flex-col gap-1.5 ${
                            isSelected
                              ? 'bg-[#F0F4FA] border-[#1E88E5]/40 shadow-xs ring-1 ring-[#1E88E5]/20'
                              : isArchived
                              ? 'bg-amber-50/30 border-amber-200/50 hover:bg-amber-50/60'
                              : 'bg-white border-[#E2E8F0] hover:bg-[#F8FAFC] hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className={`material-symbols-outlined text-[20px] ${
                                  isSelected
                                    ? 'text-[#1E88E5]'
                                    : isArchived
                                    ? 'text-amber-600'
                                    : 'text-gray-500'
                                }`}
                              >
                                {getRoleIcon(role.name)}
                              </span>
                              <span
                                className={`font-semibold text-xs ${
                                  isSelected
                                    ? 'text-[#1F3864]'
                                    : isArchived
                                    ? 'text-amber-900'
                                    : 'text-[#0F172A]'
                                }`}
                              >
                                {role.name}
                              </span>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                isSystem
                                  ? 'bg-blue-100 text-blue-800'
                                  : isArchived
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {isSystem ? 'System' : isArchived ? 'Archived' : 'Active'}
                            </span>
                          </div>

                          <p className="text-[11px] text-gray-500 line-clamp-1">
                            {role.description || 'No description provided'}
                          </p>

                          <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-gray-100">
                            <div className="flex items-center gap-1.5 text-gray-500 text-[11px]">
                              <span className="material-symbols-outlined text-[14px]">
                                group
                              </span>
                              <span>{role.userCount} Users</span>
                            </div>
                            <span
                              className={`material-symbols-outlined text-[16px] ${
                                isSelected ? 'text-[#1E88E5]' : 'text-gray-400'
                              }`}
                            >
                              chevron_right
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* System Summary Card */}
              <div className="bg-white rounded-xl p-4 shadow-xs border border-[#E2E8F0] flex flex-col gap-3">
                <div className="flex items-center gap-2 text-[#1F3864] font-semibold text-xs">
                  <span className="material-symbols-outlined text-[18px]">
                    shield_lock
                  </span>
                  <span>Permission Governance</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 rounded-lg flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-gray-400">
                      Total Roles
                    </span>
                    <span className="text-base font-bold text-[#1F3864]">
                      {roles.length}
                    </span>
                  </div>
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 rounded-lg flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-gray-400">
                      Permissions
                    </span>
                    <span className="text-base font-bold text-[#1E88E5]">
                      {permissions.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT PANEL: Matrix Grid & Scope Granularity */}
            <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-4">
              {currentRole ? (
                <>
                  {/* Selected Role Hero Banner */}
                  <div className="bg-white rounded-xl p-5 shadow-xs border border-[#E2E8F0] flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-[#1F3864] text-white flex items-center justify-center shrink-0 shadow-xs">
                        <span className="material-symbols-outlined text-[24px]">
                          {getRoleIcon(currentRole.name)}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h2 className="text-lg font-bold text-[#0F172A]">
                            {currentRole.name}
                          </h2>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              isRoleSystem(currentRole)
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : currentRole.status === 'INACTIVE'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {isRoleSystem(currentRole)
                              ? 'System Default Role'
                              : currentRole.status === 'INACTIVE'
                              ? 'Archived Role (Inactive)'
                              : 'Active Custom Role'}
                          </span>
                        </div>

                        {/* Action Buttons Toolbar with Purpose-Driven Formats */}
                        <div className="flex items-center gap-2 flex-wrap pt-0.5">
                          <button
                            type="button"
                            onClick={() => setIsEditModalOpen(true)}
                            className="h-8 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs active:scale-[0.98]"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              edit
                            </span>
                            <span>Edit Metadata</span>
                          </button>

                          {!isRoleSystem(currentRole) && (
                            <>
                              {currentRole.status === 'ACTIVE' ? (
                                <button
                                  type="button"
                                  onClick={() => setIsArchiveModalOpen(true)}
                                  className="h-8 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs active:scale-[0.98]"
                                  title="Archive this custom role"
                                >
                                  <span className="material-symbols-outlined text-[16px]">
                                    archive
                                  </span>
                                  <span>Archive</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleRestoreRole(currentRole.id)}
                                  disabled={restoreRoleMutation.isPending}
                                  className="h-8 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs active:scale-[0.98] disabled:opacity-50"
                                  title="Restore this role to active status"
                                >
                                  <span className="material-symbols-outlined text-[16px]">
                                    unarchive
                                  </span>
                                  <span>
                                    {restoreRoleMutation.isPending ? 'Restoring...' : 'Restore'}
                                  </span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => setIsDeleteModalOpen(true)}
                                className="h-8 px-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs active:scale-[0.98]"
                              >
                                <span className="material-symbols-outlined text-[16px]">
                                  delete
                                </span>
                                <span>Delete</span>
                              </button>
                            </>
                          )}
                        </div>

                        {currentRole.description && (
                          <p className="text-xs text-gray-500 mt-1 max-w-2xl leading-relaxed">
                            {currentRole.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Controls (Discard & Save Changes) */}
                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      {isDirty && (
                        <span className="text-[11px] font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-200 animate-pulse">
                          Unsaved Changes
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={handleDiscard}
                        disabled={!isDirty}
                        className="h-8 px-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-40 active:scale-[0.98]"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          undo
                        </span>
                        <span>Discard</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveChanges}
                        disabled={!isDirty || updatePermissionsMutation.isPending}
                        className="h-8 px-4 bg-[#1F3864] hover:bg-[#152747] text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-40 active:scale-[0.98]"
                      >
                        {updatePermissionsMutation.isPending ? (
                          <>
                            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[16px]">
                              save
                            </span>
                            <span>Save Changes</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Archived Warning Banner if Role is Inactive */}
                  {currentRole.status === 'INACTIVE' && (
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-xs animate-in fade-in duration-200">
                      <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-amber-600 text-[22px] shrink-0">
                          inventory_2
                        </span>
                        <span>
                          <strong>This role is currently archived (INACTIVE).</strong> New users cannot be assigned to this role until it is restored.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRestoreRole(currentRole.id)}
                        disabled={restoreRoleMutation.isPending}
                        className="h-8 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-all shrink-0 active:scale-[0.98] shadow-xs disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          unarchive
                        </span>
                        <span>
                          {restoreRoleMutation.isPending ? 'Restoring...' : 'Restore Role'}
                        </span>
                      </button>
                    </div>
                  )}

                  {/* Scope Legend & Fixed Column Header Container */}
                  <div className="bg-white rounded-xl shadow-xs border border-[#E2E8F0] overflow-hidden flex flex-col">
                    <div className="shrink-0 bg-white">
                      {/* Scope Legend Bar */}
                      <div className="bg-[#F8FAFC] px-5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs border-b border-[#E2E8F0]">
                        <div className="flex items-center gap-2 text-gray-600">
                          <span className="material-symbols-outlined text-[16px] text-[#1E88E5]">
                            info
                          </span>
                          <span className="font-medium text-[11px]">
                            Scope Granularity: Global grants tenant-wide access. Scoped options restrict access to assigned or created records.
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-[11px] text-gray-500 font-medium">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#1F3864]" /> Global (Org-wide)
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#1E88E5]" /> Dept / Team
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-slate-500" /> Assigned / Own
                          </span>
                        </div>
                      </div>

                      {/* Fixed Table Column Header Row */}
                      <div className="grid grid-cols-12 px-5 py-2.5 bg-[#F1F5F9] text-[#334155] text-[11px] font-bold uppercase tracking-wider items-center border-b border-[#E2E8F0]">
                        <div className="col-span-7 sm:col-span-8">Capability & Description</div>
                        <div className="col-span-5 sm:col-span-4 text-right">Scope Configuration</div>
                      </div>
                    </div>

                    {/* Scrollable Category Sections & Capability Rows */}
                    <div className="divide-y divide-[#E2E8F0] max-h-[calc(100vh-320px)] min-h-[420px] overflow-y-auto">
                      {permissionsLoading || roleDetailLoading ? (
                        <div className="p-12 flex flex-col items-center justify-center gap-2 text-gray-400">
                          <div className="w-6 h-6 border-2 border-[#1F3864]/20 border-t-[#1F3864] rounded-full animate-spin" />
                          <span className="text-xs">Loading capability matrix...</span>
                        </div>
                      ) : (
                        Object.entries(categorizedPermissions).map(([category, items]) => {
                          const categoryGrantsCount = items.reduce((acc, p) => {
                            return selectedGrants[p.id] ? acc + 1 : acc;
                          }, 0);
                          const allCategoryEnabled = items.length > 0 && categoryGrantsCount === items.length;

                          return (
                            <div key={category} className="flex flex-col">
                              {/* Sticky Category Header Row */}
                              <div className="bg-[#F8FAFC] px-5 py-2 flex items-center justify-between border-b border-[#E2E8F0] sticky top-0 z-10 shadow-xs">
                                <div className="flex items-center gap-2">
                                  <span className="material-symbols-outlined text-[18px] text-[#1F3864]">
                                    {CATEGORY_ICONS[category] || 'tune'}
                                  </span>
                                  <span className="font-bold text-xs text-[#1F3864] uppercase tracking-wide">
                                    {category} Management
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleCategory(items)}
                                    className="text-[11px] text-[#1E88E5] hover:text-[#1565C0] font-medium hover:underline cursor-pointer"
                                  >
                                    {allCategoryEnabled ? 'Revoke All' : 'Grant All'}
                                  </button>
                                  <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                    {categoryGrantsCount} / {items.length} Enabled
                                  </span>
                                </div>
                              </div>

                              {/* Permission Rows */}
                              {items.map((perm) => {
                                const isEnabled = Boolean(selectedGrants[perm.id]);
                                const currentScope = selectedGrants[perm.id] || 'GLOBAL';
                                const allowedScopes: PermissionScope[] =
                                  PERMISSION_ALLOWED_SCOPES[perm.key] || ['GLOBAL'];
                                const isSingleGlobal =
                                  allowedScopes.length === 1 && allowedScopes[0] === 'GLOBAL';

                                return (
                                  <div
                                    key={perm.id}
                                    className={`grid grid-cols-12 px-5 py-3 items-center hover:bg-[#F8FAFC] transition-colors border-b border-[#F1F5F9] last:border-b-0 ${
                                      isEnabled ? 'bg-white' : 'bg-gray-50/40'
                                    }`}
                                  >
                                    {/* Checkbox + Title & Description */}
                                    <div className="col-span-7 sm:col-span-8 pr-3 flex items-start gap-3">
                                      <input
                                        type="checkbox"
                                        checked={isEnabled}
                                        onChange={() => handleTogglePermission(perm.id, perm.key)}
                                        className="w-4 h-4 mt-0.5 accent-[#1F3864] rounded cursor-pointer transition-transform active:scale-95 shrink-0"
                                        title={`Toggle ${perm.key}`}
                                      />
                                      <div>
                                        <span
                                          onClick={() => handleTogglePermission(perm.id, perm.key)}
                                          className={`font-semibold text-xs cursor-pointer hover:underline ${
                                            isEnabled ? 'text-[#0F172A]' : 'text-gray-500'
                                          }`}
                                        >
                                          {perm.key.replace(/_/g, ' ')}
                                        </span>
                                        <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">
                                          {perm.description}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Scope Configuration */}
                                    <div className="col-span-5 sm:col-span-4 flex items-center justify-end">
                                      {!isEnabled ? (
                                        <span className="text-[11px] text-gray-400 italic">
                                          Disabled
                                        </span>
                                      ) : isSingleGlobal ? (
                                        <span
                                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-gray-100 text-gray-700 border border-gray-200 shadow-2xs"
                                          title="This permission only supports Global scope across the entire organization"
                                        >
                                          <span className="material-symbols-outlined text-[13px] text-gray-500">
                                            lock
                                          </span>
                                          <span>Global (Locked)</span>
                                        </span>
                                      ) : (
                                        <SelectDropdown<PermissionScope>
                                          value={currentScope}
                                          onChange={(val) => handleScopeChange(perm.id, val)}
                                          options={allowedScopes.map((scope) => ({
                                            value: scope,
                                            label: SCOPE_LABELS[scope] || scope,
                                            dotColor:
                                              scope === 'GLOBAL'
                                                ? 'bg-[#1F3864]'
                                                : scope === 'DEPARTMENT'
                                                ? 'bg-[#1E88E5]'
                                                : scope === 'TEAM'
                                                ? 'bg-purple-600'
                                                : 'bg-emerald-600',
                                          }))}
                                          size="sm"
                                          className="w-48"
                                          triggerClassName="!h-8 !py-1 !px-2.5 !text-xs !font-semibold !rounded-lg !border-gray-200 hover:!border-gray-300 shadow-2xs"
                                        />
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-xl p-12 shadow-xs border border-[#E2E8F0] text-center text-gray-400">
                  Select a role from the left panel to configure its permissions.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateRoleModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateRole}
        existingRoles={roles}
        isLoading={createRoleMutation.isPending}
      />

      <EditRoleModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        role={currentRole}
        onSubmit={handleUpdateRole}
        isLoading={updateRoleMutation.isPending}
      />

      <ArchiveRoleModal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        role={currentRole}
        onConfirm={handleArchiveRole}
        isLoading={archiveRoleMutation.isPending}
      />

      <DeleteRoleModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        role={currentRole}
        onConfirm={handleDeleteRole}
        isLoading={deleteRoleMutation.isPending}
      />

      <RolesGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />

      {/* Interactive Bottom Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1F3864] text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 animate-in slide-in-from-bottom duration-200">
          <span className="material-symbols-outlined text-[20px] text-emerald-400">
            check_circle
          </span>
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}
    </AppLayout>
  );
};

export default AdminRolesPermissions;
