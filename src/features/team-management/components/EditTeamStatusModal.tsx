import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { TeamStatusItem, TicketStatusBehavior } from "../types";
import { useUpdateTeamStatusMutation } from "../api";
import { SelectDropdown } from "@/shared/components";

interface EditTeamStatusModalProps {
  statusItem: TeamStatusItem | null;
  teamName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const LIFECYCLE_STAGES: {
  value: TicketStatusBehavior;
  label: string;
  desc: string;
  color: string;
}[] = [
  {
    value: "OPEN",
    label: "Open (Initial intake state)",
    desc: "Tickets awaiting technician assignment or initial review",
    color: "#1E88E5",
  },
  {
    value: "IN_PROGRESS",
    label: "In Progress (Active execution)",
    desc: "Active diagnostic or troubleshooting work",
    color: "#FB8C00",
  },
  {
    value: "ON_HOLD",
    label: "On Hold (Waiting external)",
    desc: "Waiting for third-party vendor, parts, or customer input",
    color: "#8E24AA",
  },
  {
    value: "RESOLVED",
    label: "Resolved (Deployment complete)",
    desc: "Fix deployed, pending verification or closure sign-off",
    color: "#43A047",
  },
  {
    value: "CLOSED",
    label: "Closed (Archival state)",
    desc: "Permanently resolved and logged in historical archives",
    color: "#747780",
  },
];

export const EditTeamStatusModal: React.FC<EditTeamStatusModalProps> = ({
  statusItem,
  teamName,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [label, setLabel] = useState("");
  const [behavior, setBehavior] = useState<TicketStatusBehavior>("IN_PROGRESS");
  const [description, setDescription] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const updateStatusMutation = useUpdateTeamStatusMutation();

  useEffect(() => {
    if (statusItem) {
      setLabel(statusItem.label);
      setBehavior(statusItem.behavior);
      setDescription(statusItem.description || "");
      setErrorMessage("");
    }
  }, [statusItem, isOpen]);

  if (!isOpen || !statusItem) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!label.trim()) {
      setErrorMessage("Status label is required.");
      return;
    }

    try {
      await updateStatusMutation.mutateAsync({
        id: statusItem.id,
        label: label.trim(),
        behavior,
        teamId: statusItem.teamId,
        description: description.trim() || undefined,
      });

      onSuccess?.();
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update workflow status.";
      setErrorMessage(msg);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 top-0 left-0 right-0 bottom-0 !m-0 z-[100] flex items-center justify-center p-4 bg-[#0F1B2D]/50 backdrop-blur-[8px] transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-[0_25px_60px_-12px_rgba(0,0,0,0.4)] w-full max-w-lg mx-4 overflow-hidden border border-[#E2E8F0] flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient Header Accent */}
        <div className="h-1.5 bg-gradient-to-r from-[#1F3864] via-[#2B5EA7] to-[#0e61a1]" />

        {/* Header */}
        <div className="px-7 py-5 bg-gradient-to-b from-[#FAFBFD] to-white border-b border-[#EEF1F5] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#1F3864] to-[#2B5EA7] text-white flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-[22px]">
                edit
              </span>
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#1A1A1A] leading-tight tracking-tight">
                Edit Workflow Status
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                {teamName}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-100 transition-all duration-150 cursor-pointer"
            onClick={onClose}
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Form Body */}
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
              Status Label <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={60}
              placeholder="e.g. Firmware Flashing in Progress"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full h-11 px-4 bg-[#F9FAFB] border border-[#D1D5DB] rounded-xl text-sm text-[#1A1A1A] focus:outline-none focus:border-[#0e61a1] focus:ring-2 focus:ring-[#0e61a1]/15 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-2">
              Lifecycle Stage <span className="text-red-500">*</span>
            </label>
            <SelectDropdown<TicketStatusBehavior>
              value={behavior}
              onChange={(val) => setBehavior(val)}
              options={LIFECYCLE_STAGES.map((s) => ({
                value: s.value,
                label: s.label,
                sublabel: s.desc,
                dotColor:
                  s.value === "OPEN"
                    ? "bg-[#1E88E5]"
                    : s.value === "IN_PROGRESS"
                      ? "bg-[#FB8C00]"
                      : s.value === "ON_HOLD"
                        ? "bg-[#8E24AA]"
                        : s.value === "RESOLVED"
                          ? "bg-[#43A047]"
                          : "bg-[#747780]",
              }))}
              placeholder="Select Lifecycle Stage..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-2">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description of this workflow status..."
              className="w-full p-3.5 bg-[#F9FAFB] border border-[#D1D5DB] rounded-xl text-sm text-[#1A1A1A] focus:outline-none focus:border-[#0e61a1] focus:ring-2 focus:ring-[#0e61a1]/15 focus:bg-white transition-all placeholder:text-gray-400 resize-none"
            />
          </div>

          {/* Footer */}
          <div className="pt-5 border-t border-[#EEF1F5] flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={updateStatusMutation.isPending}
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-[#D1D5DB] text-gray-700 hover:bg-gray-50 font-semibold text-sm transition-all duration-150 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateStatusMutation.isPending}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#1F3864] to-[#2B5EA7] hover:from-[#152747] hover:to-[#1F4A8A] text-white font-semibold text-sm flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-150 disabled:opacity-50 active:scale-[0.99] cursor-pointer"
            >
              {updateStatusMutation.isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Updating Status...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">
                    check
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

export default EditTeamStatusModal;
