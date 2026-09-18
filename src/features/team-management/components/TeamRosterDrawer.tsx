import React, { useState } from "react";
import { createPortal } from "react-dom";
import { TeamItem } from "../types";
import { useTeamDetailQuery, useBulkRemoveTeamMembersMutation } from "../api";
import { AddMemberModal } from "./AddMemberModal";

interface TeamRosterDrawerProps {
  team: TeamItem | null;
  isOpen: boolean;
  onClose: () => void;
}

interface MemberToRemove {
  id: number;
  name: string;
  email?: string;
  role?: string;
  isLead?: boolean;
}

export const TeamRosterDrawer: React.FC<TeamRosterDrawerProps> = ({
  team,
  isOpen,
  onClose,
}) => {
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(
    new Set(),
  );

  // Styled Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    members: MemberToRemove[];
    isLoading: boolean;
    error: string | null;
  }>({
    isOpen: false,
    members: [],
    isLoading: false,
    error: null,
  });

  const teamId = team?.id || null;
  const { data: teamDetail, isLoading } = useTeamDetailQuery(teamId);
  const bulkRemoveMutation = useBulkRemoveTeamMembersMutation();

  if (!isOpen || !team) return null;

  const activeMembers =
    teamDetail?.members?.filter((m) => m.removedAt === null) || [];

  const allActiveUserIds = activeMembers
    .map((m) => m.userId || m.user?.id)
    .filter(Boolean) as number[];

  const isAllSelected =
    allActiveUserIds.length > 0 &&
    allActiveUserIds.every((id) => selectedUserIds.has(id));

  const toggleSelectMember = (userId: number) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(allActiveUserIds));
    }
  };

  const openSingleRemoveModal = (member: MemberToRemove) => {
    setConfirmModal({
      isOpen: true,
      members: [member],
      isLoading: false,
      error: null,
    });
  };

  const openBulkRemoveModal = () => {
    const membersToRemove: MemberToRemove[] = activeMembers
      .filter((m) => selectedUserIds.has(m.userId || m.user?.id))
      .map((m) => {
        const u = m.user;
        const isLead =
          u?.email?.toLowerCase() === team.teamAdminEmail?.toLowerCase();
        return {
          id: m.userId || u?.id,
          name: u?.name || "User",
          email: u?.email,
          role: u?.userRole?.name || "Specialist",
          isLead,
        };
      });

    if (membersToRemove.length === 0) return;

    setConfirmModal({
      isOpen: true,
      members: membersToRemove,
      isLoading: false,
      error: null,
    });
  };

  const handleExecuteRemoval = async () => {
    if (!team || confirmModal.members.length === 0) return;

    setConfirmModal((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      await bulkRemoveMutation.mutateAsync({
        teamId: team.id,
        userIds: confirmModal.members.map((m) => m.id),
      });

      // Remove successfully processed members from selection
      setSelectedUserIds((prev) => {
        const next = new Set(prev);
        confirmModal.members.forEach((m) => next.delete(m.id));
        return next;
      });

      // Close confirmation modal
      setConfirmModal({
        isOpen: false,
        members: [],
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
          "Failed to remove member(s) from team.",
      }));
    }
  };

  const initials = team.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const departmentId = team.departmentId || teamDetail?.departmentId || 0;
  const departmentName =
    team.department?.name || teamDetail?.department?.name || "Department";

  const hasLeadInRemoval = confirmModal.members.some((m) => m.isLead);

  return (
    <>
      {createPortal(
        /* Backdrop */
        <div
          className="fixed inset-0 top-0 left-0 right-0 bottom-0 !m-0 z-[100] bg-[#0F1B2D]/50 backdrop-blur-[6px] transition-opacity duration-200"
          onClick={onClose}
        >
          {/* Drawer Container */}
          <div
            className="fixed right-0 top-0 h-full w-full max-w-xl bg-white shadow-[0_0_60px_-15px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden transform transition-transform duration-300 animate-in slide-in-from-right"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gradient Header Accent */}
            <div className="h-1.5 bg-gradient-to-r from-[#1F3864] via-[#2B5EA7] to-[#0e61a1] shrink-0" />

            {/* Drawer Header */}
            <div className="px-7 py-5 bg-gradient-to-b from-[#FAFBFD] to-white border-b border-[#EEF1F5] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1F3864] to-[#2B5EA7] text-white flex items-center justify-center font-bold text-base shadow-md">
                  {initials}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#1A1A1A] leading-tight tracking-tight">
                    {team.name} Roster
                  </h3>
                  <p className="text-sm text-[#64748B] mt-0.5">
                    {activeMembers.length} Active Members • {departmentName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-100 transition-all duration-150"
                onClick={onClose}
              >
                <span className="material-symbols-outlined text-[22px]">
                  close
                </span>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-7 py-5 space-y-4">
              {/* Lead Summary Chip */}
              <div className="p-4 bg-gradient-to-r from-[#F8FAFC] to-[#F1F5F9] rounded-xl flex items-center justify-between border border-[#E2E8F0]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#0e61a1]/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px] text-[#0e61a1]">
                      verified_user
                    </span>
                  </div>
                  <span className="text-sm text-[#1A1A1A]">
                    Team Lead:{" "}
                    <span className="font-mono text-[#0e61a1] font-semibold">
                      {team.teamAdminEmail}
                    </span>
                  </span>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                  Active Roster
                </span>
              </div>

              {/* Roster Controls: Add Member + Bulk Actions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-[#374151] uppercase tracking-wider">
                      Roster Members
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600">
                      {activeMembers.length}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddMemberOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#1F3864] to-[#2B5EA7] hover:from-[#152747] hover:to-[#1F4A8A] text-white rounded-xl text-xs font-semibold shadow-md hover:shadow-lg transition-all duration-150 active:scale-[0.99]"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      person_add
                    </span>
                    <span>Add Member</span>
                  </button>
                </div>

                {/* Bulk Selection Action Toolbar */}
                {selectedUserIds.size > 0 && (
                  <div className="p-3 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl flex items-center justify-between shadow-xs animate-in fade-in duration-150">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-red-600 text-white font-bold text-xs flex items-center justify-center">
                        {selectedUserIds.size}
                      </span>
                      <span className="text-xs font-semibold text-red-900">
                        {selectedUserIds.size}{" "}
                        {selectedUserIds.size === 1 ? "member" : "members"}{" "}
                        selected
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedUserIds(new Set())}
                        className="px-2.5 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-white/80 rounded-lg transition-colors"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={openBulkRemoveModal}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs hover:shadow transition-all duration-150 active:scale-[0.99]"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          person_remove
                        </span>
                        <span>Remove Selected</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Members Table */}
              <div className="overflow-x-auto w-full rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
                {isLoading ? (
                  <div className="py-14 flex flex-col items-center justify-center gap-3 text-gray-500 text-sm">
                    <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Loading team roster...
                  </div>
                ) : activeMembers.length === 0 ? (
                  <div className="py-14 text-center text-sm text-gray-500">
                    <span className="material-symbols-outlined text-[36px] text-gray-300 block mb-2">
                      group_off
                    </span>
                    No members assigned to this team yet.
                  </div>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gradient-to-r from-[#F9FAFB] to-[#F1F5F9] border-b border-[#E5E7EB] text-[#64748B] font-semibold text-xs uppercase tracking-wider">
                      <tr>
                        {/* Select All Checkbox */}
                        <th className="py-3 px-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={isAllSelected}
                            onChange={toggleSelectAll}
                            className="rounded text-[#1F3864] focus:ring-0 w-4 h-4 cursor-pointer"
                            title={
                              isAllSelected ? "Deselect all" : "Select all"
                            }
                          />
                        </th>
                        <th className="py-3 px-3">Member</th>
                        <th className="py-3 px-3">Role</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {activeMembers.map((m) => {
                        const memberUser = m.user;
                        const userId = m.userId || memberUser?.id;
                        const isLead =
                          memberUser?.email?.toLowerCase() ===
                          team.teamAdminEmail?.toLowerCase();
                        const isSelected = selectedUserIds.has(userId);

                        return (
                          <tr
                            key={m.id}
                            className={`transition-colors ${
                              isSelected
                                ? "bg-red-50/40 hover:bg-red-50/60"
                                : "hover:bg-[#F8FAFC]"
                            }`}
                          >
                            {/* Row Checkbox */}
                            <td className="py-3 px-3 w-10 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectMember(userId)}
                                className="rounded text-[#1F3864] focus:ring-0 w-4 h-4 cursor-pointer"
                              />
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-xs ${
                                    isSelected
                                      ? "bg-red-100 text-red-700"
                                      : "bg-gradient-to-br from-[#1F3864]/20 to-[#2B5EA7]/10 text-[#1F3864]"
                                  }`}
                                >
                                  {memberUser?.name
                                    ?.slice(0, 1)
                                    .toUpperCase() || "U"}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="font-semibold text-sm text-[#1A1A1A] flex items-center gap-1.5 truncate">
                                    <span>{memberUser?.name}</span>
                                    {isLead && (
                                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-[#0e61a1] font-bold shrink-0">
                                        LEAD
                                      </span>
                                    )}
                                  </span>
                                  <span className="text-xs text-gray-500 truncate">
                                    {memberUser?.email}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <span className="px-2.5 py-1 rounded-md text-xs bg-gray-100 text-gray-700 font-medium">
                                {memberUser?.userRole?.name || "Specialist"}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                type="button"
                                onClick={() =>
                                  openSingleRemoveModal({
                                    id: userId,
                                    name: memberUser?.name || "User",
                                    email: memberUser?.email,
                                    role:
                                      memberUser?.userRole?.name ||
                                      "Specialist",
                                    isLead,
                                  })
                                }
                                className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-all duration-150"
                                title="Remove from team"
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  person_remove
                                </span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-7 py-4 border-t border-[#EEF1F5] bg-[#FAFBFD] flex items-center justify-between text-sm text-gray-500 shrink-0">
              <span className="text-xs">
                Historical tickets &amp; assignments remain preserved upon
                removal
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-semibold text-sm transition-all duration-150"
              >
                Close Panel
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* Styled Confirmation Modal for Member Removal (Single or Batch) */}
      {confirmModal.isOpen &&
        createPortal(
          <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 !m-0 z-[120] bg-[#0F1B2D]/60 backdrop-blur-[8px] flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-[0_25px_60px_-12px_rgba(0,0,0,0.4)] max-w-md w-full overflow-hidden border border-[#E2E8F0] flex flex-col animate-in zoom-in-95 duration-150">
              {/* Red Gradient Accent Top Bar */}
              <div className="h-1.5 bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 shrink-0" />

              <div className="p-7 space-y-5">
                {/* Header with Danger Icon */}
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-50 to-rose-100 text-red-600 border border-red-200 flex items-center justify-center shrink-0 shadow-sm">
                    <span className="material-symbols-outlined text-[28px]">
                      person_remove
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-[#1A1A1A] tracking-tight">
                      {confirmModal.members.length === 1
                        ? `Remove "${confirmModal.members[0]?.name}"?`
                        : `Remove ${confirmModal.members.length} Members?`}
                    </h3>
                    <p className="text-sm text-[#64748B] mt-1 leading-relaxed">
                      {confirmModal.members.length === 1
                        ? `Remove this specialist from "${team.name}"? They will no longer receive ticket dispatches for this team.`
                        : `Remove the ${confirmModal.members.length} selected specialists from "${team.name}"? They will no longer receive ticket dispatches for this team.`}
                    </p>
                  </div>
                </div>

                {/* Team Lead Warning if applicable */}
                {hasLeadInRemoval && (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
                    <span className="material-symbols-outlined text-[18px] text-amber-600 shrink-0">
                      warning
                    </span>
                    <span>
                      <strong>Warning:</strong> The selected members include the
                      Team Lead ({team.teamAdminEmail}). You may need to assign
                      a new team lead.
                    </span>
                  </div>
                )}

                {/* Members preview list */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#64748B]">
                    <span>Affected Members</span>
                    <span>{confirmModal.members.length} total</span>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                    {confirmModal.members.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between px-3 py-2 bg-white rounded-lg border border-gray-100 text-xs shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-6 h-6 rounded-full bg-red-100 text-red-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {m.name.charAt(0).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">
                              {m.name}
                            </p>
                            <p className="text-[11px] text-gray-500 font-mono truncate">
                              {m.email}
                            </p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600 shrink-0 ml-2">
                          {m.role || "Member"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Inline Error Banner */}
                {confirmModal.error && (
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
                    <span className="material-symbols-outlined text-[18px] text-red-600 shrink-0">
                      error
                    </span>
                    <span className="flex-1 leading-relaxed">
                      {confirmModal.error}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EEF1F5]">
                  <button
                    type="button"
                    disabled={confirmModal.isLoading}
                    onClick={() =>
                      setConfirmModal((prev) => ({ ...prev, isOpen: false }))
                    }
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 border border-[#D1D5DB] hover:bg-gray-50 transition-all duration-150 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={confirmModal.isLoading}
                    onClick={handleExecuteRemoval}
                    className="px-5 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl text-xs font-semibold shadow-md hover:shadow-lg flex items-center gap-1.5 transition-all duration-150 disabled:opacity-50 active:scale-[0.99]"
                  >
                    {confirmModal.isLoading ? (
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span className="material-symbols-outlined text-[16px]">
                        person_remove
                      </span>
                    )}
                    <span>
                      {confirmModal.isLoading
                        ? "Removing..."
                        : confirmModal.members.length === 1
                          ? "Remove Member"
                          : `Remove ${confirmModal.members.length} Members`}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        teamId={team.id}
        departmentId={departmentId}
        departmentName={departmentName}
        teamName={team.name}
        existingMembers={teamDetail?.members}
      />
    </>
  );
};

export default TeamRosterDrawer;
