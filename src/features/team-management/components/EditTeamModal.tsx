import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { TeamItem } from "../types";
import { useUpdateTeamMutation } from "../api";
import { SelectDropdown, SelectOption } from "@/shared/components";

const STATUS_OPTIONS: SelectOption<"ACTIVE" | "INACTIVE">[] = [
  {
    value: "ACTIVE",
    label: "Active Team",
    sublabel: "Available for new ticket routing & incident assignments",
    dotColor: "bg-emerald-500",
  },
  {
    value: "INACTIVE",
    label: "Archived / Inactive",
    sublabel: "Hidden from triage, preserves historical tickets",
    dotColor: "bg-gray-400",
  },
];

interface EditTeamModalProps {
  team: TeamItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const EditTeamModal: React.FC<EditTeamModalProps> = ({
  team,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState("");
  const [teamAdminEmail, setTeamAdminEmail] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [errorMessage, setErrorMessage] = useState("");

  const updateTeamMutation = useUpdateTeamMutation();

  useEffect(() => {
    if (team) {
      setName(team.name || "");
      setTeamAdminEmail(team.teamAdminEmail || "");
      setDescription(team.description || "");
      setStatus(team.status || "ACTIVE");
      setErrorMessage("");
    }
  }, [team]);

  if (!isOpen || !team) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!name.trim()) {
      setErrorMessage("Team name cannot be empty.");
      return;
    }
    if (!teamAdminEmail.trim()) {
      setErrorMessage("Team lead email cannot be empty.");
      return;
    }

    try {
      await updateTeamMutation.mutateAsync({
        id: team.id,
        data: {
          name: name.trim(),
          teamAdminEmail: teamAdminEmail.trim(),
          description: description.trim() || null,
          status,
        },
      });

      onSuccess?.();
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update team configuration.";
      setErrorMessage(msg);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 top-0 left-0 right-0 bottom-0 !m-0 z-[100] flex items-center justify-center p-4 bg-[#0F1B2D]/50 backdrop-blur-[8px] transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-[0_25px_60px_-12px_rgba(0,0,0,0.4)] w-full max-w-md mx-4 overflow-hidden border border-[#E2E8F0] flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient Header Accent */}
        <div className="h-1.5 bg-gradient-to-r from-[#1F3864] via-[#2B5EA7] to-[#0e61a1]" />

        {/* Header */}
        <div className="px-7 py-5 bg-gradient-to-b from-[#FAFBFD] to-white border-b border-[#EEF1F5] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#1F3864] to-[#2B5EA7] text-white flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-[22px]">
                edit_note
              </span>
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#1A1A1A] leading-tight tracking-tight">
                Edit Team Configuration
              </h3>
              <p className="text-sm text-[#64748B] mt-0.5">
                {team.department?.name || "Department"} — ID #{team.id}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-100 transition-all duration-150"
            onClick={onClose}
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit}
          className="px-7 py-6 space-y-5 overflow-y-auto"
        >
          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-center gap-3 animate-in fade-in shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px] text-red-600">
                  error
                </span>
              </div>
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-2">
              Team Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-11 px-4 bg-[#F9FAFB] border border-[#D1D5DB] rounded-xl text-sm text-[#1A1A1A] focus:outline-none focus:border-[#0e61a1] focus:ring-2 focus:ring-[#0e61a1]/15 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-2">
              Team Lead Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={teamAdminEmail}
              onChange={(e) => setTeamAdminEmail(e.target.value)}
              className="w-full h-11 px-4 bg-[#F9FAFB] border border-[#D1D5DB] rounded-xl text-sm text-[#1A1A1A] focus:outline-none focus:border-[#0e61a1] focus:ring-2 focus:ring-[#0e61a1]/15 focus:bg-white transition-all font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-2">
              Status
            </label>
            <SelectDropdown<"ACTIVE" | "INACTIVE">
              value={status}
              onChange={setStatus}
              options={STATUS_OPTIONS}
              placeholder="Select team status..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-2">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              className="w-full p-3.5 bg-[#F9FAFB] border border-[#D1D5DB] rounded-xl text-sm text-[#1A1A1A] focus:outline-none focus:border-[#0e61a1] focus:ring-2 focus:ring-[#0e61a1]/15 focus:bg-white transition-all resize-none"
            />
          </div>

          {/* Department Readonly notice */}
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-600 flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[16px] text-gray-500">
              lock
            </span>
            <span>
              Department: <strong>{team.department?.name}</strong> (locked)
            </span>
          </div>

          {/* Footer */}
          <div className="pt-5 border-t border-[#EEF1F5] flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={updateTeamMutation.isPending}
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-[#D1D5DB] text-gray-700 hover:bg-gray-50 font-semibold text-sm transition-all duration-150"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateTeamMutation.isPending}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#1F3864] to-[#2B5EA7] hover:from-[#152747] hover:to-[#1F4A8A] text-white font-semibold text-sm flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-150 disabled:opacity-50 active:scale-[0.99]"
            >
              {updateTeamMutation.isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">
                    save
                  </span>
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};
