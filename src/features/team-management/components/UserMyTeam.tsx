import React, { useState, useEffect, useMemo } from "react";
import {
  useTeamsQuery,
  useTeamDetailQuery,
  useTeamStatusesQuery,
  useUpdateTeamStatusMutation,
  useRetireTeamStatusMutation,
  useDeleteTeamStatusPermanentlyMutation,
} from "../api";
import { TeamStatusItem } from "../types";
import { CreateStatusModal } from "./CreateStatusModal";
import { EditTeamStatusModal } from "./EditTeamStatusModal";
import { ConfirmActionModal } from "@/features/priority-status-management/components/ConfirmActionModal";
import { StatCard } from "@/shared/components";

export const UserMyTeam: React.FC = () => {
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [isNewStatusOpen, setIsNewStatusOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<TeamStatusItem | null>(null);
  const [isEditStatusOpen, setIsEditStatusOpen] = useState(false);
  const [retiringStatus, setRetiringStatus] = useState<TeamStatusItem | null>(null);
  const [isRetireModalOpen, setIsRetireModalOpen] = useState(false);
  const [restoringStatus, setRestoringStatus] = useState<TeamStatusItem | null>(null);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [deletingStatus, setDeletingStatus] = useState<TeamStatusItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"ACTIVE" | "ARCHIVED" | "ALL">("ACTIVE");
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const updateStatusMutation = useUpdateTeamStatusMutation();
  const retireStatusMutation = useRetireTeamStatusMutation();
  const deleteTeamStatusMutation = useDeleteTeamStatusPermanentlyMutation();

  // User query: explicitly query caller's active teams
  const { data: myTeams = [], isLoading: isTeamsLoading } = useTeamsQuery({
    myTeamsOnly: true,
  });

  // Set default team
  useEffect(() => {
    if (myTeams.length > 0 && selectedTeamId === null) {
      setSelectedTeamId(myTeams[0].id);
    }
  }, [myTeams, selectedTeamId]);

  // Team detail query
  const { data: currentTeam, isLoading: isTeamDetailLoading } =
    useTeamDetailQuery(selectedTeamId);

  // Statuses for this team (includes inactive so user can toggle between Active/Archived/All)
  const { data: teamStatuses = [], isLoading: isStatusesLoading } =
    useTeamStatusesQuery(selectedTeamId, true);

  const activeStatusesCount = useMemo(
    () => teamStatuses.filter((s) => s.status !== "INACTIVE").length,
    [teamStatuses],
  );

  const archivedStatusesCount = useMemo(
    () => teamStatuses.filter((s) => s.status === "INACTIVE").length,
    [teamStatuses],
  );

  const filteredStatuses = useMemo(() => {
    return teamStatuses.filter((s) => {
      const isArchived = s.status === "INACTIVE";
      if (statusFilter === "ACTIVE") return !isArchived;
      if (statusFilter === "ARCHIVED") return isArchived;
      return true;
    });
  }, [teamStatuses, statusFilter]);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  if (isTeamsLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-2 text-gray-500 text-xs">
        <span className="w-6 h-6 border-2 border-[#1F3864] border-t-transparent rounded-full animate-spin" />
        Loading your team workspace...
      </div>
    );
  }

  if (myTeams.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] p-12 text-center max-w-lg mx-auto mt-8">
        <span className="material-symbols-outlined text-[48px] text-gray-300 mb-3 block">
          group_off
        </span>
        <h2 className="text-lg font-bold text-[#1A1A1A]">
          No Team Assignment Found
        </h2>
        <p className="text-xs text-gray-500 mt-1 mb-6">
          You are not currently assigned to any active team. Please contact your administrator.
        </p>
      </div>
    );
  }

  const activeMembers =
    currentTeam?.members?.filter((m) => m.removedAt === null) || [];

  const getLifecycleBadge = (behavior: string) => {
    switch (behavior) {
      case "OPEN":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "IN_PROGRESS":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "ON_HOLD":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "RESOLVED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "CLOSED":
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getLifecycleDot = (behavior: string) => {
    switch (behavior) {
      case "OPEN":
        return "bg-[#1E88E5]";
      case "IN_PROGRESS":
        return "bg-[#FB8C00]";
      case "ON_HOLD":
        return "bg-[#8E24AA]";
      case "RESOLVED":
        return "bg-[#43A047]";
      case "CLOSED":
      default:
        return "bg-[#747780]";
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-[#1F3864] text-white rounded-lg shadow-xl text-xs font-semibold animate-in slide-in-from-bottom">
          <span className="material-symbols-outlined text-emerald-400 text-[18px]">
            check_circle
          </span>
          <span>{successToast}</span>
        </div>
      )}

      {/* Clean Header & Breadcrumbs (Zero redundant text) */}
      <div className="flex flex-col space-y-1">
        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
          <span>Home</span>
          <span className="material-symbols-outlined text-[14px]">
            chevron_right
          </span>
          <span className="text-[#1F3864] font-semibold">My Team</span>
        </div>
        <h1 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">
          {currentTeam?.name || "My Team"}
        </h1>
      </div>

      {/* TOP ROW: 4 KPI Cards (Strictly 2 per row on mobile, 4 per row on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <StatCard
          title="Team Unit"
          count={currentTeam?.name || "—"}
          icon="groups"
          accentColor="#1F3864"
          subtitle={currentTeam?.description || "Operational Unit"}
        />
        <StatCard
          title="Department"
          count={currentTeam?.department?.name || "—"}
          icon="corporate_fare"
          accentColor="#1E88E5"
          subtitle={`Dept ID: #${currentTeam?.departmentId || "—"}`}
          subtitleColor="#1E88E5"
        />
        <StatCard
          title="Team Lead"
          count={currentTeam?.teamAdminEmail ? currentTeam.teamAdminEmail.split("@")[0].replace(".", " ") : "Primary Lead"}
          icon="military_tech"
          accentColor="#FB8C00"
          subtitle={currentTeam?.teamAdminEmail || "Not assigned"}
          subtitleColor="#FB8C00"
        />
        <StatCard
          title="Active Members"
          count={activeMembers.length}
          icon="person_check"
          accentColor="#43A047"
          subtitle="Team Strength"
          subtitleColor="#43A047"
        />
      </div>

      {/* TEAM MEMBER DETAILS SECTION */}
      <div className="bg-white rounded-xl shadow-xs border border-[#E5E7EB] overflow-hidden">
        {/* Section Header */}
        <div className="p-4 sm:p-5 bg-white border-b border-[#F0F2F5] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1F3864]/10 text-[#1F3864] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">badge</span>
            </div>
            <h2 className="font-bold text-base text-[#1A1A1A]">Team Member Details</h2>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 font-semibold border border-gray-200">
            {activeMembers.length} Members
          </span>
        </div>

        {/* Team Members List */}
        {isTeamDetailLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-xs text-gray-500 gap-2">
            <span className="w-5 h-5 border-2 border-[#1F3864] border-t-transparent rounded-full animate-spin" />
            Loading team member details...
          </div>
        ) : activeMembers.length === 0 ? (
          <div className="py-10 text-center text-xs text-gray-500">
            No team members currently assigned to this team.
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAFBFD] border-b border-[#F0F2F5] text-gray-500 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4 sm:px-6 w-[35%] min-w-[200px]">Member</th>
                  <th className="py-3 px-4 sm:px-6 w-[25%] min-w-[180px]">Email</th>
                  <th className="py-3 px-4 sm:px-6 w-[15%] min-w-[120px]">Role</th>
                  <th className="py-3 px-4 sm:px-6 w-[15%] min-w-[120px]">Joined</th>
                  <th className="py-3 px-4 sm:px-6 w-[10%] min-w-[90px] text-right sm:text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F2F5] text-xs">
                {activeMembers.map((m) => {
                  const initials = (m.user?.name || m.user?.username || "U")
                    .split(" ")
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();
                  const isLead =
                    m.user?.email?.toLowerCase() ===
                    currentTeam?.teamAdminEmail?.toLowerCase();

                  return (
                    <tr
                      key={m.id}
                      className="hover:bg-gray-50/60 transition-colors"
                    >
                      {/* Member: Avatar + Name */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-[#1F3864] to-[#2B5EA7] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <span
                              className="font-bold text-sm text-[#1A1A1A] block truncate"
                              title={m.user?.name || m.user?.username}
                            >
                              {m.user?.name || m.user?.username}
                            </span>
                            <span className="text-[11px] text-gray-400 block truncate">
                              @{m.user?.username || "user"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td
                        className="py-3.5 px-4 sm:px-6 font-mono text-gray-500 truncate"
                        title={m.user?.email}
                      >
                        {m.user?.email || "—"}
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4 sm:px-6">
                        {isLead ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#1F3864]/10 text-[#1F3864] text-[11px] font-bold border border-[#1F3864]/20">
                            Team Lead
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[11px] font-medium">
                            {m.user?.userRole?.name || "Specialist"}
                          </span>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td className="py-3.5 px-4 sm:px-6 text-gray-500">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span className="material-symbols-outlined text-[14px] text-gray-400">
                            calendar_today
                          </span>
                          <span>
                            {m.joinedAt
                              ? new Date(m.joinedAt).toLocaleDateString()
                              : "—"}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 sm:px-6 text-right sm:text-left">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
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

      {/* TEAM WORKFLOW STATUSES SECTION */}
      <div className="bg-white rounded-xl shadow-xs border border-[#E5E7EB] overflow-hidden">
        {/* Section Header */}
        <div className="p-4 sm:p-5 bg-white border-b border-[#F0F2F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1E88E5] flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">
                  account_tree
                </span>
              </div>
              <h2 className="font-bold text-base text-[#1A1A1A]">
                Team Workflow Statuses
              </h2>
            </div>

            {/* Filter Pills */}
            <div className="inline-flex p-0.5 bg-[#F0F2F5] rounded-lg border border-[#E5E7EB] text-xs font-medium">
              <button
                type="button"
                onClick={() => setStatusFilter("ACTIVE")}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  statusFilter === "ACTIVE"
                    ? "bg-white text-[#1F3864] font-semibold shadow-xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Active ({activeStatusesCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("ARCHIVED")}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  statusFilter === "ARCHIVED"
                    ? "bg-white text-amber-700 font-semibold shadow-xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Archived ({archivedStatusesCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("ALL")}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  statusFilter === "ALL"
                    ? "bg-white text-[#1F3864] font-semibold shadow-xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                All ({teamStatuses.length})
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsNewStatusOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1F3864] hover:bg-[#152747] text-white rounded-lg text-xs font-semibold shadow-xs transition-all active:scale-[0.98] self-start sm:self-auto cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>New Status</span>
          </button>
        </div>

        {/* Statuses List */}
        <div className="min-h-[160px]">
          {isStatusesLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-xs text-gray-500 gap-2">
              <span className="w-5 h-5 border-2 border-[#1F3864] border-t-transparent rounded-full animate-spin" />
              Loading workflow statuses...
            </div>
          ) : filteredStatuses.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-500">
              {statusFilter === "ARCHIVED"
                ? "No archived workflow statuses for this team."
                : statusFilter === "ACTIVE"
                ? "No active workflow statuses configured for this team."
                : "No custom workflow statuses configured for this team."}
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="bg-[#FAFBFD] border-b border-[#F0F2F5] text-gray-500 font-semibold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4 sm:px-6 w-[35%] min-w-[200px]">Custom Label</th>
                    <th className="py-3 px-4 sm:px-6 w-[20%] min-w-[140px]">Mapped Lifecycle</th>
                    <th className="py-3 px-4 sm:px-6 w-[15%] min-w-[110px]">State</th>
                    <th className="py-3 px-4 sm:px-6 w-[15%] min-w-[120px]">Scope</th>
                    <th className="py-3 px-4 sm:px-6 w-[15%] min-w-[110px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F2F5] text-xs">
                  {filteredStatuses.map((s) => {
                    const dotColor = getLifecycleDot(s.behavior);
                    const badgeClass = getLifecycleBadge(s.behavior);
                    const isTeamSpecific = Boolean(s.teamId);
                    const isArchived = s.status === "INACTIVE";

                    return (
                      <tr
                        key={s.id}
                        className={`hover:bg-gray-50/60 transition-colors ${
                          isArchived ? "bg-amber-50/20 opacity-80" : ""
                        }`}
                      >
                        {/* Column 1: Custom Label */}
                        <td className="py-3.5 px-4 sm:px-6">
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor}`}
                            />
                            <div className="min-w-0">
                              <span
                                className={`font-bold text-sm block truncate ${
                                  isArchived ? "text-gray-500 line-through" : "text-[#1A1A1A]"
                                }`}
                                title={s.label}
                              >
                                {s.label}
                              </span>
                              {s.description && (
                                <span className="text-xs text-gray-500 line-clamp-1 block mt-0.5">
                                  {s.description}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Column 2: Mapped Lifecycle */}
                        <td className="py-3.5 px-4 sm:px-6">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[11px] font-bold uppercase tracking-wider ${badgeClass}`}
                          >
                            {s.behavior.replace("_", " ")}
                          </span>
                        </td>

                        {/* Column 3: State (Active / Archived) */}
                        <td className="py-3.5 px-4 sm:px-6">
                          {isArchived ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Archived
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          )}
                        </td>

                        {/* Column 4: Scope */}
                        <td className="py-3.5 px-4 sm:px-6">
                          {isTeamSpecific ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-[#0e61a1] border border-blue-100">
                              {currentTeam?.name}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                              Global Default
                            </span>
                          )}
                        </td>

                        {/* Column 5: Actions */}
                        <td className="py-3.5 px-4 sm:px-6 text-right">
                          {isTeamSpecific ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingStatus(s);
                                  setIsEditStatusOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-gray-500 hover:text-[#1F3864] hover:bg-gray-100 transition-all cursor-pointer"
                                title="Edit Workflow Status"
                              >
                                <span className="material-symbols-outlined text-[17px]">edit</span>
                              </button>
                              {isArchived ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRestoringStatus(s);
                                      setIsRestoreModalOpen(true);
                                    }}
                                    className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition-all cursor-pointer"
                                    title="Restore Workflow Status"
                                  >
                                    <span className="material-symbols-outlined text-[17px]">unarchive</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDeletingStatus(s);
                                      setIsDeleteModalOpen(true);
                                    }}
                                    className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition-all cursor-pointer"
                                    title="Permanently Delete Workflow Status"
                                  >
                                    <span className="material-symbols-outlined text-[17px]">delete_forever</span>
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRetiringStatus(s);
                                    setIsRetireModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg text-amber-600 hover:text-amber-800 hover:bg-amber-50 transition-all cursor-pointer"
                                  title="Archive Workflow Status"
                                >
                                  <span className="material-symbols-outlined text-[17px]">archive</span>
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1 text-gray-400" title="Global statuses are managed by administrators">
                              <span className="material-symbols-outlined text-[15px]">lock</span>
                              <span className="text-[11px] font-medium">Default</span>
                            </div>
                          )}
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

      {/* New Status Modal */}
      {currentTeam && (
        <CreateStatusModal
          teamId={currentTeam.id}
          teamName={currentTeam.name}
          isOpen={isNewStatusOpen}
          onClose={() => setIsNewStatusOpen(false)}
          onSuccess={() => showToast("New workflow status created successfully!")}
        />
      )}

      {/* Edit Status Modal */}
      {currentTeam && (
        <EditTeamStatusModal
          statusItem={editingStatus}
          teamName={currentTeam.name}
          isOpen={isEditStatusOpen}
          onClose={() => {
            setIsEditStatusOpen(false);
            setEditingStatus(null);
          }}
          onSuccess={() => showToast("Workflow status updated successfully!")}
        />
      )}

      {/* Retire Status Modal */}
      <ConfirmActionModal
        isOpen={isRetireModalOpen}
        title="Archive Workflow Status"
        message={`Are you sure you want to archive workflow status "${retiringStatus?.label}"? It will no longer appear for newly created tickets.`}
        confirmLabel="Archive"
        confirmVariant="warning"
        isLoading={retireStatusMutation.isPending}
        onConfirm={async () => {
          if (!retiringStatus) return;
          try {
            await retireStatusMutation.mutateAsync({
              id: retiringStatus.id,
              teamId: currentTeam?.id,
            });
            showToast(`Workflow status "${retiringStatus.label}" archived successfully.`);
            setIsRetireModalOpen(false);
            setRetiringStatus(null);
          } catch (err: any) {
            showToast(err?.response?.data?.message || "Failed to archive status");
          }
        }}
        onClose={() => {
          setIsRetireModalOpen(false);
          setRetiringStatus(null);
        }}
      />

      {/* Restore Status Modal */}
      <ConfirmActionModal
        isOpen={isRestoreModalOpen}
        title="Restore Workflow Status"
        message={`Are you sure you want to restore workflow status "${restoringStatus?.label}"? It will become active again for team tickets.`}
        confirmLabel="Restore"
        confirmVariant="primary"
        isLoading={updateStatusMutation.isPending}
        onConfirm={async () => {
          if (!restoringStatus) return;
          try {
            await updateStatusMutation.mutateAsync({
              id: restoringStatus.id,
              status: "ACTIVE",
              teamId: currentTeam?.id,
            });
            showToast(`Workflow status "${restoringStatus.label}" restored successfully.`);
            setIsRestoreModalOpen(false);
            setRestoringStatus(null);
          } catch (err: any) {
            showToast(err?.response?.data?.message || "Failed to restore status");
          }
        }}
        onClose={() => {
          setIsRestoreModalOpen(false);
          setRestoringStatus(null);
        }}
      />

      {/* Delete Status Permanently Modal */}
      <ConfirmActionModal
        isOpen={isDeleteModalOpen}
        title="Permanently Delete Workflow Status"
        message={`Are you sure you want to permanently delete workflow status "${deletingStatus?.label}"? This action cannot be undone.`}
        confirmLabel="Delete Permanently"
        confirmVariant="danger"
        isLoading={deleteTeamStatusMutation.isPending}
        onConfirm={async () => {
          if (!deletingStatus) return;
          try {
            await deleteTeamStatusMutation.mutateAsync({
              id: deletingStatus.id,
              teamId: currentTeam?.id,
            });
            showToast(`Workflow status "${deletingStatus.label}" permanently deleted.`);
            setIsDeleteModalOpen(false);
            setDeletingStatus(null);
          } catch (err: any) {
            showToast(err?.response?.data?.message || "Failed to delete status");
          }
        }}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingStatus(null);
        }}
      />
    </div>
  );
};

export default UserMyTeam;
