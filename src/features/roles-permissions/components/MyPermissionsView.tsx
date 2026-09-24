import React, { useState, useMemo } from 'react';
import { useAppSelector } from '@/features/auth/authSlice';
import { usePermissionsQuery, useRolesQuery, useRoleDetailsQuery } from '../api';
import { PermissionItem } from '../types';

interface MyPermissionsViewProps {
  onOpenGuide?: () => void;
}

export const MyPermissionsView: React.FC<MyPermissionsViewProps> = ({ onOpenGuide }) => {
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

      if (p.key === 'PRIORITY_MANAGE') {
        continue;
      }

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
          <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1.5 shadow-xs">
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
        <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1.5 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Global Access
        </span>
      );
    }

    const scopeBadges = scopes.map((s) => {
      switch (s) {
        case 'DEPARTMENT':
          return { label: 'Dept', color: 'bg-blue-50 text-[#1E88E5] border-blue-200' };
        case 'TEAM':
          return { label: 'Team', color: 'bg-slate-50 text-slate-700 border-slate-200' };
        case 'ASSIGNED':
          return { label: 'Assigned', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
        case 'OWN':
          return { label: 'Own', color: 'bg-purple-50 text-purple-700 border-purple-200' };
        default:
          return { label: s, color: 'bg-gray-50 text-gray-700 border-gray-200' };
      }
    });

    return (
      <div className="flex items-center justify-center gap-1 flex-wrap">
        {scopeBadges.map((badge, idx) => (
          <span
            key={idx}
            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border inline-flex items-center gap-1 shadow-xs ${badge.color}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
            {badge.label}
          </span>
        ))}
      </div>
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
      case 'priority & status':
        return 'tune';
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
      <div className="flex items-center justify-center p-12 bg-white rounded-xl border border-[#E2E8F0]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#1F3864]/20 border-t-[#1F3864] rounded-full animate-spin" />
          <span className="text-xs text-gray-500 font-medium">Loading user capabilities & permissions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Header Profile Summary Card */}
      <div className="bg-white rounded-xl p-5 shadow-xs border border-[#E2E8F0] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#1F3864] text-white flex items-center justify-center shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-[24px]">
              verified_user
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-base font-bold text-[#0F172A]">
                My Assigned Permissions
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                {totalGrantedCount} of {permissions.length} Capabilities Active
              </span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Your capabilities and data scopes are determined by your active role membership.
            </p>
          </div>
        </div>

        {/* User Context Metadata Badges */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-1.5 rounded-lg flex flex-col min-w-[110px]">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Assigned Role
            </span>
            <span className="text-xs font-bold text-[#1F3864] truncate">
              {user?.role?.name || userRole?.name || 'Standard User'}
            </span>
          </div>
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-1.5 rounded-lg flex flex-col min-w-[110px]">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Department
            </span>
            <span className="text-xs font-semibold text-[#0F172A] truncate">
              {user?.department?.name || 'General Department'}
            </span>
          </div>
          {onOpenGuide && (
            <button
              type="button"
              onClick={onOpenGuide}
              className="h-8 px-3 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-xs active:scale-[0.98] sm:hidden"
              title="How to Use Guide"
            >
              <span className="material-symbols-outlined text-[16px]">help_outline</span>
              <span>Guide</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E2E8F0] shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search my capabilities & permissions..."
            className="w-full h-8 pl-9 pr-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#1E88E5] focus:bg-white transition-all"
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

      {/* Permissions Matrix Table with Fixed Header & Scrollable Body */}
      <div className="bg-white rounded-xl shadow-xs border border-[#E2E8F0] overflow-hidden flex flex-col">
        {/* Fixed Header Container */}
        <div className="shrink-0 bg-white">
          {/* Scope Legend Bar */}
          <div className="bg-[#F8FAFC] px-5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs border-b border-[#E2E8F0]">
            <div className="flex items-center gap-2 text-gray-600">
              <span className="material-symbols-outlined text-[16px] text-[#1E88E5]">
                info
              </span>
              <span className="font-medium text-[11px]">
                Scope Hierarchy: Global &gt; Department &gt; Team &gt; Assigned &gt; Own
              </span>
            </div>
            <div className="flex items-center gap-3.5 text-[11px] text-gray-500 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600" /> Global
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#1E88E5]" /> Dept
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-500" /> Team / Own
              </span>
            </div>
          </div>

          {/* Fixed Column Header Row */}
          <div className="hidden sm:grid grid-cols-12 px-5 py-2.5 bg-[#F1F5F9] text-[#334155] text-[11px] font-bold uppercase tracking-wider items-center border-b border-[#E2E8F0]">
            <div className="col-span-7 sm:col-span-8">Capability & Description</div>
            <div className="col-span-5 sm:col-span-4 text-center">Assigned Scope & Access Level</div>
          </div>
        </div>

        {/* Scrollable Category Sections & Capability Rows Viewport */}
        <div className="divide-y divide-[#E2E8F0] max-h-[calc(100vh-320px)] min-h-[420px] overflow-y-auto">
          {Object.keys(categoriesMap).length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-500">
              No permissions match your filter criteria.
            </div>
          ) : (
            Object.entries(categoriesMap).map(([category, items]) => {
              const categoryGrantedCount = items.filter((p) => {
                const scopes = userPermissions[p.key] || [];
                return scopes.length > 0 || user?.role?.name === 'ADMIN';
              }).length;

              return (
                <div key={category} className="flex flex-col">
                  {/* Sticky Category Header Row */}
                  <div className="bg-[#F8FAFC] px-4 sm:px-5 py-2.5 flex items-center justify-between border-b border-[#E2E8F0] sticky top-0 z-10 shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-[#1F3864] text-[18px]">
                        {getCategoryIcon(category)}
                      </span>
                      <h3 className="font-bold text-xs uppercase tracking-wider text-[#1F3864]">
                        {category} Management
                      </h3>
                    </div>
                    <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
                      {categoryGrantedCount} / {items.length} Active
                    </span>
                  </div>

                  {/* Capability Rows */}
                  <div className="divide-y divide-[#F1F5F9]">
                    {items.map((perm) => (
                      <div
                        key={perm.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-4 sm:px-5 py-3.5 hover:bg-[#F8FAFC] transition-colors"
                      >
                        <div className="flex-1 min-w-0 pr-0 sm:pr-4">
                          <span className="text-xs font-semibold text-[#0F172A] block">
                            {perm.key.replace(/_/g, ' ')}
                          </span>
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                            {perm.description}
                          </p>
                        </div>
                        <div className="flex justify-start sm:justify-center items-center shrink-0">
                          {getScopeBadge(perm.key)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default MyPermissionsView;
