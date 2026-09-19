import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useCreateProjectMutation } from "../api";
import { ProjectStatus } from "../types";
import { SelectDropdown, SelectOption } from "@/shared/components";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const STATUS_OPTIONS: SelectOption<ProjectStatus>[] = [
  {
    value: "ACTIVE",
    label: "Active Project",
    sublabel: "Available for ticket assignment and routing",
    dotColor: "bg-emerald-500",
  },
  {
    value: "INACTIVE",
    label: "Archived / Inactive",
    sublabel: "Hidden from active ticket assignment",
    dotColor: "bg-gray-400",
  },
];

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("ACTIVE");
  const [errorMessage, setErrorMessage] = useState("");

  const createMutation = useCreateProjectMutation();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!name.trim()) {
      setErrorMessage("Project name is required.");
      return;
    }

    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        status,
      });

      setName("");
      setDescription("");
      setStatus("ACTIVE");
      onSuccess?.();
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create project. Please check inputs.";
      setErrorMessage(msg);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 top-0 left-0 right-0 bottom-0 !m-0 z-[100] flex items-center justify-center p-4 bg-[#0F1B2D]/50 backdrop-blur-[8px] transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#121E30] rounded-2xl shadow-[0_25px_60px_-12px_rgba(0,0,0,0.4)] w-full max-w-lg mx-4 overflow-hidden border border-[#E2E8F0] dark:border-[#1E2D45] flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient Header Accent */}
        <div className="h-1.5 bg-gradient-to-r from-[#1F3864] via-[#2B5EA7] to-[#0e61a1]" />

        {/* Header */}
        <div className="px-4 sm:px-7 py-4 sm:py-5 bg-gradient-to-b from-[#FAFBFD] to-white dark:from-[#121E30] dark:to-[#121E30] border-b border-[#EEF1F5] dark:border-[#1E2D45] flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-[#1F3864] to-[#2B5EA7] text-white flex items-center justify-center shadow-md shrink-0">
              <span className="material-symbols-outlined text-[22px] sm:text-[24px]">
                folder_managed
              </span>
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-[#1A1A1A] dark:text-white leading-tight tracking-tight">
                Create New Project
              </h3>
              <p className="text-xs text-[#64748B] dark:text-gray-400 mt-0.5">
                Add an organizational project
              </p>
            </div>
          </div>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-700 dark:hover:text-white p-1.5 sm:p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-all duration-150"
            onClick={onClose}
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="px-4 sm:px-7 py-4 sm:py-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1"
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

          {/* Project Name */}
          <div>
            <label className="block text-xs font-bold text-[#374151] dark:text-gray-300 uppercase tracking-wider mb-2">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={150}
              placeholder="e.g. Enterprise Support Portal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-11 px-4 bg-[#F9FAFB] dark:bg-[#1A283E] border border-[#D1D5DB] dark:border-[#283A55] rounded-xl text-sm text-[#1A1A1A] dark:text-white focus:outline-none focus:border-[#0e61a1] focus:ring-2 focus:ring-[#0e61a1]/15 transition-all placeholder:text-gray-400"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-bold text-[#374151] dark:text-gray-300 uppercase tracking-wider mb-2">
              Status
            </label>
            <SelectDropdown<ProjectStatus>
              value={status}
              onChange={(val) => setStatus(val)}
              options={STATUS_OPTIONS}
              placeholder="Select Project Status..."
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-[#374151] dark:text-gray-300 uppercase tracking-wider mb-2">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Technical scope, repository details, or operational objectives..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3.5 bg-[#F9FAFB] dark:bg-[#1A283E] border border-[#D1D5DB] dark:border-[#283A55] rounded-xl text-sm text-[#1A1A1A] dark:text-white focus:outline-none focus:border-[#0e61a1] focus:ring-2 focus:ring-[#0e61a1]/15 transition-all placeholder:text-gray-400 resize-none"
            />
          </div>

          {/* Footer */}
          <div className="pt-5 border-t border-[#EEF1F5] dark:border-[#1E2D45] flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={createMutation.isPending}
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-[#D1D5DB] dark:border-[#283A55] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 font-semibold text-sm transition-all duration-150 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#1F3864] to-[#2B5EA7] hover:from-[#152747] hover:to-[#1F4A8A] text-white font-semibold text-sm flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-150 disabled:opacity-50 active:scale-[0.99] cursor-pointer"
            >
              {createMutation.isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating Project...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">
                    check
                  </span>
                  <span>Create Project</span>
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

export default CreateProjectModal;
