import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  useCreateTeamMutation,
  useDepartmentsQuery,
  useDepartmentUsersQuery,
} from "../api";
import { SelectDropdown, SelectOption } from "@/shared/components";

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateTeamModal: React.FC<CreateTeamModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState("");
  const [departmentId, setDepartmentId] = useState<number | "">("");
  const [teamAdminEmail, setTeamAdminEmail] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  const { data: departments = [] } = useDepartmentsQuery();
  const { data: deptUsers = [] } = useDepartmentUsersQuery(
    departmentId ? Number(departmentId) : undefined,
  );
  const createTeamMutation = useCreateTeamMutation();

  // Pre-select first department when available
  useEffect(() => {
    if (departments.length > 0 && departmentId === "") {
      setDepartmentId(departments[0].id);
    }
  }, [departments, departmentId]);

  // Reset selected members when department changes
  useEffect(() => {
    setSelectedMemberIds([]);
  }, [departmentId]);

  if (!isOpen) return null;

  const handleToggleMember = (userId: number) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!name.trim()) {
      setErrorMessage("Team name is required.");
      return;
    }
    if (!departmentId) {
      setErrorMessage("Department is required.");
      return;
    }
    if (!teamAdminEmail.trim()) {
      setErrorMessage("Team lead email is required.");
      return;
    }

    try {
      await createTeamMutation.mutateAsync({
        name: name.trim(),
        departmentId: Number(departmentId),
        teamAdminEmail: teamAdminEmail.trim(),
        description: description.trim() || undefined,
        status: "ACTIVE",
        initialMemberIds: selectedMemberIds,
      });

      // Reset form
      setName("");
      setDescription("");
      setTeamAdminEmail("");
      setSelectedMemberIds([]);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create team. Please check inputs.";
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
              <span className="material-symbols-outlined text-[24px]">
                group_add
              </span>
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#1A1A1A] leading-tight tracking-tight">
                Create New Team
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Add a new operational team
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
          className="px-7 py-6 space-y-5 overflow-y-auto flex-1"
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

          {/* Team Name */}
          <div>
            <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-2">
              Team Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={120}
              placeholder="e.g. Platform Ops"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-11 px-4 bg-[#F9FAFB] border border-[#D1D5DB] rounded-xl text-sm text-[#1A1A1A] focus:outline-none focus:border-[#0e61a1] focus:ring-2 focus:ring-[#0e61a1]/15 focus:bg-white transition-all placeholder:text-gray-400"
            />
          </div>

          {/* Department */}
          <div>
            <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-2">
              Department <span className="text-red-500">*</span>
            </label>
            <SelectDropdown<number | "">
              value={departmentId}
              onChange={(val) => setDepartmentId(val)}
              options={departments.map((d) => ({
                value: d.id,
                label: d.name,
                icon: "business",
              }))}
              placeholder="Select Department..."
              searchable={departments.length > 4}
              searchPlaceholder="Search departments..."
            />
          </div>

          {/* Team Lead Email */}
          <div>
            <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-2">
              Team Lead Email <span className="text-red-500">*</span>
            </label>
            {deptUsers.length > 0 ? (
              <div className="space-y-2.5">
                <SelectDropdown<string>
                  value={teamAdminEmail}
                  onChange={(val) => setTeamAdminEmail(val)}
                  options={[
                    {
                      value: "",
                      label: "Custom Entry / Type Email Below",
                      icon: "edit",
                    },
                    ...deptUsers.map((u) => ({
                      value: u.email,
                      label: u.name,
                      sublabel: `${u.email} • ${u.userRole?.name || "Specialist"}`,
                      icon: "person",
                    })),
                  ]}
                  placeholder="Select Department Operator..."
                  searchable={deptUsers.length > 4}
                  searchPlaceholder="Search operators..."
                />
                <input
                  type="email"
                  required
                  placeholder="Lead email address..."
                  value={teamAdminEmail}
                  onChange={(e) => setTeamAdminEmail(e.target.value)}
                  className="w-full h-10 px-4 bg-white border border-[#D1D5DB] rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:border-[#0e61a1] focus:ring-2 focus:ring-[#0e61a1]/15 transition-all font-mono"
                />
              </div>
            ) : (
              <input
                type="email"
                required
                placeholder="Lead email address..."
                value={teamAdminEmail}
                onChange={(e) => setTeamAdminEmail(e.target.value)}
                className="w-full h-11 px-4 bg-[#F9FAFB] border border-[#D1D5DB] rounded-xl text-sm text-[#1A1A1A] focus:outline-none focus:border-[#0e61a1] focus:ring-2 focus:ring-[#0e61a1]/15 focus:bg-white transition-all"
              />
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-2">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Optional team description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3.5 bg-[#F9FAFB] border border-[#D1D5DB] rounded-xl text-sm text-[#1A1A1A] focus:outline-none focus:border-[#0e61a1] focus:ring-2 focus:ring-[#0e61a1]/15 focus:bg-white transition-all placeholder:text-gray-400 resize-none"
            />
          </div>

          {/* Initial Member Assignment (Multi-select) */}
          {deptUsers.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider">
                  Add Members (Optional)
                </label>
                <span className="text-xs text-[#64748B] font-medium bg-gray-100 px-2 py-0.5 rounded-md">
                  {selectedMemberIds.length} selected
                </span>
              </div>
              <div className="max-h-36 overflow-y-auto p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] space-y-1 divide-y divide-gray-100">
                {deptUsers.map((u) => {
                  const isChecked = selectedMemberIds.includes(u.id);
                  return (
                    <label
                      key={u.id}
                      className={`flex items-center gap-3 pt-1.5 first:pt-0 cursor-pointer p-2 rounded-lg transition-all duration-150 ${
                        isChecked
                          ? "bg-blue-50/80 border-blue-100"
                          : "hover:bg-white/80"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleMember(u.id)}
                        className="rounded text-[#1F3864] focus:ring-0 w-4 h-4"
                      />
                      <div className="w-7 h-7 rounded-full bg-[#1F3864]/10 text-[#1F3864] flex items-center justify-center font-bold text-xs shrink-0">
                        {u.name?.slice(0, 1).toUpperCase() || "U"}
                      </div>
                      <span className="text-xs text-[#1A1A1A] font-medium truncate flex-1">
                        {u.name}{" "}
                        <span className="text-gray-400 font-mono">
                          ({u.email})
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="pt-5 border-t border-[#EEF1F5] flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={createTeamMutation.isPending}
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-[#D1D5DB] text-gray-700 hover:bg-gray-50 font-semibold text-sm transition-all duration-150"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createTeamMutation.isPending}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#1F3864] to-[#2B5EA7] hover:from-[#152747] hover:to-[#1F4A8A] text-white font-semibold text-sm flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-150 disabled:opacity-50 active:scale-[0.99]"
            >
              {createTeamMutation.isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating Team...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">
                    check
                  </span>
                  <span>Create Team</span>
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
