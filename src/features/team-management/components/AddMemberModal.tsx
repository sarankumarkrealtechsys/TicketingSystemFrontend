import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useDepartmentUsersQuery, useBulkAddTeamMembersMutation } from "../api";
import { TeamMemberItem } from "../types";

interface AddMemberModalProps {
  teamId: number;
  departmentId: number;
  departmentName?: string;
  teamName?: string;
  existingMembers?: TeamMemberItem[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  teamId,
  departmentId,
  departmentName = "Department",
  teamName,
  existingMembers = [],
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: deptUsers = [], isLoading: isUsersLoading } =
    useDepartmentUsersQuery(departmentId > 0 ? departmentId : undefined);
  const bulkAddMutation = useBulkAddTeamMembersMutation();

  if (!isOpen) return null;

  // Filter out existing active members and strictly enforce department membership
  const existingUserIds = new Set(
    existingMembers
      .filter((m) => m.removedAt === null)
      .map((m) => m.userId || m.user?.id),
  );

  const availableUsers = deptUsers.filter(
    (u) =>
      Number(u.departmentId) === Number(departmentId) &&
      !existingUserIds.has(u.id) &&
      u.status === "ACTIVE",
  );

  // Filter by search query
  const filteredUsers = searchQuery.trim()
    ? availableUsers.filter((u) => {
        const q = searchQuery.toLowerCase();
        return (
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.userRole?.name?.toLowerCase().includes(q)
        );
      })
    : availableUsers;

  const handleToggleUser = (userId: number) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleSelectAll = () => {
    if (selectedUserIds.length === filteredUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.map((u) => u.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (selectedUserIds.length === 0) {
      setErrorMessage("Please select at least one user to add.");
      return;
    }

    try {
      setIsSubmitting(true);
      await bulkAddMutation.mutateAsync({
        teamId,
        userIds: selectedUserIds,
      });

      setSelectedUserIds([]);
      setSearchQuery("");
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to add members to team.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedUserIds([]);
      setSearchQuery("");
      setErrorMessage("");
      onClose();
    }
  };

  const allSelected =
    filteredUsers.length > 0 && selectedUserIds.length === filteredUsers.length;

  return createPortal(
    <div
      className="fixed inset-0 top-0 left-0 right-0 bottom-0 !m-0 z-[100] flex items-center justify-center p-4 bg-[#0F1B2D]/50 backdrop-blur-[8px] transition-opacity duration-200"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-[0_25px_60px_-12px_rgba(0,0,0,0.4)] w-full max-w-2xl mx-4 overflow-hidden border border-[#E2E8F0] flex flex-col max-h-[88vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient Header Accent */}
        <div className="h-1.5 bg-gradient-to-r from-[#1F3864] via-[#2B5EA7] to-[#0e61a1] shrink-0" />

        {/* Header */}
        <div className="px-7 py-5 bg-gradient-to-b from-[#FAFBFD] to-white border-b border-[#EEF1F5] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1F3864] to-[#2B5EA7] text-white flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-[26px]">
                group_add
              </span>
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#1A1A1A] leading-tight tracking-tight">
                Add Team Members
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                {teamName ? `Adding to ${teamName}` : "Select members to add"}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-100 transition-all duration-150"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="px-7 pt-4 space-y-3 shrink-0">
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2.5 animate-in fade-in shadow-sm">
                <span className="material-symbols-outlined text-[18px] text-red-600 shrink-0">
                  error
                </span>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Department & Team Info Bar */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs">
              <span className="text-gray-500">
                Department: <strong className="text-[#1A1A1A]">{departmentName}</strong>
              </span>
              {teamName && (
                <span className="text-gray-500">
                  Team: <strong className="text-[#1A1A1A]">{teamName}</strong>
                </span>
              )}
            </div>

            {/* Search + Select All Bar */}
            {availableUsers.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, email, or role..."
                    className="w-full h-10 pl-10 pr-4 bg-[#F9FAFB] border border-[#D1D5DB] rounded-xl text-sm text-[#1A1A1A] placeholder:text-gray-400 focus:outline-none focus:border-[#0e61a1] focus:ring-2 focus:ring-[#0e61a1]/15 focus:bg-white transition-all"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="h-10 px-4 rounded-xl border border-[#D1D5DB] text-xs font-semibold text-[#374151] hover:bg-gray-50 transition-all duration-150 flex items-center gap-1.5 whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {allSelected ? "deselect" : "select_all"}
                  </span>
                  <span>{allSelected ? "Deselect All" : "Select All"}</span>
                </button>
              </div>
            )}
          </div>

          {/* Members List — Scrollable */}
          <div className="px-7 py-3 flex-1 min-h-0 overflow-y-auto">
            {isUsersLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-gray-500">
                <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">
                  Loading available members from {departmentName}...
                </span>
              </div>
            ) : availableUsers.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-14 h-14 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-3">
                  <span className="material-symbols-outlined text-[28px] text-amber-500">
                    group_off
                  </span>
                </div>
                <p className="text-sm font-semibold text-[#1A1A1A]">
                  No available members
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  All active specialists in <strong>{departmentName}</strong>{" "}
                  are already assigned to this team.
                </p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-500">
                <span className="material-symbols-outlined text-[28px] text-gray-300 block mb-2">
                  search_off
                </span>
                No members match "{searchQuery}"
              </div>
            ) : (
              <div className="space-y-1.5">
                {filteredUsers.map((u) => {
                  const isSelected = selectedUserIds.includes(u.id);
                  return (
                    <label
                      key={u.id}
                      className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all duration-150 border ${
                        isSelected
                          ? "bg-blue-50/80 border-blue-200 shadow-sm"
                          : "bg-white border-transparent hover:bg-gray-50 hover:border-gray-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleUser(u.id)}
                        className="rounded text-[#1F3864] focus:ring-0 w-4.5 h-4.5 shrink-0"
                      />
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-sm ${
                          isSelected
                            ? "bg-gradient-to-br from-[#1F3864] to-[#2B5EA7] text-white"
                            : "bg-[#1F3864]/10 text-[#1F3864]"
                        }`}
                      >
                        {u.name?.slice(0, 1).toUpperCase() || "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-[#1A1A1A] truncate">
                            {u.name}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600 shrink-0">
                            {u.userRole?.name || "Specialist"}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 font-mono truncate block mt-0.5">
                          {u.email}
                        </span>
                      </div>
                      {isSelected && (
                        <span className="material-symbols-outlined text-[20px] text-[#0e61a1] shrink-0">
                          check_circle
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-7 py-5 border-t border-[#EEF1F5] bg-[#FAFBFD] flex items-center justify-between shrink-0">
            <div className="text-sm text-[#64748B]">
              {selectedUserIds.length > 0 ? (
                <span className="font-semibold text-[#1F3864]">
                  {selectedUserIds.length} member
                  {selectedUserIds.length !== 1 ? "s" : ""} selected
                </span>
              ) : (
                <span>Select members to add</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleClose}
                className="px-5 py-2.5 rounded-xl border border-[#D1D5DB] text-gray-700 hover:bg-gray-50 font-semibold text-sm transition-all duration-150 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || selectedUserIds.length === 0}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#1F3864] to-[#2B5EA7] hover:from-[#152747] hover:to-[#1F4A8A] text-white font-semibold text-sm flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-150 disabled:opacity-50 active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>
                      Adding {selectedUserIds.length}{" "}
                      {selectedUserIds.length === 1 ? "Member" : "Members"}...
                    </span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">
                      group_add
                    </span>
                    <span>
                      Add{" "}
                      {selectedUserIds.length > 0
                        ? `${selectedUserIds.length} Member${selectedUserIds.length !== 1 ? "s" : ""}`
                        : "to Roster"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};

export default AddMemberModal;
