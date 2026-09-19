import React, { useState, useMemo, useEffect } from 'react';
import { AppLayout } from '@/layout/AppLayout';
import {
  useRolesQuery,
  useRoleDetailsQuery,
  usePermissionsQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useUpdateRolePermissionsMutation,
  useDeleteRoleMutation,
} from '../api';
import { RoleItem, PermissionItem, PermissionScope } from '../types';
import CreateRoleModal from './CreateRoleModal';
import EditRoleModal from './EditRoleModal';
import DeleteRoleModal from './DeleteRoleModal';
import MyPermissionsView from './MyPermissionsView';

const SCOPES: PermissionScope[] = ['GLOBAL', 'DEPARTMENT', 'TEAM', 'ASSIGNED', 'OWN'];

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

  // Search filter for left role selector
  const [roleSearchQuery, setRoleSearchQuery] = useState('');

  // Local state for Permission Matrix checkboxes: Set of `${permissionId}_${scope}`
  const [activeGrants, setActiveGrants] = useState<Set<string>>(new Set());
  const [isDirty, setIsDirty] = useState(false);

  // Sync server role permissions into local state whenever selected role changes
  useEffect(() => {
    if (roleDetail && roleDetail.rolePermissions) {
      const grantSet = new Set<string>();
      roleDetail.rolePermissions.forEach((rp) => {
        if (rp.scope) {
          grantSet.add(`${rp.permissionId}_${rp.scope}`);
        } else {
          grantSet.add(`${rp.permissionId}_GLOBAL`);
        }
      });
      setActiveGrants(grantSet);
      setIsDirty(false);
    }
  }, [roleDetail]);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Bottom Toast Notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

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
    return roles.filter((r) =>
      r.name.toLowerCase().includes(roleSearchQuery.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(roleSearchQuery.toLowerCase()))
    );
  }, [roles, roleSearchQuery]);

  // Current selected role object
  const currentRole = useMemo(() => {
    return roles.find((r) => r.id === selectedRoleId) || null;
  }, [roles, selectedRoleId]);

  // Checkbox toggle handler
  const handleToggleScope = (permissionId: number, scope: PermissionScope) => {
    const key = `${permissionId}_${scope}`;
    setActiveGrants((prev) => {
      const next = new Set(prev);
      if (scope === 'GLOBAL') {
        if (next.has(key)) {
          // Unchecking GLOBAL
          next.delete(key);
        } else {
          // Checking GLOBAL: clear narrower scopes since GLOBAL covers all levels
          SCOPES.forEach((s) => next.delete(`${permissionId}_${s}`));
          next.add(key);
        }
      } else {
        // Checking or unchecking a narrower scope (DEPARTMENT, TEAM, ASSIGNED, OWN)
        if (next.has(key)) {
          next.delete(key);
        } else {
          // When a narrower scope is selected, remove GLOBAL
          next.delete(`${permissionId}_GLOBAL`);
          next.add(key);
        }
      }
      return next;
    });
    setIsDirty(true);
  };

  // Quick toggle all scopes for a permission
  const handleToggleAllScopesForPerm = (permissionId: number) => {
    const isGlobal = activeGrants.has(`${permissionId}_GLOBAL`);
    const hasAny = SCOPES.some((s) => activeGrants.has(`${permissionId}_${s}`));
    setActiveGrants((prev) => {
      const next = new Set(prev);
      if (hasAny) {
        SCOPES.forEach((s) => next.delete(`${permissionId}_${s}`));
      } else {
        next.add(`${permissionId}_GLOBAL`);
      }
      return next;
    });
    setIsDirty(true);
  };

  // Discard changes
  const handleDiscard = () => {
    if (roleDetail && roleDetail.rolePermissions) {
      const grantSet = new Set<string>();
      roleDetail.rolePermissions.forEach((rp) => {
        if (rp.scope) {
          grantSet.add(`${rp.permissionId}_${rp.scope}`);
        } else {
          grantSet.add(`${rp.permissionId}_GLOBAL`);
        }
      });
      setActiveGrants(grantSet);
      setIsDirty(false);
      showToast('Modifications discarded. Reverted to saved matrix.');
    }
  };

  // Save matrix changes
  const handleSaveChanges = async () => {
    if (!selectedRoleId) return;

    try {
      const payloadPermissions: Array<{ permissionId: number; scope: PermissionScope }> = [];
      activeGrants.forEach((grantKey) => {
        const [pIdStr, scopeStr] = grantKey.split('_');
        const permissionId = parseInt(pIdStr, 10);
        const scope = scopeStr as PermissionScope;
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

  // Role delete handler
  const handleDeleteRole = async (id: number) => {
    await deleteRoleMutation.mutateAsync(id);
    showToast('Role deleted successfully.');
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
            <div className="flex items-center gap-2 text-xs font-semibold text-[#1E88E5] uppercase tracking-wider mb-1">
              <span className="material-symbols-outlined text-[18px]">
                security
              </span>
              <span>Access Control & Security</span>
            </div>
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

            {/* Refresh Button */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={rolesFetching}
              className="h-9 px-3 rounded-lg border border-[#2B4C7E]/30 bg-[#2B4C7E]/10 hover:bg-[#2B4C7E]/20 text-[#1F3864] text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
              title="Refresh roles and permissions"
            >
              <span
                className={`material-symbols-outlined text-[18px] text-[#2B4C7E] ${
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
          <MyPermissionsView />
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

                {/* Search Role Filter */}
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

                {/* Role Cards List */}
                <div className="space-y-2">
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

                      return (
                        <div
                          key={role.id}
                          onClick={() => setSelectedRoleId(role.id)}
                          className={`cursor-pointer p-3 rounded-xl transition-all border flex flex-col gap-1.5 ${
                            isSelected
                              ? 'bg-[#F0F4FA] border-[#1E88E5]/40 shadow-xs ring-1 ring-[#1E88E5]/20'
                              : 'bg-white border-[#E2E8F0] hover:bg-[#F8FAFC] hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className={`material-symbols-outlined text-[20px] ${
                                  isSelected ? 'text-[#1E88E5]' : 'text-gray-500'
                                }`}
                              >
                                {getRoleIcon(role.name)}
                              </span>
                              <span
                                className={`font-semibold text-xs ${
                                  isSelected ? 'text-[#1F3864]' : 'text-[#0F172A]'
                                }`}
                              >
                                {role.name}
                              </span>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                isSystem
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {isSystem ? 'System' : 'Custom'}
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
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h2 className="text-lg font-bold text-[#0F172A]">
                            {currentRole.name}
                          </h2>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              isRoleSystem(currentRole)
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {isRoleSystem(currentRole) ? 'System Default Role' : 'Custom Defined Role'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsEditModalOpen(true)}
                            className="text-[#1E88E5] hover:text-[#1565C0] text-xs font-medium flex items-center gap-0.5 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[15px]">
                              edit
                            </span>
                            <span>Edit Metadata</span>
                          </button>
                          {!isRoleSystem(currentRole) && (
                            <button
                              type="button"
                              onClick={() => setIsDeleteModalOpen(true)}
                              className="text-red-500 hover:text-red-700 text-xs font-medium flex items-center gap-0.5 transition-colors ml-1"
                            >
                              <span className="material-symbols-outlined text-[15px]">
                                delete
                              </span>
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1 max-w-2xl leading-relaxed">
                          {currentRole.description || 'Full system access and operational capabilities.'}
                        </p>
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
                      {isDirty && (
                        <span className="text-[11px] font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-200 animate-pulse">
                          Unsaved Changes
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={handleDiscard}
                        disabled={!isDirty}
                        className="h-8 px-3.5 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors"
                      >
                        Discard
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveChanges}
                        disabled={!isDirty || updatePermissionsMutation.isPending}
                        className="h-8 px-4 rounded-lg text-xs font-semibold bg-[#1F3864] hover:bg-[#284980] text-white shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-40 active:scale-95"
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

                  {/* Scope Legend Bar */}
                  <div className="bg-white rounded-xl shadow-xs border border-[#E2E8F0] overflow-hidden">
                    <div className="bg-[#F8FAFC] px-5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs border-b border-[#E2E8F0]">
                      <div className="flex items-center gap-2 text-gray-600">
                        <span className="material-symbols-outlined text-[16px] text-[#1E88E5]">
                          info
                        </span>
                        <span className="font-medium text-[11px]">
                          Scope Hierarchy: Global &gt; Department &gt; Team &gt; Assigned &gt; Own
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-[11px] text-gray-500 font-medium">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#1F3864]" /> Global
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#1E88E5]" /> Dept
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-slate-500" /> Team / Own
                        </span>
                      </div>
                    </div>

                    {/* Table Column Header Row */}
                    <div className="grid grid-cols-12 px-5 py-2.5 bg-[#F1F5F9] text-[#334155] text-[11px] font-bold uppercase tracking-wider items-center border-b border-[#E2E8F0]">
                      <div className="col-span-6 sm:col-span-7">Capability & Description</div>
                      <div className="col-span-6 sm:col-span-5 grid grid-cols-5 text-center">
                        <span title="Global unbounded access">Global</span>
                        <span title="Department scope">Dept</span>
                        <span title="Team scope">Team</span>
                        <span title="Assigned tickets scope">Assigned</span>
                        <span title="Own created scope">Own</span>
                      </div>
                    </div>

                    {/* Category Sections & Capability Rows */}
                    <div className="divide-y divide-[#E2E8F0]">
                      {permissionsLoading || roleDetailLoading ? (
                        <div className="p-12 flex flex-col items-center justify-center gap-2 text-gray-400">
                          <div className="w-6 h-6 border-2 border-[#1F3864]/20 border-t-[#1F3864] rounded-full animate-spin" />
                          <span className="text-xs">Loading capability matrix...</span>
                        </div>
                      ) : (
                        Object.entries(categorizedPermissions).map(([category, items]) => {
                          const categoryGrantsCount = items.reduce((acc, p) => {
                            const isGranted = SCOPES.some((s) => activeGrants.has(`${p.id}_${s}`));
                            return isGranted ? acc + 1 : acc;
                          }, 0);

                          return (
                            <div key={category} className="flex flex-col">
                              {/* Category Header Row */}
                              <div className="bg-[#F8FAFC] px-5 py-2 flex items-center justify-between border-b border-[#E2E8F0]">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs text-[#1F3864] uppercase tracking-wide">
                                    {category} Management
                                  </span>
                                </div>
                                <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                  {categoryGrantsCount} / {items.length} Enabled
                                </span>
                              </div>

                              {/* Permission Rows */}
                              {items.map((perm) => {
                                const hasAnyGrant = SCOPES.some((s) => activeGrants.has(`${perm.id}_${s}`));

                                return (
                                  <div
                                    key={perm.id}
                                    className="grid grid-cols-12 px-5 py-3 items-center hover:bg-[#F8FAFC] transition-colors border-b border-[#F1F5F9] last:border-b-0"
                                  >
                                    <div className="col-span-6 sm:col-span-7 pr-3">
                                      <div className="flex items-center gap-2">
                                        <span
                                          onClick={() => handleToggleAllScopesForPerm(perm.id)}
                                          className={`font-semibold text-xs cursor-pointer hover:underline ${
                                            hasAnyGrant ? 'text-[#0F172A]' : 'text-gray-500'
                                          }`}
                                          title="Click to toggle all scopes for this capability"
                                        >
                                          {perm.key.replace(/_/g, ' ')}
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">
                                        {perm.description}
                                      </p>
                                    </div>

                                    {/* 5 Scope Checkboxes */}
                                    <div className="col-span-6 sm:col-span-5 grid grid-cols-5 items-center justify-items-center">
                                      {SCOPES.map((scope) => {
                                        const isChecked = activeGrants.has(`${perm.id}_${scope}`);
                                        return (
                                          <input
                                            key={scope}
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => handleToggleScope(perm.id, scope)}
                                            className="w-4 h-4 accent-[#1F3864] rounded cursor-pointer transition-transform active:scale-95"
                                            title={`${perm.key} (${scope})`}
                                          />
                                        );
                                      })}
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

      <DeleteRoleModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        role={currentRole}
        onConfirm={handleDeleteRole}
        isLoading={deleteRoleMutation.isPending}
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
