import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  useTeamsQuery,
  useUpdateTeamMutation,
  useRetireTeamMutation,
  useDeleteTeamPermanentMutation,
} from "../api";
import { useDepartmentsQuery } from "@/features/department-management";
import { TeamItem } from "../types";
import { CreateTeamModal } from "./CreateTeamModal";
import { EditTeamModal } from "./EditTeamModal";
import { TeamRosterDrawer } from "./TeamRosterDrawer";
import { ReassignDepartmentModal } from "./ReassignDepartmentModal";
import { SelectDropdown, SelectOption } from "@/shared/components";

const STATUS_FILTER_OPTIONS: SelectOption<"all" | "active" | "inactive">[] = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active Only", dotColor: "bg-emerald-500" },
  { value: "inactive", label: "Archived / Inactive", dotColor: "bg-gray-400" },
];

export const AdminTeamManagement: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("active");

  // Modals & Drawer state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTeamForEdit, setSelectedTeamForEdit] =
    useState<TeamItem | null>(null);
  const [selectedTeamForRoster, setSelectedTeamForRoster] =
    useState<TeamItem | null>(null);
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [selectedTeamForReassign, setSelectedTeamForReassign] =
    useState<TeamItem | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<
    string | null
  >(null);

  const { data: teams = [], isLoading, refetch: refetchTeams, isFetching: isFetchingTeams } = useTeamsQuery({
    includeInactive: true,
  });
  const { data: departments = [], refetch: refetchDepts } = useDepartmentsQuery({
    includeInactive: true,
  });

  const updateTeamMutation = useUpdateTeamMutation();
  const retireTeamMutation = useRetireTeamMutation();
  const deleteTeamPermanentMutation = useDeleteTeamPermanentMutation();

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: "archive" | "unarchive" | "delete";
    team: TeamItem | null;
    isLoading: boolean;
    error: string | null;
  }>({
    isOpen: false,
    type: "archive",
    team: null,
    isLoading: false,
    error: null,
  });

  const showToast = (msg: string) => {
    setActionSuccessMessage(msg);
    setTimeout(() => setActionSuccessMessage(null), 4000);
  };

  // Department Dropdown Filter Options
  const departmentOptions = useMemo<SelectOption<string>[]>(() => {
    const options: SelectOption<string>[] = [
      { value: "all", label: "All Departments" },
    ];
    departments.forEach((d) => {
      options.push({
        value: d.id.toString(),
        label: d.name,
        sublabel: d.status === "INACTIVE" ? "Archived" : undefined,
        dotColor: d.status === "ACTIVE" ? "bg-blue-500" : "bg-gray-400",
      });
    });
    return options;
  }, [departments]);

  // Filtered teams
  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      // Department filter
      if (
        departmentFilter !== "all" &&
        t.departmentId !== Number(departmentFilter) &&
        t.department?.id !== Number(departmentFilter)
      ) {
        return false;
      }

      // Status filter
      if (statusFilter === "active" && t.status !== "ACTIVE") return false;
      if (statusFilter === "inactive" && t.status !== "INACTIVE") return false;

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const nameMatch = t.name.toLowerCase().includes(q);
      const deptMatch = t.department?.name.toLowerCase().includes(q);
      const emailMatch = t.teamAdminEmail.toLowerCase().includes(q);
      return nameMatch || deptMatch || emailMatch;
    });
  }, [teams, departmentFilter, statusFilter, searchQuery]);

  // Stats calculation
  const stats = useMemo(() => {
    const activeTeams = teams.filter((t) => t.status === "ACTIVE").length;
    const totalMembers = teams.reduce(
      (acc, t) => acc + (t._count?.members || 0),
      0,
    );
    const assignedIncidents = teams.reduce(
      (acc, t) => acc + (t._count?.tickets || 0),
      0,
    );
    return {
      activeTeams,
      totalMembers,
      assignedIncidents,
      capacity: activeTeams > 0 ? "Optimal" : "Empty",
    };
  }, [teams]);

  const openConfirmModal = (team: TeamItem, type: "archive" | "unarchive" | "delete") => {
    setConfirmModal({
      isOpen: true,
      type,
      team,
      isLoading: false,
      error: null,
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmModal.team) return;
    setConfirmModal((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      if (confirmModal.type === "delete") {
        await deleteTeamPermanentMutation.mutateAsync(confirmModal.team.id);
        showToast(`Team "${confirmModal.team.name}" permanently deleted successfully.`);
      } else if (confirmModal.type === "archive") {
        await retireTeamMutation.mutateAsync(confirmModal.team.id);
        showToast(`Team "${confirmModal.team.name}" archived successfully.`);
      } else {
        await updateTeamMutation.mutateAsync({
          id: confirmModal.team.id,
          data: { status: "ACTIVE" },
        });
        showToast(
          `Team "${confirmModal.team.name}" restored and activated successfully.`,
        );
      }
      setConfirmModal({
        isOpen: false,
        type: "archive",
        team: null,
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      setConfirmModal((prev) => ({
        ...prev,
        isLoading: false,
        error:
          err?.response?.data?.message ||
          err?.message ||
          `Failed to ${confirmModal.type} team.`,
      }));
    }
  };

  const getTeamBadgeColor = (index: number) => {
    const colors = [
      "bg-[#1F3864] text-white",
      "bg-[#0e61a1] text-white",
      "bg-[#543100] text-[#ffddbb]",
      "bg-[#03224d] text-white",
      "bg-[#ba1a1a] text-white",
      "bg-[#44474f] text-white",
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="flex flex-col space-y-6">
      {/* Toast Feedback */}
      {actionSuccessMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-[#1F3864] text-white rounded-lg shadow-xl text-xs font-semibold animate-in slide-in-from-bottom">
          <span className="material-symbols-outlined text-emerald-400 text-[18px]">
            check_circle
          </span>
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Breadcrumbs & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col space-y-1">
          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
            <span>Home</span>
            <span className="material-symbols-outlined text-[14px]">
              chevron_right
            </span>
            <span>Management</span>
            <span className="material-symbols-outlined text-[14px]">
              chevron_right
            </span>
            <span className="text-[#1F3864] font-semibold">Teams</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">
            Team Management
          </h1>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsReassignOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-gray-50 border border-[#D1D5DB] text-gray-700 rounded-lg font-semibold text-xs shadow-sm transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] text-[#0e61a1]">
              swap_horiz
            </span>
            <span>Department Change</span>
          </button>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1F3864] hover:bg-[#152747] active:scale-[0.99] text-white rounded-lg font-semibold text-xs shadow-sm transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">
              group_add
            </span>
            <span>New Team</span>
          </button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Active Teams */}
        <div className="p-4 bg-white rounded-xl shadow-sm border border-[#E5E7EB] flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Active Teams
            </span>
            <span className="text-2xl font-bold text-[#1F3864] mt-0.5">
              {stats.activeTeams}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#1F3864]/5 flex items-center justify-center text-[#1F3864]">
            <span className="material-symbols-outlined text-[24px]">
              corporate_fare
            </span>
          </div>
        </div>

        {/* Total Members */}
        <div className="p-4 bg-white rounded-xl shadow-sm border border-[#E5E7EB] flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Total Members
            </span>
            <span className="text-2xl font-bold text-[#1F3864] mt-0.5">
              {stats.totalMembers}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-[#0e61a1]">
            <span className="material-symbols-outlined text-[24px]">badge</span>
          </div>
        </div>

        {/* Assigned Incidents */}
        <div className="p-4 bg-white rounded-xl shadow-sm border border-[#E5E7EB] flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Assigned Tickets
            </span>
            <span className="text-2xl font-bold text-[#1F3864] mt-0.5">
              {stats.assignedIncidents}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <span className="material-symbols-outlined text-[24px]">
              confirmation_number
            </span>
          </div>
        </div>


        {/* Team Capacity */}
        <div className="p-4 bg-white rounded-xl shadow-sm border border-[#E5E7EB] flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Team Capacity
            </span>
            <span className="text-2xl font-bold text-emerald-600 mt-0.5">
              {stats.capacity}
            </span>
            <div className="w-24 bg-gray-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div className="bg-emerald-500 h-1.5 rounded-full w-4/5" />
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <span className="material-symbols-outlined text-[24px]">
              insights
            </span>
          </div>
        </div>
      </div>

      {/* Teams Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] overflow-hidden flex flex-col">
        {/* Table Controls */}
        <div className="p-4 flex flex-col gap-3 bg-white border-b border-[#F0F2F5]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
            <div className="relative w-full sm:w-80">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
                search
              </span>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search teams by name, department, or lead..."
                className="w-full h-9 pl-9 pr-3 bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg text-xs text-[#1A1A1A] placeholder:text-gray-400 focus:outline-none focus:border-[#0e61a1] focus:bg-white transition-all"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              {/* Department Filter */}
              <div className="w-full sm:w-56">
                <SelectDropdown<string>
                  value={departmentFilter}
                  onChange={(val) => setDepartmentFilter(val)}
                  options={departmentOptions}
                  placeholder="Filter by Department..."
                  size="sm"
                />
              </div>

              {/* Status Filter */}
              <div className="w-full sm:w-44">
                <SelectDropdown<"all" | "active" | "inactive">
                  value={statusFilter}
                  onChange={(val) => setStatusFilter(val)}
                  options={STATUS_FILTER_OPTIONS}
                  size="sm"
                />
              </div>
            </div>
          </div>

          {/* Next Line: Medium Navy Blue Refresh Button */}
          <div className="pt-2 flex justify-end border-t border-gray-100 w-full">
            <button
              type="button"
              onClick={() => {
                refetchTeams();
                refetchDepts();
                setActionSuccessMessage("Refreshed team list!");
                setTimeout(() => setActionSuccessMessage(null), 3000);
              }}
              className="h-8 px-3.5 bg-[#2B4C7E] hover:bg-[#1F3864] text-white rounded-lg text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 shrink-0 active:scale-[0.98] cursor-pointer"
              title="Refresh Teams List"
            >
              <span className={`material-symbols-outlined text-[16px] ${isFetchingTeams ? "animate-spin" : ""}`}>
                refresh
              </span>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Teams List (Responsive: Desktop Table / Mobile Separate Cards) */}
        <div>
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2 text-gray-500 text-xs">
              <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Loading teams...
            </div>
          ) : filteredTeams.length === 0 ? (
            <div className="py-16 text-center text-xs text-gray-500">
              <span className="material-symbols-outlined text-[36px] text-gray-300 block mb-1">
                groups_3
              </span>
              No teams found matching your filter criteria.
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE (Hidden on mobile screens) */}
              <div className="hidden md:block w-full overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[#F9FAFB] text-gray-600 text-[11px] uppercase tracking-wider font-semibold border-b border-[#E5E7EB]">
                      <th className="px-4 py-3">Team Name</th>
                      <th className="px-4 py-3">Department</th>
                      <th className="px-4 py-3">Lead Email</th>
                      <th className="px-4 py-3">Members</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F2F5] text-xs text-[#1A1A1A]">
                    {filteredTeams.map((t, idx) => {
                      const initials = t.name
                        .split(" ")
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase();
                      const badgeColor = getTeamBadgeColor(idx);
                      const memberCount = t._count?.members || 0;
                      const isActive = t.status === "ACTIVE";

                      return (
                        <tr
                          key={t.id}
                          onClick={() => setSelectedTeamForRoster(t)}
                          className="hover:bg-gray-50/70 transition-colors cursor-pointer group"
                        >
                          <td className="px-4 py-3.5 font-medium text-[#1F3864]">
                            <div className="flex items-center gap-3">
                              <span
                                className={`w-7 h-7 rounded-lg ${badgeColor} flex items-center justify-center font-bold text-xs shadow-xs`}
                              >
                                {initials}
                              </span>
                              <div>
                                <span className="block font-semibold group-hover:text-[#0e61a1] transition-colors">
                                  {t.name}
                                </span>
                                <span className="text-[11px] text-gray-500 line-clamp-1">
                                  {t.description || "Operational Unit"}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3.5 text-gray-700">
                            {t.department?.name || "—"}
                          </td>

                          <td className="px-4 py-3.5 font-mono text-[#0e61a1]">
                            {t.teamAdminEmail}
                          </td>

                          <td className="px-4 py-3.5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 font-semibold text-[11px]">
                              <span className="material-symbols-outlined text-[14px]">
                                person
                              </span>
                              <span>{memberCount} members</span>
                            </span>
                          </td>

                          <td className="px-4 py-3.5">
                            {isActive ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[11px] border border-emerald-100">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span>Active</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-semibold text-[11px] border border-gray-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                <span>Archived</span>
                              </span>
                            )}
                          </td>

                          <td
                            className="px-4 py-3.5 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="inline-flex items-center gap-1">
                              {/* View Roster */}
                              <button
                                type="button"
                                onClick={() => setSelectedTeamForRoster(t)}
                                title="View Roster Drawer"
                                className="p-1 rounded text-[#0e61a1] hover:bg-blue-50 transition-colors"
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  group
                                </span>
                              </button>

                              {/* Change Department */}
                              <button
                                type="button"
                                onClick={() => setSelectedTeamForReassign(t)}
                                title="Change Department"
                                className="p-1 rounded text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  swap_horiz
                                </span>
                              </button>

                              {/* Edit Team */}
                              <button
                                type="button"
                                onClick={() => setSelectedTeamForEdit(t)}
                                title="Edit Team"
                                className="p-1 rounded text-gray-600 hover:bg-gray-100 transition-colors"
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  edit
                                </span>
                              </button>

                              {/* Archive / Restore Team */}
                              {isActive ? (
                                <button
                                  type="button"
                                  onClick={() => openConfirmModal(t, "archive")}
                                  title="Archive / Retire Team"
                                  className="p-1 rounded text-amber-600 hover:bg-amber-50 transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[18px]">
                                    archive
                                  </span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    openConfirmModal(t, "unarchive")
                                  }
                                  title="Unarchive / Restore Team"
                                  className="p-1 rounded text-emerald-600 hover:bg-emerald-50 transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[18px]">
                                    unarchive
                                  </span>
                                </button>
                              )}

                              {/* Permanently Delete Team (Only visible when archived) */}
                              {!isActive && (
                                <button
                                  type="button"
                                  onClick={() => openConfirmModal(t, "delete")}
                                  title="Permanently Delete Team"
                                  className="p-1 rounded text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[18px]">
                                    delete
                                  </span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* MOBILE SEPARATE CARDS (Visible only on mobile < md) */}
              <div className="block md:hidden p-3 space-y-3 bg-[#F9FAFB]/40">
                {filteredTeams.map((t, idx) => {
                  const initials = t.name
                    .split(" ")
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();
                  const badgeColor = getTeamBadgeColor(idx);
                  const memberCount = t._count?.members || 0;
                  const isActive = t.status === "ACTIVE";

                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTeamForRoster(t)}
                      className="bg-white rounded-xl p-3.5 border border-[#E5E7EB] shadow-xs active:scale-[0.99] cursor-pointer hover:border-[#0e61a1]/40 transition-all flex flex-col space-y-3"
                    >
                      {/* Card Header: Badge, Name, Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-9 h-9 rounded-lg ${badgeColor} flex items-center justify-center font-bold text-xs shadow-xs shrink-0`}
                          >
                            {initials}
                          </span>
                          <div>
                            <h3 className="font-semibold text-sm text-[#1F3864] leading-tight">
                              {t.name}
                            </h3>
                            <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                              {t.description || "Operational Unit"}
                            </p>
                          </div>
                        </div>

                        <div>
                          {isActive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[10px] border border-emerald-100 shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span>Active</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-semibold text-[10px] border border-gray-200 shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                              <span>Archived</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Metadata Grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs pt-1.5 border-t border-gray-100">
                        <div>
                          <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                            Department
                          </span>
                          <span className="font-medium text-gray-700 truncate block">
                            {t.department?.name || "—"}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                            Members
                          </span>
                          <span className="inline-flex items-center gap-1 text-gray-700 font-medium">
                            <span className="material-symbols-outlined text-[13px] text-gray-400">
                              group
                            </span>
                            {memberCount}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                            Lead Operator
                          </span>
                          <span className="font-mono text-[11px] text-[#0e61a1] truncate block">
                            {t.teamAdminEmail}
                          </span>
                        </div>
                      </div>

                      {/* Card Actions Footer */}
                      <div
                        className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedTeamForRoster(t)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#0e61a1] bg-blue-50/70 hover:bg-blue-100 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[15px]">
                            group
                          </span>
                          <span>Roster</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedTeamForReassign(t)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[15px]">
                            swap_horiz
                          </span>
                          <span>Dept</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedTeamForEdit(t)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[15px]">
                            edit
                          </span>
                          <span>Edit</span>
                        </button>
                        {isActive ? (
                          <button
                            type="button"
                            onClick={() => openConfirmModal(t, "archive")}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[15px]">
                              archive
                            </span>
                            <span>Archive</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openConfirmModal(t, "unarchive")}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[15px]">
                              unarchive
                            </span>
                            <span>Restore</span>
                          </button>
                        )}
                        {!isActive && (
                          <button
                            type="button"
                            onClick={() => openConfirmModal(t, "delete")}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[15px]">
                              delete
                            </span>
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-[#F9FAFB] border-t border-[#E5E7EB] flex items-center justify-between text-xs text-gray-500 font-medium">
          <span>
            Showing {filteredTeams.length} of {teams.length} operational teams
          </span>
          <span>Click any row to view and manage its member roster</span>
        </div>
      </div>

      {/* Modals & Drawer */}
      <CreateTeamModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => showToast("New team created successfully!")}
      />

      <EditTeamModal
        team={selectedTeamForEdit}
        isOpen={!!selectedTeamForEdit}
        onClose={() => setSelectedTeamForEdit(null)}
        onSuccess={() => showToast("Team configuration updated successfully!")}
      />

      <TeamRosterDrawer
        team={selectedTeamForRoster}
        isOpen={!!selectedTeamForRoster}
        onClose={() => setSelectedTeamForRoster(null)}
      />

      <ReassignDepartmentModal
        isOpen={isReassignOpen || !!selectedTeamForReassign}
        initialTeam={selectedTeamForReassign}
        onClose={() => {
          setIsReassignOpen(false);
          setSelectedTeamForReassign(null);
        }}
        onSuccess={(msg) => showToast(msg)}
      />

      {/* Styled Archive / Unarchive / Permanent Delete Confirmation Modal */}
      {confirmModal.isOpen &&
        confirmModal.team &&
        createPortal(
          <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 !m-0 z-[100] bg-[#0F1B2D]/50 backdrop-blur-[8px] flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-[0_25px_60px_-12px_rgba(0,0,0,0.4)] max-w-md w-full overflow-hidden border border-[#E2E8F0] flex flex-col animate-in zoom-in-95 duration-150">
              {/* Gradient Header Accent */}
              <div
                className={`h-1.5 ${
                  confirmModal.type === "delete"
                    ? "bg-gradient-to-r from-red-600 via-red-500 to-rose-600"
                    : confirmModal.type === "archive"
                    ? "bg-gradient-to-r from-amber-500 via-amber-400 to-orange-400"
                    : "bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400"
                }`}
              />

              <div className="p-7 space-y-5">
                {/* Header with Icon */}
                <div className="flex items-start gap-4">
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                      confirmModal.type === "delete"
                        ? "bg-gradient-to-br from-red-100 to-red-200 text-red-600 border border-red-300"
                        : confirmModal.type === "archive"
                        ? "bg-gradient-to-br from-amber-50 to-amber-100 text-amber-600 border border-amber-200"
                        : "bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600 border border-emerald-200"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[28px]">
                      {confirmModal.type === "delete"
                        ? "delete_forever"
                        : confirmModal.type === "archive"
                        ? "archive"
                        : "unarchive"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-[#1A1A1A] tracking-tight">
                      {confirmModal.type === "delete"
                        ? `Permanently Delete Team "${confirmModal.team.name}"?`
                        : confirmModal.type === "archive"
                        ? `Archive Team "${confirmModal.team.name}"?`
                        : `Restore Team "${confirmModal.team.name}"?`}
                    </h3>
                    <p className="text-sm text-[#64748B] mt-1.5 leading-relaxed">
                      {confirmModal.type === "delete"
                        ? `Are you sure you want to permanently delete this team? This action cannot be undone.`
                        : confirmModal.type === "archive"
                        ? `This operational unit will stop receiving newly dispatched tickets and will be hidden from default triage dropdowns. All historical ticket associations remain fully preserved.`
                        : `This team will be reactivated immediately, resuming operational capacity and appearing in active ticket triage queues.`}
                    </p>
                  </div>
                </div>

                {/* Error banner if action fails */}
                {confirmModal.error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-sm text-red-700 shadow-sm">
                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px] text-red-600">
                        error
                      </span>
                    </div>
                    <span>{confirmModal.error}</span>
                  </div>
                )}

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EEF1F5]">
                  <button
                    type="button"
                    disabled={confirmModal.isLoading}
                    onClick={() =>
                      setConfirmModal((prev) => ({ ...prev, isOpen: false }))
                    }
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-700 border border-[#D1D5DB] hover:bg-gray-50 transition-all duration-150 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={confirmModal.isLoading}
                    onClick={handleConfirmAction}
                    className={`px-6 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:shadow-lg flex items-center gap-2 transition-all duration-150 disabled:opacity-50 active:scale-[0.99] ${
                      confirmModal.type === "delete"
                        ? "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
                        : confirmModal.type === "archive"
                        ? "bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600"
                        : "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600"
                    }`}
                  >
                    {confirmModal.isLoading && (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    )}
                    <span className="material-symbols-outlined text-[18px]">
                      {confirmModal.type === "delete"
                        ? "delete"
                        : confirmModal.type === "archive"
                        ? "archive"
                        : "unarchive"}
                    </span>
                    <span>
                      {confirmModal.isLoading
                        ? confirmModal.type === "delete"
                          ? "Deleting..."
                          : confirmModal.type === "archive"
                          ? "Archiving..."
                          : "Restoring..."
                        : confirmModal.type === "delete"
                        ? "Permanently Delete"
                        : confirmModal.type === "archive"
                        ? "Archive Team"
                        : "Restore Team"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};
