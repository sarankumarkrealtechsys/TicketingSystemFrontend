import React, { useState, useMemo } from 'react';
import { useAppSelector } from '@/features/auth/authSlice';
import { usePermissionsQuery, useRolesQuery, useRoleDetailsQuery } from '../api';
import { PermissionItem } from '../types';

export const MyPermissionsView: React.FC = () => {
  const { user, permissions: authPermissions } = useAppSelector((state) => state.auth);
  const { data: permissions = [], isLoading: permissionsLoading } = usePermissionsQuery();
  const { data: roles = [], isLoading: rolesLoading } = useRolesQuery();

  const effectiveRoleId = user?.roleId || user?.role?.id;
  const { data: roleDetail, isLoading: roleDetailLoading } = useRoleDetailsQuery(effectiveRoleId);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'GRANTED'>('ALL');

  const userRole = useMemo(() => {
    if (!user || !roles.length) return null;
    return roles.find(
      (r) =>
        r.id === user.roleId ||
        r.name.toUpperCase() === (user.role?.name || '').toUpperCase()
    );
  }, [user, roles]);

  // Construct effective permissions map
  const userPermissions = useMemo(() => {
    const map: Record<string, string[]> = {};

    // 1. Live role permissions from DB
    if (roleDetail?.rolePermissions && roleDetail.rolePermissions.length > 0) {
      roleDetail.rolePermissions.forEach((rp) => {
        const key = rp.permissionKey;
        const scope = rp.scope || 'GLOBAL';
        if (key) {
          if (!map[key]) map[key] = [];
          if (!map[key].includes(scope)) {
            map[key].push(scope);
          }
        }
      });
      return map;
    }

    // 2. Auth permissions from Redux session state
    if (authPermissions && Object.keys(authPermissions).length > 0) {
      return authPermissions;
    }

    // 3. Fallback for ADMIN role
    if (user?.role?.name === 'ADMIN') {
      permissions.forEach((p) => {
        map[p.key] = ['GLOBAL'];
      });
      return map;
    }

    return {};
  }, [roleDetail, authPermissions, user, permissions]);

  // Filter and group permissions by category
  const categoriesMap = useMemo(() => {
    const map: Record<string, PermissionItem[]> = {};

    for (const p of permissions) {
      const scopes = userPermissions[p.key] || [];
      const isGranted = scopes.length > 0 || user?.role?.name === 'ADMIN';

      if (filterMode === 'GRANTED' && !isGranted) {
        continue;
      }

      if (
        searchQuery &&
        !p.key.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !p.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !p.category.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        continue;
      }

      const cat = p.category || 'General';
      if (!map[cat]) map[cat] = [];
      map[cat].push(p);
    }
    return map;
  }, [permissions, userPermissions, user, filterMode, searchQuery]);

  // Total granted count
  const totalGrantedCount = useMemo(() => {
    return permissions.filter((p) => {
      const scopes = userPermissions[p.key] || [];
      return scopes.length > 0 || user?.role?.name === 'ADMIN';
    }).length;
  }, [permissions, userPermissions, user]);

  const getScopeBadge = (permissionKey: string) => {
    const scopes: string[] = userPermissions[permissionKey] || [];

    if (!scopes.length) {
      if (user?.role?.name === 'ADMIN') {
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Global Access
          </span>
        );
      }
      return (
        <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-gray-100 text-gray-500 inline-flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px]">lock</span>
          No Access
        </span>
      );
    }

    if (scopes.includes('GLOBAL')) {
      return (
        <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Global Access
        </span>
      );
    }

    const scopeLabels = scopes.map((s) => {
      switch (s) {
        case 'DEPARTMENT':
          return 'Dept';
        case 'TEAM':
          return 'Team';
        case 'ASSIGNED':
          return 'Assigned';
        case 'OWN':
          return 'Own';
        default:
          return s;
      }
    });

    return (
      <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 text-[#1E88E5] border border-blue-200 inline-flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#1E88E5]" />
        {scopeLabels.join(' & ')} Scope
      </span>
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'ticket':
        return 'confirmation_number';
      case 'user':
        return 'person';
      case 'department':
        return 'domain';
      case 'team':
        return 'groups';
      case 'project':
        return 'folder';
      case 'priority':
        return 'flag';
      case 'status':
        return 'toggle_on';
      case 'ticket field':
        return 'input';
      case 'dashboard':
        return 'analytics';
      case 'role':
        return 'shield_person';
      case 'system':
        return 'settings';
      default:
        return 'verified_user';
    }
  };

  if (permissionsLoading || rolesLoading || roleDetailLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#1F3864]/20 border-t-[#1F3864] rounded-full animate-spin" />
          <span className="text-xs text-gray-500">Loading user permissions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto">
      {/* Header Profile Card */}
      <div className="bg-white rounded-xl p-6 shadow-xs border border-[#E2E8F0] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#1F3864] text-white flex items-center justify-center shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-[28px]">
              verified_user
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg font-bold text-[#0F172A]">
                My Assigned Permissions
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
                {totalGrantedCount} Capabilities Active
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Your capabilities and data scopes are determined by your active role membership.
            </p>
          </div>
        </div>

        {/* User Context Metadata Badges */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2 rounded-lg flex flex-col min-w-[120px]">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Current Role
            </span>
            <span className="text-xs font-bold text-[#1F3864] truncate">
              {user?.role?.name || userRole?.name || 'Standard User'}
            </span>
          </div>
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2 rounded-lg flex flex-col min-w-[120px]">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Department
            </span>
            <span className="text-xs font-semibold text-[#0F172A] truncate">
              {user?.department?.name || 'General Department'}
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E2E8F0] shadow-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search my permissions..."
            className="w-full h-9 pl-9 pr-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#1E88E5] focus:bg-white transition-all"
          />
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 bg-[#F1F5F9] p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setFilterMode('ALL')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              filterMode === 'ALL'
                ? 'bg-white text-[#1F3864] shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All ({permissions.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('GRANTED')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              filterMode === 'GRANTED'
                ? 'bg-white text-[#1F3864] shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Granted ({totalGrantedCount})
          </button>
        </div>
      </div>

      {/* Permissions Grouped by Category */}
      <div className="space-y-4">
        {Object.keys(categoriesMap).length === 0 ? (
          <div className="bg-white rounded-xl p-8 border border-[#E2E8F0] text-center text-xs text-gray-500 shadow-xs">
            No permissions matching your filter criteria.
          </div>
        ) : (
          Object.entries(categoriesMap).map(([category, items]) => (
            <div
              key={category}
              className="bg-white rounded-xl shadow-xs border border-[#E2E8F0] overflow-hidden"
            >
              {/* Category Header */}
              <div className="bg-[#F8FAFC] px-5 py-3 flex items-center justify-between border-b border-[#E2E8F0]">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[#1F3864] text-[20px]">
                    {getCategoryIcon(category)}
                  </span>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-[#1F3864]">
                    {category} Management
                  </h3>
                </div>
                <span className="text-[11px] font-medium text-gray-500">
                  {items.length} {items.length === 1 ? 'rule' : 'rules'}
                </span>
              </div>

              {/* Capability Rows */}
              <div className="divide-y divide-[#F1F5F9]">
                {items.map((perm) => (
                  <div
                    key={perm.id}
                    className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F8FAFC]/60 transition-colors"
                  >
                    <div className="max-w-2xl">
                      <span className="text-xs font-semibold text-[#0F172A] block">
                        {perm.key.replace(/_/g, ' ')}
                      </span>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                        {perm.description}
                      </p>
                    </div>
                    <div className="self-start sm:self-auto shrink-0">
                      {getScopeBadge(perm.key)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyPermissionsView;
