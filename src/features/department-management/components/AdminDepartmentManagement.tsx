import React, { useState, useMemo } from "react";
import { AppLayout } from "@/layout/AppLayout";
import {
  useDepartmentsQuery,
  useRetireDepartmentMutation,
  useUpdateDepartmentMutation,
} from "../api";
import { DepartmentItem, DepartmentStatus } from "../types";
import { CreateDepartmentModal } from "./CreateDepartmentModal";
import { EditDepartmentModal } from "./EditDepartmentModal";
import { ViewDepartmentModal } from "./ViewDepartmentModal";
import { DepartmentDonutChart } from "./DepartmentDonutChart";
import { SelectDropdown, SelectOption } from "@/shared/components";

const STATUS_FILTER_OPTIONS: SelectOption<"all" | "active" | "inactive">[] = [
  { value: "all", label: "All Departments" },
  { value: "active", label: "Active Only", dotColor: "bg-emerald-500" },
  { value: "inactive", label: "Archived / Inactive", dotColor: "bg-gray-400" },
];

export const AdminDepartmentManagement: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">(
    "active",
  );

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedDeptForEdit, setSelectedDeptForEdit] =
    useState<DepartmentItem | null>(null);
  const [selectedDeptForView, setSelectedDeptForView] =
    useState<DepartmentItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { data: departments = [], isLoading } = useDepartmentsQuery({
    includeInactive: true,
  });

  const retireMutation = useRetireDepartmentMutation();
  const updateMutation = useUpdateDepartmentMutation();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filtered departments list
  const filteredDepartments = useMemo(() => {
    return departments.filter((d) => {
      const matchesSearch =
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.description &&
          d.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
          ? d.status === "ACTIVE"
          : d.status === "INACTIVE";

      return matchesSearch && matchesStatus;
    });
  }, [departments, searchQuery, statusFilter]);

  // Overall Statistics
  const stats = useMemo(() => {
    const activeCount = departments.filter((d) => d.status === "ACTIVE").length;
    const totalUsers = departments.reduce(
      (sum, d) => sum + (d._count?.users || d.users?.length || 0),
      0,
    );
    const totalTeams = departments.reduce(
      (sum, d) => sum + (d._count?.teams || d.teams?.length || 0),
      0,
    );

    return {
      activeCount,
      totalUsers,
      totalTeams,
    };
  }, [departments]);

  const handleToggleArchive = async (dept: DepartmentItem) => {
    try {
      if (dept.status === "ACTIVE") {
        await retireMutation.mutateAsync(dept.id);
        showToast(`Department "${dept.name}" archived successfully.`);
      } else {
        await updateMutation.mutateAsync({
          id: dept.id,
          data: { status: "ACTIVE" },
        });
        showToast(`Department "${dept.name}" unarchived successfully.`);
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Action failed.");
    }
  };

  return (
    <AppLayout role="ADMIN">
      <div className="flex flex-col space-y-6">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-[#1F3864] text-white rounded-lg shadow-xl text-xs font-semibold animate-in slide-in-from-bottom">
            <span className="material-symbols-outlined text-emerald-400 text-[18px]">
              check_circle
            </span>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-1">
              <span>Home</span>
              <span className="material-symbols-outlined text-[14px]">
                chevron_right
              </span>
              <span>Management</span>
              <span className="material-symbols-outlined text-[14px]">
                chevron_right
              </span>
              <span className="text-[#1F3864] dark:text-blue-400 font-semibold">
                Departments
              </span>
            </div>
            <h1 className="text-2xl font-bold text-[#1A1A1A] dark:text-white tracking-tight">
              Department Management
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Manage organizational departments, team allocations, and personnel capacity.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2.5 bg-[#1F3864] hover:bg-[#152747] text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-2 shrink-0 active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[18px]">
              corporate_fare
            </span>
            <span>New Department</span>
          </button>
        </div>

        {/* TOP ROW: 4 Overview KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Active Departments */}
          <div className="bg-white dark:bg-[#121E30] rounded-xl p-4 sm:p-5 border border-[#E5E7EB] dark:border-[#1E2D45] shadow-xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider">
                Active Departments
              </span>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#1F3864]/10 dark:bg-[#1F3864]/30 text-[#1F3864] dark:text-blue-300 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px] sm:text-[20px]">
                  corporate_fare
                </span>
              </div>
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#1A1A1A] dark:text-white">
                {stats.activeCount}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Out of {departments.length} total units
              </p>
            </div>
          </div>

          {/* Card 2: Total Personnel */}
          <div className="bg-white dark:bg-[#121E30] rounded-xl p-4 sm:p-5 border border-[#E5E7EB] dark:border-[#1E2D45] shadow-xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider">
                Total Personnel
              </span>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#E3F2FD] dark:bg-blue-900/30 text-[#1E88E5] dark:text-blue-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px] sm:text-[20px]">
                  badge
                </span>
              </div>
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#1A1A1A] dark:text-white">
                {stats.totalUsers}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Assigned employees
              </p>
            </div>
          </div>

          {/* Card 3: Total Teams */}
          <div className="bg-white dark:bg-[#121E30] rounded-xl p-4 sm:p-5 border border-[#E5E7EB] dark:border-[#1E2D45] shadow-xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider">
                Total Teams
              </span>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#FFF8E1] dark:bg-amber-900/30 text-[#F57F17] dark:text-amber-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px] sm:text-[20px]">
                  groups
                </span>
              </div>
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#1A1A1A] dark:text-white">
                {stats.totalTeams}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Active operational teams
              </p>
            </div>
          </div>

          {/* Card 4: Department Capacity */}
          <div className="bg-white dark:bg-[#121E30] rounded-xl p-4 sm:p-5 border border-[#E5E7EB] dark:border-[#1E2D45] shadow-xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider">
                Capacity
              </span>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#E8F5E9] dark:bg-emerald-900/30 text-[#2E7D32] dark:text-emerald-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px] sm:text-[20px]">
                  insights
                </span>
              </div>
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                Optimal
              </h3>
              <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                <div className="bg-emerald-500 h-1.5 rounded-full w-4/5" />
              </div>
            </div>
          </div>
        </div>

        {/* DONUT CHART SECTION: Department Personnel Breakdown */}
        <DepartmentDonutChart departments={departments} />

        {/* DEPARTMENTS TABLE SECTION */}
        <div className="bg-white dark:bg-[#121E30] rounded-xl shadow-xs border border-[#E5E7EB] dark:border-[#1E2D45] overflow-hidden flex flex-col">
          {/* Table Toolbar */}
          <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#121E30] border-b border-[#F0F2F5] dark:border-[#1E2D45]">
            <div className="relative w-full sm:w-80">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
                search
              </span>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search departments by name or scope..."
                className="w-full h-9 pl-9 pr-3 bg-[#F9FAFB] dark:bg-[#1A283E] border border-[#D1D5DB] dark:border-[#283A55] rounded-lg text-xs text-[#1A1A1A] dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#0e61a1] transition-all"
              />
            </div>

            <div className="w-full sm:w-48">
              <SelectDropdown<"all" | "active" | "inactive">
                value={statusFilter}
                onChange={(val) => setStatusFilter(val)}
                options={STATUS_FILTER_OPTIONS}
                size="sm"
              />
            </div>
          </div>

          {/* Departments Table */}
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-xs text-gray-500 gap-2">
              <span className="w-6 h-6 border-2 border-[#1F3864] border-t-transparent rounded-full animate-spin" />
              Loading departments...
            </div>
          ) : filteredDepartments.length === 0 ? (
            <div className="py-16 text-center text-xs text-gray-500 dark:text-gray-400">
              <span className="material-symbols-outlined text-[36px] text-gray-300 dark:text-gray-600 block mb-1">
                corporate_fare
              </span>
              No departments found matching your filter criteria.
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAFBFD] dark:bg-[#162234] border-b border-[#F0F2F5] dark:border-[#1E2D45] text-gray-500 dark:text-gray-400 font-semibold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4 sm:px-6 w-[30%] min-w-[200px]">
                      Department Name
                    </th>
                    <th className="py-3 px-4 sm:px-6 w-[30%] min-w-[200px]">
                      Description
                    </th>
                    <th className="py-3 px-4 sm:px-6 w-[12%] min-w-[100px]">
                      Teams
                    </th>
                    <th className="py-3 px-4 sm:px-6 w-[12%] min-w-[100px]">
                      Personnel
                    </th>
                    <th className="py-3 px-4 sm:px-6 w-[10%] min-w-[90px]">
                      Status
                    </th>
                    <th className="py-3 px-4 sm:px-6 w-[6%] min-w-[90px] text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F2F5] dark:divide-[#1E2D45] text-xs">
                  {filteredDepartments.map((d) => {
                    const teamsCount = d._count?.teams || d.teams?.length || 0;
                    const usersCount = d._count?.users || d.users?.length || 0;
                    const isActive = d.status === "ACTIVE";

                    return (
                      <tr
                        key={d.id}
                        className="hover:bg-gray-50/70 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        {/* Department Name */}
                        <td className="py-3.5 px-4 sm:px-6 font-bold text-sm text-[#1A1A1A] dark:text-white">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1F3864] to-[#2B5EA7] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                              {d.name.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="truncate" title={d.name}>
                              {d.name}
                            </span>
                          </div>
                        </td>

                        {/* Description */}
                        <td className="py-3.5 px-4 sm:px-6 text-gray-500 dark:text-gray-400">
                          <span className="line-clamp-1" title={d.description || "—"}>
                            {d.description || "—"}
                          </span>
                        </td>

                        {/* Teams Count */}
                        <td className="py-3.5 px-4 sm:px-6">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-900/30 text-[#0e61a1] dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                            <span className="material-symbols-outlined text-[13px]">
                              groups
                            </span>
                            {teamsCount} {teamsCount === 1 ? "team" : "teams"}
                          </span>
                        </td>

                        {/* Personnel Count */}
                        <td className="py-3.5 px-4 sm:px-6">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-100 dark:border-violet-800">
                            <span className="material-symbols-outlined text-[13px]">
                              badge
                            </span>
                            {usersCount} {usersCount === 1 ? "person" : "persons"}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 sm:px-6">
                          {isActive ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-slate-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                              Archived
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 sm:px-6 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setSelectedDeptForView(d)}
                              className="p-1.5 text-gray-500 hover:text-[#1E88E5] dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                              title="View department details & available teams"
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                visibility
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedDeptForEdit(d)}
                              className="p-1.5 text-gray-500 hover:text-[#1F3864] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              title="Edit department"
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                edit
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleArchive(d)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isActive
                                  ? "text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                                  : "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                              }`}
                              title={isActive ? "Archive department" : "Unarchive department"}
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                {isActive ? "archive" : "unarchive"}
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modals */}
        <CreateDepartmentModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSuccess={() => showToast("Department created successfully!")}
        />

        <EditDepartmentModal
          department={selectedDeptForEdit}
          isOpen={Boolean(selectedDeptForEdit)}
          onClose={() => setSelectedDeptForEdit(null)}
          onSuccess={() => showToast("Department updated successfully!")}
        />

        <ViewDepartmentModal
          department={selectedDeptForView}
          isOpen={Boolean(selectedDeptForView)}
          onClose={() => setSelectedDeptForView(null)}
        />
      </div>
    </AppLayout>
  );
};

export default AdminDepartmentManagement;
