import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useAddUserTeamMutation, useRemoveUserTeamMutation } from "../api";
import { UserListItem } from "../types";
import { useTeamsQuery } from "@/features/team-management";
import { SelectDropdown } from "@/shared/components";


interface ManageUserTeamsModalProps {
  user: UserListItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
}

export const ManageUserTeamsModal: React.FC<ManageUserTeamsModalProps> = ({
  user,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedTeamToAdd, setSelectedTeamToAdd] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const { data: departmentTeams = [], isLoading: isLoadingTeams } =
    useTeamsQuery({
      departmentId: user?.departmentId,
      includeInactive: false,
    });

  const addTeamMutation = useAddUserTeamMutation();
  const removeTeamMutation = useRemoveUserTeamMutation();

  if (!isOpen || !user) return null;

  const currentTeamIds = new Set(user.teams.map((t) => t.id));
  const availableTeams = departmentTeams.filter((t) => !currentTeamIds.has(t.id));

  const handleAddTeam = async () => {
    if (!selectedTeamToAdd) return;
    setError(null);
    try {
      await addTeamMutation.mutateAsync({
        userId: user.id,
        teamId: Number(selectedTeamToAdd),
      });
      setSelectedTeamToAdd("");
      onSuccess?.(`Added to team successfully.`);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to add user to team."
      );
    }
  };

  const handleRemoveTeam = async (teamId: number, teamName: string) => {
    setError(null);
    try {
      await removeTeamMutation.mutateAsync({
        userId: user.id,
        teamId,
      });
      onSuccess?.(`Removed from team "${teamName}".`);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to remove user from team."
      );
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#121E30] rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#1F3864] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[22px] text-blue-300">
              groups
            </span>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                Team Memberships
              </h2>
              <p className="text-[11px] text-blue-200">
                {user.name} ({user.department?.name || "No Dept"})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl flex items-start gap-2.5 text-red-600 dark:text-red-400">
              <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">
                error
              </span>
              <span>{error}</span>
            </div>
          )}

          {/* Current Team Memberships */}
          <div>
            <label className="block font-semibold text-gray-700 dark:text-gray-200 mb-2">
              Active Team Memberships ({user.teams.length})
            </label>
            {user.teams.length === 0 ? (
              <div className="p-4 bg-gray-50 dark:bg-slate-800/40 rounded-xl text-center text-gray-400">
                No active team memberships assigned.
              </div>
            ) : (
              <div className="space-y-1.5">
                {user.teams.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-[#1A283E] border border-gray-200 dark:border-[#283A55] rounded-xl"
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-blue-500">
                        group
                      </span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">
                        {t.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveTeam(t.id, t.name)}
                      disabled={removeTeamMutation.isPending}
                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                      title="Remove from team"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        delete
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add to Team Section */}
          <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
            <label className="block font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
              Assign to New Team
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <SelectDropdown
                  value={selectedTeamToAdd}
                  onChange={(val) => setSelectedTeamToAdd(val)}
                  options={availableTeams.map((team) => ({
                    value: team.id.toString(),
                    label: team.name,
                    dotColor: "bg-blue-500",
                  }))}
                  placeholder={
                    availableTeams.length === 0
                      ? "No more teams available"
                      : "Select team to add..."
                  }
                  disabled={isLoadingTeams || availableTeams.length === 0}
                  searchable
                  searchPlaceholder="Search team..."
                  size="md"
                />
              </div>
              <button
                type="button"
                onClick={handleAddTeam}
                disabled={!selectedTeamToAdd || addTeamMutation.isPending}
                className="px-3.5 h-10 bg-[#1F3864] hover:bg-[#152747] active:scale-[0.98] text-white rounded-lg font-semibold shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">
                  person_add
                </span>
                <span>Add</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-gray-50 dark:bg-slate-800/40 flex justify-end border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 rounded-lg text-gray-700 dark:text-gray-200 font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
