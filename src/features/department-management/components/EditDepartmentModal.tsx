import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useUpdateDepartmentMutation } from "../api";
import { DepartmentItem, DepartmentStatus } from "../types";
import { SelectDropdown, SelectOption } from "@/shared/components";

interface EditDepartmentModalProps {
  department: DepartmentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const STATUS_OPTIONS: SelectOption<DepartmentStatus>[] = [
  {
    value: "ACTIVE",
    label: "Active",
    dotColor: "bg-emerald-500",
  },
  {
    value: "INACTIVE",
    label: "Archived / Inactive",
    dotColor: "bg-gray-400",
  },
];

export const EditDepartmentModal: React.FC<EditDepartmentModalProps> = ({
  department,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<DepartmentStatus>("ACTIVE");
  const [errorMessage, setErrorMessage] = useState("");

  const updateMutation = useUpdateDepartmentMutation();

  useEffect(() => {
    if (department) {
      setName(department.name || "");
      setDescription(department.description || "");
      setStatus(department.status || "ACTIVE");
      setErrorMessage("");
    }
  }, [department]);

  if (!isOpen || !department) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!name.trim()) {
      setErrorMessage("Department name cannot be empty.");
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: department.id,
        data: {
          name: name.trim(),
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
        "Failed to update department configuration.";
      setErrorMessage(msg);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 top-0 left-0 right-0 bottom-0 !m-0 z-[100] flex items-center justify-center p-4 bg-[#0F1B2D]/50 backdrop-blur-[8px] transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#121E30] rounded-2xl shadow-[0_25px_60px_-12px_rgba(0,0,0,0.4)] w-full max-w-md mx-4 overflow-hidden border border-[#E2E8F0] dark:border-[#1E2D45] flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient Header Accent */}
        <div className="h-1.5 bg-gradient-to-r from-[#1F3864] via-[#2B5EA7] to-[#1F3864]" />

        {/* Header */}
        <div className="px-7 py-5 bg-gradient-to-b from-[#FAFBFD] to-white dark:from-[#121E30] dark:to-[#121E30] border-b border-[#EEF1F5] dark:border-[#1E2D45] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#1F3864] to-[#2B5EA7] text-white flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-[22px]">
                edit_note
              </span>
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#1A1A1A] dark:text-white leading-tight tracking-tight">
                Edit Department
              </h3>
              <p className="text-xs text-[#64748B] dark:text-gray-400 mt-0.5">
                Department ID #{department.id}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-700 dark:hover:text-white p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-all duration-150 cursor-pointer"
            onClick={onClose}
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit}
          className="px-7 py-6 space-y-5 overflow-y-auto pb-10"
        >
          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm font-medium flex items-center gap-3 animate-in fade-in shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/50 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px] text-red-600 dark:text-red-400">
                  error
                </span>
              </div>
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#374151] dark:text-gray-300 uppercase tracking-wider mb-2">
              Department Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-11 px-4 bg-[#F9FAFB] dark:bg-[#1A283E] border border-[#D1D5DB] dark:border-[#283A55] rounded-xl text-sm text-[#1A1A1A] dark:text-white focus:outline-none focus:border-[#1F3864] focus:ring-2 focus:ring-[#1F3864]/15 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#374151] dark:text-gray-300 uppercase tracking-wider mb-2">
              Status
            </label>
            <SelectDropdown<DepartmentStatus>
              value={status}
              onChange={setStatus}
              options={STATUS_OPTIONS}
              placeholder="Select department status..."
              size="lg"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#374151] dark:text-gray-300 uppercase tracking-wider mb-2">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              className="w-full p-3.5 bg-[#F9FAFB] dark:bg-[#1A283E] border border-[#D1D5DB] dark:border-[#283A55] rounded-xl text-sm text-[#1A1A1A] dark:text-white focus:outline-none focus:border-[#1F3864] focus:ring-2 focus:ring-[#1F3864]/15 transition-all resize-none"
            />
          </div>

          {/* Footer */}
          <div className="pt-5 border-t border-[#EEF1F5] dark:border-[#1E2D45] flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={updateMutation.isPending}
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-[#D1D5DB] dark:border-[#283A55] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 font-semibold text-sm transition-all duration-150"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#1F3864] to-[#2B5EA7] hover:from-[#152747] hover:to-[#1F4A8A] text-white font-semibold text-sm flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-150 disabled:opacity-50 active:scale-[0.99]"
            >
              {updateMutation.isPending ? (
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
