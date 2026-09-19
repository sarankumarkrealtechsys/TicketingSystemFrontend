import React, { useState } from 'react';
import { AppLayout } from '@/layout/AppLayout';
import { MyPermissionsView } from '@/features/roles-permissions';
import { RolesGuideModal } from '@/features/roles-permissions/components/RolesGuideModal';
import { usePermissionsQuery, useRolesQuery, useRoleDetailsQuery } from '@/features/roles-permissions/api';
import { useAppSelector } from '@/features/auth/authSlice';

export const MyPermissionsPage: React.FC = () => {
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const { user } = useAppSelector((state) => state.auth);
  const effectiveRoleId = user?.roleId || user?.role?.id;

  const { refetch: refetchPermissions, isFetching: permissionsFetching } = usePermissionsQuery();
  const { refetch: refetchRoles, isFetching: rolesFetching } = useRolesQuery();
  const { refetch: refetchDetail, isFetching: detailFetching } = useRoleDetailsQuery(effectiveRoleId);

  const isRefreshing = permissionsFetching || rolesFetching || detailFetching;

  const handleRefresh = async () => {
    await Promise.all([refetchPermissions(), refetchRoles(), refetchDetail()]);
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto px-4 py-6">
        {/* Top Header & Action Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
              My Permissions & Access
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              View your active operational capabilities and data visibility scopes.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* How to Use Guide Button */}
            <button
              type="button"
              onClick={() => setIsGuideOpen(true)}
              className="h-8 px-3.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-xs active:scale-[0.98]"
              title="View instructions on how roles, permissions, and scopes work"
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
              disabled={isRefreshing}
              className="h-8 px-3.5 bg-white hover:bg-gray-50 border border-[#E2E8F0] text-[#1F3864] text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-xs active:scale-[0.98] disabled:opacity-50"
              title="Refresh permissions and role status"
            >
              <span
                className={`material-symbols-outlined text-[17px] text-[#1F3864] ${
                  isRefreshing ? 'animate-spin' : ''
                }`}
              >
                refresh
              </span>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* My Permissions View */}
        <MyPermissionsView onOpenGuide={() => setIsGuideOpen(true)} />

        {/* Roles & Permissions Guide Modal */}
        <RolesGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
      </div>
    </AppLayout>
  );
};

export default MyPermissionsPage;
