import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { AppLayout } from "@/layout/AppLayout";
import {
  useDepartmentsQuery,
  useRetireDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentPermanentMutation,
} from "../api";
import { DepartmentItem, DepartmentStatus } from "../types";
import { CreateDepartmentModal } from "./CreateDepartmentModal";
import { EditDepartmentModal } from "./EditDepartmentModal";
import { ViewDepartmentModal } from "./ViewDepartmentModal";
import { DepartmentDonutChart } from "./DepartmentDonutChart";
import { SelectDropdown, SelectOption, StatCard, Can } from "@/shared/components";

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

  const { data: departments = [], isLoading, refetch, isFetching } = useDepartmentsQuery({
    includeInactive: true,
  });

  const retireMutation = useRetireDepartmentMutation();
  const updateMutation = useUpdateDepartmentMutation();
  const deletePermanentMutation = useDeleteDepartmentPermanentMutation();

  // Archive / Unarchive / Delete Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'archive' | 'unarchive' | 'delete';
    department: DepartmentItem | null;
    isLoading: boolean;
    error: string | null;
  }>({
    isOpen: false,
    type: 'archive',
    department: null,
    isLoading: false,
    error: null,
  });

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

  const openConfirmModal = (dept: DepartmentItem, type: 'archive' | 'unarchive' | 'delete') => {
    setConfirmModal({
      isOpen: true,
      type,
      department: dept,
      isLoading: false,
      error: null,
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmModal.department) return;
    setConfirmModal((prev) => ({ ...prev, isLoading: true, error: null }));
    const dept = confirmModal.department;

    try {
      if (confirmModal.type === 'delete') {
        await deletePermanentMutation.mutateAsync(dept.id);
        showToast(`Department "${dept.name}" permanently deleted successfully.`);
      } else if (confirmModal.type === 'unarchive') {
        await updateMutation.mutateAsync({
          id: dept.id,
          data: { status: "ACTIVE" },
        });
        showToast(`Department "${dept.name}" unarchived successfully.`);
      } else {
        await retireMutation.mutateAsync(dept.id);
        showToast(`Department "${dept.name}" archived successfully.`);
      }

      setConfirmModal({
        isOpen: false,
        type: 'archive',
        department: null,
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      setConfirmModal((prev) => ({
        ...prev,
        isLoading: false,
        error: err?.response?.data?.message || err?.message || `Failed to ${confirmModal.type} department.`,
      }));
    }
  };

  return (
    <AppLayout role="ADMIN">
      <div className="flex flex-col space-y-6">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-[120] flex items-center gap-2 px-4 py-2.5 bg-[#1F3864] text-white rounded-lg shadow-xl text-xs font-semibold animate-in slide-in-from-bottom">
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
          </div>

          <Can permission="DEPARTMENT_CREATE">
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
          </Can>
        </div>

        {/* TOP ROW: 4 Overview KPI Cards (fluid responsive grid scaling) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 2xl:gap-6 w-full">
          <StatCard
            title="Active Departments"
            count={stats.activeCount}
            icon="corporate_fare"
            accentColor="#1F3864"
            subtitle="Operational"
          />
          <StatCard
            title="Total Personnel"
            count={stats.totalUsers}
            icon="badge"
            accentColor="#1E88E5"
            subtitle="Active Staff"
            subtitleColor="#1E88E5"
          />
          <StatCard
            title="Total Teams"
            count={stats.totalTeams}
            icon="groups"
            accentColor="#FB8C00"
            subtitle="Operational Units"
            subtitleColor="#FB8C00"
          />
          <StatCard
            title="Capacity"
            count="Optimal"
            icon="insights"
            accentColor="#43A047"
            subtitle="Load Optimal"
            subtitleColor="#43A047"
          />
        </div>

        {/* DONUT CHART SECTION: Department Personnel Breakdown */}
        <DepartmentDonutChart departments={departments} />

        {/* DEPARTMENTS TABLE SECTION */}
        <div className="bg-white dark:bg-[#121E30] rounded-xl shadow-xs border border-[#E5E7EB] dark:border-[#1E2D45] overflow-hidden flex flex-col">
          {/* Table Toolbar */}
          <div className="p-4 flex flex-col gap-3 bg-white dark:bg-[#121E30] border-b border-[#F0F2F5] dark:border-[#1E2D45]">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
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

            {/* Next Line: Medium Navy Blue Refresh Button */}
            <div className="pt-2 flex justify-end border-t border-gray-100 dark:border-[#1E2D45]/60 w-full">
              <button
                type="button"
                onClick={() => {
                  refetch();
                  showToast("Refreshed departments list!");
                }}
                className="h-8 px-3.5 bg-[#2B4C7E] hover:bg-[#1F3864] text-white rounded-lg text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 shrink-0 active:scale-[0.98] cursor-pointer"
                title="Refresh Departments List"
              >
                <span className={`material-symbols-outlined text-[16px] ${isFetching ? "animate-spin" : ""}`}>
                  refresh
                </span>
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Departments Table Desktop & Mobile */}
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
            <>
              {/* DESKTOP TABLE (Visible on md and above) */}
              <div className="hidden md:block overflow-x-auto w-full">
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
                              <Can permission="DEPARTMENT_UPDATE">
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
                              </Can>
                              <Can permission="DEPARTMENT_DELETE">
                                <button
                                  type="button"
                                  onClick={() => openConfirmModal(d, isActive ? "archive" : "unarchive")}
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
                                {!isActive && (
                                  <button
                                    type="button"
                                    onClick={() => openConfirmModal(d, "delete")}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                                    title="Permanently Delete department"
                                  >
                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                  </button>
                                )}
                              </Can>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* MOBILE SEPARATE CARDS (Visible on mobile < md) */}
              <div className="block md:hidden p-3 space-y-3 bg-[#F9FAFB]/40 dark:bg-slate-900/40">
                {filteredDepartments.map((d) => {
                  const teamsCount = d._count?.teams || d.teams?.length || 0;
                  const usersCount = d._count?.users || d.users?.length || 0;
                  const isActive = d.status === "ACTIVE";

                  return (
                    <div
                      key={d.id}
                      onClick={() => setSelectedDeptForView(d)}
                      className="bg-white dark:bg-[#121E30] rounded-xl p-3.5 border border-[#E5E7EB] dark:border-[#1E2D45] shadow-xs cursor-pointer hover:border-[#0e61a1]/40 transition-all flex flex-col space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#1F3864] to-[#2B5EA7] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                            {d.name.substring(0, 2).toUpperCase()}
                          </span>
                          <div>
                            <h3 className="font-semibold text-sm text-[#1A1A1A] dark:text-white leading-tight">
                              {d.name}
                            </h3>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                              {d.description || "Operational Unit"}
                            </p>
                          </div>
                        </div>

                        <div>
                          {isActive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold text-[10px] border border-emerald-100 dark:border-emerald-900 shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span>Active</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 font-semibold text-[10px] border border-gray-200 dark:border-slate-700 shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                              <span>Archived</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-gray-100 dark:border-slate-800">
                        <div>
                          <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                            Teams
                          </span>
                          <span className="font-semibold text-gray-700 dark:text-gray-300">
                            {teamsCount} {teamsCount === 1 ? "team" : "teams"}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                            Personnel
                          </span>
                          <span className="font-semibold text-gray-700 dark:text-gray-300">
                            {usersCount} {usersCount === 1 ? "person" : "persons"}
                          </span>
                        </div>
                      </div>

                      <div
                        className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-800"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedDeptForView(d)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#1E88E5] dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[16px]">visibility</span>
                          <span>View</span>
                        </button>
                        <Can permission="DEPARTMENT_UPDATE">
                          <button
                            type="button"
                            onClick={() => setSelectedDeptForEdit(d)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                            <span>Edit</span>
                          </button>
                        </Can>
                        <Can permission="DEPARTMENT_DELETE">
                          <button
                            type="button"
                            onClick={() => openConfirmModal(d, isActive ? "archive" : "unarchive")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                              isActive
                                ? "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40"
                                : "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40"
                            }`}
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {isActive ? "archive" : "unarchive"}
                            </span>
                            <span>{isActive ? "Archive" : "Restore"}</span>
                          </button>
                          {!isActive && (
                            <button
                              type="button"
                              onClick={() => openConfirmModal(d, "delete")}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                              <span>Delete</span>
                            </button>
                          )}
                        </Can>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
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

        {/* Confirmation Modal */}
        {confirmModal.isOpen &&
          confirmModal.department &&
          createPortal(
            <div
              className="fixed inset-0 top-0 left-0 right-0 bottom-0 !m-0 z-[110] flex items-center justify-center p-4 bg-[#0F1B2D]/50 backdrop-blur-[8px] transition-opacity duration-200"
              onClick={() =>
                setConfirmModal((prev) => ({ ...prev, isOpen: false }))
              }
            >
              <div
                className="bg-white dark:bg-[#121E30] rounded-2xl shadow-2xl max-w-md w-full border border-[#E5E7EB] dark:border-[#1E2D45] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 space-y-5">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                        confirmModal.type === 'delete'
                          ? 'bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-900'
                          : confirmModal.type === 'archive'
                          ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900'
                          : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[26px]">
                        {confirmModal.type === 'delete' ? 'delete_forever' : confirmModal.type === 'archive' ? 'archive' : 'unarchive'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-[#1A1A1A] dark:text-white tracking-tight">
                        {confirmModal.type === 'delete'
                          ? `Permanently Delete Department "${confirmModal.department.name}"?`
                          : confirmModal.type === 'archive'
                          ? `Archive Department "${confirmModal.department.name}"?`
                          : `Restore Department "${confirmModal.department.name}"?`}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                        {confirmModal.type === 'delete'
                          ? `Are you sure you want to permanently delete this department? This action cannot be undone.`
                          : confirmModal.type === 'archive'
                          ? `Are you sure you want to archive this department? It will be marked as inactive and hidden from active team allocations.`
                          : `Are you sure you want to restore this department? It will be reactivated immediately.`}
                      </p>
                    </div>
                  </div>

                  {confirmModal.error && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-700 dark:text-red-300 font-medium">
                      {confirmModal.error}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EEF1F5] dark:border-[#1E2D45]">
                    <button
                      type="button"
                      disabled={confirmModal.isLoading}
                      onClick={() =>
                        setConfirmModal((prev) => ({ ...prev, isOpen: false }))
                      }
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 border border-[#D1D5DB] dark:border-[#283A55] hover:bg-gray-50 dark:hover:bg-slate-800 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={confirmModal.isLoading}
                      onClick={handleConfirmAction}
                      className={`px-5 py-2 rounded-xl text-xs font-semibold text-white shadow-sm flex items-center gap-2 transition-all active:scale-[0.99] ${
                        confirmModal.type === 'delete'
                          ? 'bg-red-600 hover:bg-red-700'
                          : confirmModal.type === 'archive'
                          ? 'bg-amber-600 hover:bg-amber-700'
                          : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      {confirmModal.isLoading && (
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      )}
                      <span className="material-symbols-outlined text-[16px]">
                        {confirmModal.type === 'delete' ? 'delete' : confirmModal.type === 'archive' ? 'archive' : 'unarchive'}
                      </span>
                      <span>
                        {confirmModal.isLoading
                          ? confirmModal.type === 'delete'
                            ? 'Deleting...'
                            : confirmModal.type === 'archive'
                            ? 'Archiving...'
                            : 'Restoring...'
                          : confirmModal.type === 'delete'
                          ? 'Permanently Delete'
                          : confirmModal.type === 'archive'
                          ? 'Archive Department'
                          : 'Restore Department'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )}
      </div>
    </AppLayout>
  );
};

export default AdminDepartmentManagement;
