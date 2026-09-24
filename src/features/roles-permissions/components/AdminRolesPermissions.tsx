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

const SCOPE_LABELS: Record<PermissionScope, string> = {
  GLOBAL: 'Global (Org-wide)',
  DEPARTMENT: 'Department Only',
  TEAM: 'Team Only',
  ASSIGNED: 'Assigned Only',
  OWN: 'Own / Created / Assigned',
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
  'Priority & Status': 'tune',
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

  // Search filter and status filter for roles bar
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
        const allowed = PERMISSION_ALLOWED_SCOPES[rp.permissionKey || ''] || ['GLOBAL'];
        const isSingleGlobal = allowed.length === 1 && allowed[0] === 'GLOBAL';
        const effectiveScope = isSingleGlobal ? 'GLOBAL' : ((rp.scope as PermissionScope) || 'GLOBAL');
        if (!grants[rp.permissionId] || effectiveScope === 'GLOBAL') {
          grants[rp.permissionId] = effectiveScope;
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
      if (p.key === 'PRIORITY_MANAGE') continue; // Hide legacy catch-all from active checklist

      let cat = p.category || 'General';
      if (cat === 'Priority' || cat === 'Status') {
        cat = 'Priority & Status';
      }
      if (!map[cat]) map[cat] = [];
      map[cat].push(p);
    }

    if (map['Priority & Status']) {
      const order = [
        'PRIORITY_CREATE',
        'PRIORITY_UPDATE',
        'PRIORITY_RETIRE',
        'STATUS_CREATE',
        'STATUS_UPDATE',
        'STATUS_RETIRE',
      ];
      map['Priority & Status'].sort((a, b) => {
        const idxA = order.indexOf(a.key);
        const idxB = order.indexOf(b.key);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.key.localeCompare(b.key);
      });
    }

    return map;
  }, [permissions]);

  // Filtered roles in top selector bar
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
        const defaultScope =
          permKey === 'USER_VIEW'
            ? 'GLOBAL'
            : allowedScopes.includes('OWN')
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
            const defaultScope =
              p.key === 'USER_VIEW'
                ? 'GLOBAL'
                : allowedScopes.includes('OWN')
                ? 'OWN'
                : allowedScopes[allowedScopes.length - 1] || 'GLOBAL';
            next[p.id] = defaultScope;
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
        const allowed = PERMISSION_ALLOWED_SCOPES[rp.permissionKey || ''] || ['GLOBAL'];
        const isSingleGlobal = allowed.length === 1 && allowed[0] === 'GLOBAL';
        const effectiveScope = isSingleGlobal ? 'GLOBAL' : ((rp.scope as PermissionScope) || 'GLOBAL');
        if (!grants[rp.permissionId] || effectiveScope === 'GLOBAL') {
          grants[rp.permissionId] = effectiveScope;
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
      showToast('Permission matrix saved successfully.');
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
    showToast('Role deleted successfully.');
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
      <div className="flex flex-col gap-5 w-full max-w-7xl mx-auto px-3 sm:px-6 py-5">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
              Roles & Permissions
            </h1>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 shadow-inner">
              <button
                type="button"
                onClick={() => setViewMode('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'admin'
                    ? 'bg-white text-[#1F3864] shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">tune</span>
                <span>Role Matrix</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('user')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'user'
                    ? 'bg-white text-[#1F3864] shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">verified_user</span>
                <span>My Permissions</span>
              </button>
            </div>

            {/* Guide Button */}
            <button
              type="button"
              onClick={() => setIsGuideModalOpen(true)}
              className="h-9 px-3.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs active:scale-[0.98] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[17px]">help_outline</span>
              <span>Guide</span>
            </button>

            {/* Create New Role Button */}
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="h-9 px-4 bg-[#1F3864] hover:bg-[#152747] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs active:scale-[0.98] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[17px]">add</span>
              <span>New Role</span>
            </button>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={rolesFetching}
              className="h-9 px-3 bg-white hover:bg-gray-50 border border-[#E2E8F0] text-[#1F3864] text-xs font-bold rounded-xl flex items-center gap-1 transition-all shadow-xs active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              title="Refresh roles"
            >
              <span className={`material-symbols-outlined text-[17px] ${rolesFetching ? 'animate-spin' : ''}`}>
                refresh
              </span>
            </button>
          </div>
        </div>

        {/* Conditional View Rendering */}
        {viewMode === 'user' ? (
          <MyPermissionsView onOpenGuide={() => setIsGuideModalOpen(true)} />
        ) : (
          <div className="flex flex-col gap-5 w-full">
            {/* ========================================================================= */}
            {/* 1. HORIZONTAL ROLES SELECTOR BAR */}
            {/* ========================================================================= */}
            <div className="bg-white rounded-2xl p-4 shadow-xs border border-[#E2E8F0] flex flex-col gap-3.5">
              {/* Filter Controls Row */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs uppercase tracking-wider text-[#1F3864]">
                    Select Role:
                  </span>
                  <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-full">
                    {roles.length} Roles Defined
                  </span>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* Search Input */}
                  <div className="relative w-full sm:w-56">
                    <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[16px]">
                      search
                    </span>
                    <input
                      type="text"
                      value={roleSearchQuery}
                      onChange={(e) => setRoleSearchQuery(e.target.value)}
                      placeholder="Search roles..."
                      className="w-full h-8 pl-8 pr-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] placeholder:text-gray-400 focus:outline-none focus:border-[#1F3864] transition-all"
                    />
                  </div>

                  {/* Status Filter Tabs */}
                  <div className="flex items-center gap-1 p-1 bg-[#F1F5F9] rounded-lg text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setStatusFilter('ALL')}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        statusFilter === 'ALL'
                          ? 'bg-white text-[#1F3864] shadow-xs'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      All ({roles.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('ACTIVE')}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        statusFilter === 'ACTIVE'
                          ? 'bg-white text-emerald-800 shadow-xs'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      Active ({activeRolesCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('INACTIVE')}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        statusFilter === 'INACTIVE'
                          ? 'bg-white text-amber-800 shadow-xs'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      Archived ({archivedRolesCount})
                    </button>
                  </div>
                </div>
              </div>

              {/* Horizontal Scrollable Role Cards Strip */}
              <div className="flex items-center gap-3 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin">
                {rolesLoading ? (
                  <div className="py-4 px-6 flex items-center gap-2 text-gray-400 text-xs">
                    <div className="w-4 h-4 border-2 border-[#1F3864]/20 border-t-[#1F3864] rounded-full animate-spin" />
                    <span>Loading roles...</span>
                  </div>
                ) : filteredRoles.length === 0 ? (
                  <div className="py-4 text-xs text-gray-400">No matching roles found.</div>
                ) : (
                  filteredRoles.map((role) => {
                    const isSelected = role.id === selectedRoleId;
                    const isSystem = isRoleSystem(role);
                    const isArchived = role.status === 'INACTIVE';

                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => setSelectedRoleId(role.id)}
                        className={`group shrink-0 px-4 py-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                          isSelected
                            ? 'bg-[#1F3864] text-white border-[#1F3864] shadow-sm ring-2 ring-[#1F3864]/20'
                            : isArchived
                            ? 'bg-amber-50/40 border-amber-200 hover:bg-amber-50 text-gray-800'
                            : 'bg-white border-[#E2E8F0] hover:bg-[#F8FAFC] hover:border-gray-300 text-gray-800'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-white/15 text-white'
                              : isArchived
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-50 text-[#1F3864]'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {getRoleIcon(role.name)}
                          </span>
                        </div>

                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-bold tracking-tight ${
                                isSelected ? 'text-white' : 'text-[#0F172A]'
                              }`}
                            >
                              {role.name}
                            </span>
                            <span
                              className={`px-1.5 py-0.2 text-[9px] font-extrabold uppercase rounded ${
                                isSelected
                                  ? 'bg-white/20 text-white'
                                  : isSystem
                                  ? 'bg-blue-100 text-blue-800'
                                  : isArchived
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {isSystem ? 'System' : isArchived ? 'Archived' : 'Active'}
                            </span>
                          </div>
                          <span
                            className={`text-[11px] font-medium mt-0.5 ${
                              isSelected ? 'text-white/80' : 'text-gray-500'
                            }`}
                          >
                            {role.userCount} {role.userCount === 1 ? 'User' : 'Users'}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 2. SELECTED ROLE HEADER & ACTION BAR */}
            {/* ========================================================================= */}
            {currentRole ? (
              <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-[#E2E8F0] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-[#1F3864] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <span className="material-symbols-outlined text-[24px]">
                      {getRoleIcon(currentRole.name)}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="text-lg font-bold text-[#0F172A]">
                        {currentRole.name}
                      </h2>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          isRoleSystem(currentRole)
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : currentRole.status === 'INACTIVE'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {isRoleSystem(currentRole)
                          ? 'System Default Role'
                          : currentRole.status === 'INACTIVE'
                          ? 'Archived Role'
                          : 'Active Custom Role'}
                      </span>
                    </div>

                    {/* Quick Role Actions */}
                    <div className="flex items-center gap-2 flex-wrap pt-0.5">
                      <button
                        type="button"
                        onClick={() => setIsEditModalOpen(true)}
                        className="h-7 px-2.5 bg-gray-100 hover:bg-gray-200 text-[#1F3864] rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">edit</span>
                        <span>Edit Details</span>
                      </button>

                      {!isRoleSystem(currentRole) && (
                        <>
                          {currentRole.status === 'ACTIVE' ? (
                            <button
                              type="button"
                              onClick={() => setIsArchiveModalOpen(true)}
                              className="h-7 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[14px]">archive</span>
                              <span>Archive</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleRestoreRole(currentRole.id)}
                              disabled={restoreRoleMutation.isPending}
                              className="h-7 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                            >
                              <span className="material-symbols-outlined text-[14px]">unarchive</span>
                              <span>{restoreRoleMutation.isPending ? 'Restoring...' : 'Restore'}</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setIsDeleteModalOpen(true)}
                            className="h-7 px-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[14px]">delete</span>
                            <span>Delete</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Action Controls: Discard & Save */}
                <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
                  {isDirty && (
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 animate-pulse">
                      Unsaved Changes
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleDiscard}
                    disabled={!isDirty}
                    className="h-9 px-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">undo</span>
                    <span>Discard</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveChanges}
                    disabled={!isDirty || updatePermissionsMutation.isPending}
                    className="h-9 px-4 bg-[#1F3864] hover:bg-[#152747] text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer active:scale-[0.98]"
                  >
                    {updatePermissionsMutation.isPending ? (
                      <>
                        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px]">save</span>
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : null}

            {/* ========================================================================= */}
            {/* 3. FULL-WIDTH CAPABILITY & DESCRIPTION PERMISSION MATRIX */}
            {/* ========================================================================= */}
            {currentRole ? (
              <div className="bg-white rounded-2xl shadow-xs border border-[#E2E8F0] overflow-hidden flex flex-col w-full">
                {/* Fixed Column Header Row */}
                <div className="hidden sm:grid grid-cols-12 px-6 py-3 bg-[#F8FAFC] text-[#334155] text-xs font-bold uppercase tracking-wider items-center border-b border-[#E2E8F0] shrink-0">
                  <div className="col-span-8 sm:col-span-8 font-bold">CAPABILITY & DESCRIPTION</div>
                  <div className="col-span-4 sm:col-span-4 text-right font-bold">SCOPE LEVEL</div>
                </div>

                {/* Categorized Permissions List - Scrollable */}
                <div className="divide-y divide-[#E2E8F0] overflow-y-auto max-h-[calc(100vh-340px)] min-h-[380px]">
                  {permissionsLoading || roleDetailLoading ? (
                    <div className="p-12 flex flex-col items-center justify-center gap-2 text-gray-400">
                      <div className="w-6 h-6 border-2 border-[#1F3864]/20 border-t-[#1F3864] rounded-full animate-spin" />
                      <span className="text-xs font-semibold">Loading matrix...</span>
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
                          <div className="bg-[#F1F5F9] px-4 sm:px-6 py-2.5 flex items-center justify-between border-b border-[#E2E8F0] sticky top-0 z-10 shadow-2xs">
                            <div className="flex items-center gap-2.5">
                              <span className="material-symbols-outlined text-[19px] text-[#1F3864]">
                                {CATEGORY_ICONS[category] || 'tune'}
                              </span>
                              <span className="font-bold text-xs text-[#1F3864] uppercase tracking-wide">
                                {category} Operations
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => handleToggleCategory(items)}
                                className="text-xs text-[#1E88E5] hover:text-[#1565C0] font-bold hover:underline cursor-pointer"
                              >
                                {allCategoryEnabled ? 'Revoke All' : 'Grant All'}
                              </button>
                              <span className="text-[11px] font-bold text-gray-600 bg-white border border-gray-200 px-2.5 py-0.5 rounded-full shadow-2xs">
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
                                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-3.5 hover:bg-[#F8FAFC] transition-colors border-b border-[#F1F5F9] last:border-b-0 ${
                                  isEnabled ? 'bg-white' : 'bg-gray-50/40'
                                }`}
                              >
                                {/* Checkbox + Bold Title & Description */}
                                <div className="flex items-start gap-3.5 flex-1 min-w-0 pr-0 sm:pr-4">
                                  <input
                                    type="checkbox"
                                    checked={isEnabled}
                                    onChange={() => handleTogglePermission(perm.id, perm.key)}
                                    className="w-4 h-4 mt-0.5 accent-[#1F3864] rounded cursor-pointer transition-transform active:scale-95 shrink-0"
                                    title={`Toggle ${perm.key}`}
                                  />
                                  <div className="flex flex-col min-w-0">
                                    <span
                                      onClick={() => handleTogglePermission(perm.id, perm.key)}
                                      className={`font-bold text-xs tracking-tight cursor-pointer hover:underline ${
                                        isEnabled ? 'text-[#0F172A]' : 'text-gray-500'
                                      }`}
                                    >
                                      {perm.key.replace(/_/g, ' ')}
                                    </span>
                                    <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                                      {perm.description}
                                    </p>
                                  </div>
                                </div>

                                {/* Scope Configuration Dropdown / Badge */}
                                <div className="flex items-center justify-start sm:justify-end shrink-0 pl-7 sm:pl-0">
                                  {!isEnabled ? (
                                    <span className="text-xs font-semibold text-gray-400">
                                      Disabled
                                    </span>
                                  ) : isSingleGlobal ? (
                                    <span
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200 shadow-2xs"
                                    >
                                      <span className="material-symbols-outlined text-[14px] text-gray-500">
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
                                      className="w-48 sm:w-52"
                                      triggerClassName="!h-8.5 !py-1 !px-3 !text-xs !font-bold !rounded-lg !border-gray-200 hover:!border-gray-300 shadow-2xs"
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
            ) : (
              <div className="bg-white rounded-2xl p-12 shadow-xs border border-[#E2E8F0] text-center text-gray-400 font-semibold text-xs">
                Select a role from the top bar to configure its permissions.
              </div>
            )}
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

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1F3864] text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 animate-in slide-in-from-bottom duration-200">
          <span className="material-symbols-outlined text-[20px] text-emerald-400">
            check_circle
          </span>
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}
    </AppLayout>
  );
};

export default AdminRolesPermissions;
