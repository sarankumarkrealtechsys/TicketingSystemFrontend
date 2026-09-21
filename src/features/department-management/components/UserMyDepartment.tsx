import React from "react";
import { useAppSelector } from "@/features/auth/authSlice";
import { AppLayout } from "@/layout/AppLayout";
import { useDepartmentDetailQuery } from "../api";
import { StatCard } from "@/shared/components";

export const UserMyDepartment: React.FC = () => {
  const currentUser = useAppSelector((state) => state.auth.user);
  const departmentId = currentUser?.departmentId || currentUser?.department?.id;

  const { data: department, isLoading } = useDepartmentDetailQuery(
    departmentId ? Number(departmentId) : undefined,
  );

  const usersList = department?.users || [];

  if (isLoading) {
    return (
      <AppLayout role="USER">
        <div className="py-24 flex flex-col items-center justify-center gap-2 text-gray-500 text-xs">
          <span className="w-6 h-6 border-2 border-[#1F3864] border-t-transparent rounded-full animate-spin" />
          Loading your department workspace...
        </div>
      </AppLayout>
    );
  }

  if (!departmentId || !department) {
    return (
      <AppLayout role="USER">
        <div className="bg-white dark:bg-[#121E30] rounded-xl shadow-xs border border-[#E5E7EB] dark:border-[#1E2D45] p-12 text-center max-w-lg mx-auto mt-8">
          <span className="material-symbols-outlined text-[48px] text-gray-300 dark:text-gray-600 mb-3 block">
            domain_disabled
          </span>
          <h2 className="text-lg font-bold text-[#1A1A1A] dark:text-white">
            No Department Assignment Found
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-6">
            You are not currently assigned to an active department unit. Please contact an administrator.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout role="USER">
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-1">
          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
            <span>Home</span>
            <span className="material-symbols-outlined text-[14px]">
              chevron_right
            </span>
            <span className="text-[#1F3864] dark:text-blue-400 font-semibold">
              My Department
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] dark:text-white tracking-tight">
            {department.name}
          </h1>
        </div>


        {/* TOP ROW: 3 Overview KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-4">
          <StatCard
            title="Department Unit"
            count={department.name}
            icon="corporate_fare"
            accentColor="#1F3864"
            subtitle="Department Entity"
          />
          <StatCard
            title="Colleagues"
            count={usersList.length}
            icon="badge"
            accentColor="#1E88E5"
            subtitle="Registered Members"
            subtitleColor="#1E88E5"
          />
          <StatCard
            title="Status"
            count="Active"
            icon="check_circle"
            accentColor="#43A047"
            subtitle="Operational Status"
            subtitleColor="#43A047"
          />
        </div>


        {/* DEPARTMENT COLLEAGUES ROSTER TABLE */}
        <div className="bg-white dark:bg-[#121E30] rounded-xl shadow-xs border border-[#E5E7EB] dark:border-[#1E2D45] overflow-hidden">
          <div className="p-4 sm:p-5 bg-white dark:bg-[#121E30] border-b border-[#F0F2F5] dark:border-[#1E2D45] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#1F3864]/10 text-[#1F3864] dark:text-blue-300 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">badge</span>
              </div>
              <h2 className="font-bold text-base text-[#1A1A1A] dark:text-white">
                Department Colleagues
              </h2>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 font-semibold border border-gray-200 dark:border-slate-700">
              {usersList.length} Colleagues
            </span>
          </div>

          {usersList.length === 0 ? (
            <div className="py-10 text-center text-xs text-gray-500 dark:text-gray-400">
              No colleagues currently registered in this department.
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAFBFD] dark:bg-[#162234] border-b border-[#F0F2F5] dark:border-[#1E2D45] text-gray-500 dark:text-gray-400 font-semibold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4 sm:px-6 w-[40%] min-w-[200px]">Colleague</th>
                    <th className="py-3 px-4 sm:px-6 w-[35%] min-w-[200px]">Email</th>
                    <th className="py-3 px-4 sm:px-6 w-[15%] min-w-[120px]">Role</th>
                    <th className="py-3 px-4 sm:px-6 w-[10%] min-w-[90px]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F2F5] dark:divide-[#1E2D45] text-xs">
                  {usersList.map((u) => {
                    const initials = (u.name || u.username || "U")
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase();

                    return (
                      <tr key={u.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3.5 px-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-[#1F3864] to-[#2B5EA7] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-sm text-[#1A1A1A] dark:text-white block truncate" title={u.name}>
                                {u.name}
                              </span>
                              <span className="text-[11px] text-gray-400 block truncate">
                                @{u.username}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 font-mono text-gray-600 dark:text-gray-300 truncate" title={u.email}>
                          {u.email}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 text-[11px] font-medium">
                            {u.userRole?.name || "Specialist"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 sm:px-6">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default UserMyDepartment;
