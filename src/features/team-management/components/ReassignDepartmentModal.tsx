import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { TeamItem } from "../types";
import { useTeamsQuery, useUpdateTeamMutation } from "../api";
import { useDepartmentsQuery } from "@/features/department-management";

export interface ReassignDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTeam?: TeamItem | null;
  onSuccess?: (msg: string) => void;
}

export const ReassignDepartmentModal: React.FC<ReassignDepartmentModalProps> = ({
  isOpen,
  onClose,
  initialTeam,
  onSuccess,
}) => {
  const { data: teams = [] } = useTeamsQuery({ includeInactive: true });
  const { data: departments = [] } = useDepartmentsQuery({ includeInactive: false });

  const updateTeamMutation = useUpdateTeamMutation();

  const [selectedTeamId, setSelectedTeamId] = useState<number | "">("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | "">("");
  const [showConfirmAlert, setShowConfirmAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Custom Dropdown Open States
  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);

  // Search Filter Terms
  const [teamSearchTerm, setTeamSearchTerm] = useState("");
  const [deptSearchTerm, setDeptSearchTerm] = useState("");

  // Refs for click outside
  const teamDropdownRef = useRef<HTMLDivElement>(null);
  const deptDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialTeam) {
      setSelectedTeamId(initialTeam.id);
      setSelectedDepartmentId(initialTeam.departmentId || initialTeam.department?.id || "");
    } else if (teams.length > 0) {
      setSelectedTeamId(teams[0].id);
      setSelectedDepartmentId(teams[0].departmentId || teams[0].department?.id || "");
    }
  }, [initialTeam, teams, isOpen]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        teamDropdownRef.current &&
        !teamDropdownRef.current.contains(event.target as Node)
      ) {
        setIsTeamDropdownOpen(false);
      }
      if (
        deptDropdownRef.current &&
        !deptDropdownRef.current.contains(event.target as Node)
      ) {
        setIsDeptDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const targetTeam = teams.find((t) => t.id === Number(selectedTeamId));
  const activeDepartments = departments.filter((d) => d.status === "ACTIVE");
  const targetDepartment = activeDepartments.find(
    (d) => d.id === Number(selectedDepartmentId)
  );

  // Filtered teams list based on search term
  const filteredTeams = teams.filter((t) => {
    const term = teamSearchTerm.toLowerCase();
    const teamName = t.name.toLowerCase();
    const deptName = (t.department?.name || "").toLowerCase();
    return teamName.includes(term) || deptName.includes(term);
  });

  // Filtered departments list based on search term
  const filteredDepartments = activeDepartments.filter((d) =>
    d.name.toLowerCase().includes(deptSearchTerm.toLowerCase())
  );

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedTeamId) {
      setErrorMessage("Please select a team.");
      return;
    }
    if (!selectedDepartmentId) {
      setErrorMessage("Please select a new department.");
      return;
    }
    if (
      targetTeam &&
      (targetTeam.departmentId === Number(selectedDepartmentId) ||
        targetTeam.department?.id === Number(selectedDepartmentId))
    ) {
      setErrorMessage("The team is already assigned to this department.");
      return;
    }

    setShowConfirmAlert(true);
  };

  const handleExecuteReassign = async () => {
    if (!targetTeam || !selectedDepartmentId) return;

    setErrorMessage(null);
    try {
      await updateTeamMutation.mutateAsync({
        id: targetTeam.id,
        data: {
          departmentId: Number(selectedDepartmentId),
          status: "ACTIVE",
        },
      });

      setShowConfirmAlert(false);
      onSuccess?.(
        `Team "${targetTeam.name}" has been successfully reassigned to Department "${targetDepartment?.name}" and activated.`
      );
      onClose();
    } catch (err: any) {
      setShowConfirmAlert(false);
      setErrorMessage(
        err?.response?.data?.message || err?.message || "Failed to reassign department for team."
      );
    }
  };

  return createPortal(
    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 !m-0 z-[100] bg-[#0F1B2D]/50 backdrop-blur-[8px] flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-[0_25px_60px_-12px_rgba(0,0,0,0.4)] max-w-lg w-full border border-[#E2E8F0] flex flex-col animate-in zoom-in-95 duration-150 overflow-visible relative">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-[#F9FAFB] rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1F3864]/10 flex items-center justify-center text-[#1F3864]">
              <span className="material-symbols-outlined text-[20px]">
                domain_add
              </span>
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1A1A1A]">
                Department Change
              </h2>
              <p className="text-[11px] text-gray-500 font-medium">
                Admin Reassignment Portal
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleOpenConfirm} className="p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-red-600 text-[18px]">
                error
              </span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Custom Select Team Dropdown */}
          <div className="relative" ref={teamDropdownRef}>
            <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">
              Select Team <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => {
                setIsTeamDropdownOpen((prev) => !prev);
                setIsDeptDropdownOpen(false);
              }}
              className="w-full h-10 px-3 bg-[#F9FAFB] border border-[#D1D5DB] hover:border-[#1F3864] rounded-xl text-xs text-[#1A1A1A] focus:outline-none transition-all flex items-center justify-between font-medium cursor-pointer"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="material-symbols-outlined text-gray-500 text-[18px]">
                  groups
                </span>
                <span className="truncate">
                  {targetTeam
                    ? `${targetTeam.name} (${targetTeam.department?.name || "No Dept"})${
                        targetTeam.status === "INACTIVE" ? " [Archived]" : ""
                      }`
                    : "Select Team..."}
                </span>
              </div>
              <span className="material-symbols-outlined text-gray-400 text-[20px]">
                {isTeamDropdownOpen ? "expand_less" : "expand_more"}
              </span>
            </button>

            {/* Custom Dropdown Popup */}
            {isTeamDropdownOpen && (
              <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-[120] bg-white border border-[#E2E8F0] rounded-xl shadow-2xl overflow-hidden p-2 animate-in fade-in duration-100">
                {/* Search Bar */}
                <div className="relative mb-2">
                  <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[16px]">
                    search
                  </span>
                  <input
                    type="text"
                    value={teamSearchTerm}
                    onChange={(e) => setTeamSearchTerm(e.target.value)}
                    placeholder="Search team or department..."
                    className="w-full h-8 pl-8 pr-3 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1F3864]"
                    autoFocus
                  />
                </div>

                {/* Team List */}
                <div className="max-h-48 overflow-y-auto space-y-0.5">
                  {filteredTeams.length === 0 ? (
                    <div className="p-3 text-center text-xs text-gray-400 font-medium">
                      No teams found matching search
                    </div>
                  ) : (
                    filteredTeams.map((t) => {
                      const isSelected = t.id === Number(selectedTeamId);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setSelectedTeamId(t.id);
                            setSelectedDepartmentId(
                              t.departmentId || t.department?.id || ""
                            );
                            setIsTeamDropdownOpen(false);
                            setTeamSearchTerm("");
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-[#1F3864]/10 text-[#1F3864] font-semibold"
                              : "hover:bg-gray-50 text-gray-700 font-medium"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span>{t.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-normal">
                              {t.department?.name || "No Dept"}
                            </span>
                            {t.status === "INACTIVE" && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 font-semibold border border-amber-200">
                                Archived
                              </span>
                            )}
                          </div>
                          {isSelected && (
                            <span className="material-symbols-outlined text-[#1F3864] text-[16px]">
                              check
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Current vs New Department Info Card */}
          {targetTeam && (
            <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl flex items-center justify-between text-xs">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Current Department
                </span>
                <span className="font-semibold text-[#1F3864] mt-0.5">
                  {targetTeam.department?.name || "Unassigned / Inactive"}
                </span>
              </div>
              <span className="material-symbols-outlined text-blue-500 text-[20px]">
                east
              </span>
              <div className="flex flex-col text-right">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Team Status
                </span>
                <span
                  className={`font-semibold mt-0.5 ${
                    targetTeam.status === "ACTIVE"
                      ? "text-emerald-600"
                      : "text-amber-600"
                  }`}
                >
                  {targetTeam.status === "ACTIVE" ? "Active" : "Archived"}
                </span>
              </div>
            </div>
          )}

          {/* 2. Custom Select New Department Dropdown */}
          <div className="relative" ref={deptDropdownRef}>
            <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">
              New Department <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => {
                setIsDeptDropdownOpen((prev) => !prev);
                setIsTeamDropdownOpen(false);
              }}
              className="w-full h-10 px-3 bg-[#F9FAFB] border border-[#D1D5DB] hover:border-[#1F3864] rounded-xl text-xs text-[#1A1A1A] focus:outline-none transition-all flex items-center justify-between font-medium cursor-pointer"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="material-symbols-outlined text-gray-500 text-[18px]">
                  apartment
                </span>
                <span className="truncate">
                  {targetDepartment
                    ? targetDepartment.name
                    : "Select New Department..."}
                </span>
              </div>
              <span className="material-symbols-outlined text-gray-400 text-[20px]">
                {isDeptDropdownOpen ? "expand_less" : "expand_more"}
              </span>
            </button>

            {/* Custom Dropdown Popup */}
            {isDeptDropdownOpen && (
              <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-[120] bg-white border border-[#E2E8F0] rounded-xl shadow-2xl overflow-hidden p-2 animate-in fade-in duration-100">
                {/* Search Bar */}
                <div className="relative mb-2">
                  <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[16px]">
                    search
                  </span>
                  <input
                    type="text"
                    value={deptSearchTerm}
                    onChange={(e) => setDeptSearchTerm(e.target.value)}
                    placeholder="Search new department..."
                    className="w-full h-8 pl-8 pr-3 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1F3864]"
                    autoFocus
                  />
                </div>

                {/* Department List */}
                <div className="max-h-48 overflow-y-auto space-y-0.5">
                  {filteredDepartments.length === 0 ? (
                    <div className="p-3 text-center text-xs text-gray-400 font-medium">
                      No active departments found matching search
                    </div>
                  ) : (
                    filteredDepartments.map((d) => {
                      const isSelected = d.id === Number(selectedDepartmentId);
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => {
                            setSelectedDepartmentId(d.id);
                            setIsDeptDropdownOpen(false);
                            setDeptSearchTerm("");
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-[#1F3864]/10 text-[#1F3864] font-semibold"
                              : "hover:bg-gray-50 text-gray-700 font-medium"
                          }`}
                        >
                          <span className="truncate">{d.name}</span>
                          {isSelected && (
                            <span className="material-symbols-outlined text-[#1F3864] text-[16px]">
                              check
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 border border-[#D1D5DB] hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#1F3864] hover:bg-[#152747] active:scale-[0.98] shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">
                swap_horiz
              </span>
              <span>Reassign Department</span>
            </button>
          </div>
        </form>

        {/* CONFIRMATION ALERT DIALOG OVERLAY */}
        {showConfirmAlert && (
          <div className="fixed inset-0 z-[130] bg-[#0F1B2D]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-[#E2E8F0]">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[24px]">
                    warning
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1A1A1A]">
                    Confirm Department Reassignment
                  </h3>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    Are you sure you want to change the department of Team{" "}
                    <strong className="text-[#1F3864]">"{targetTeam?.name}"</strong> to{" "}
                    <strong className="text-[#0e61a1]">"{targetDepartment?.name}"</strong>?
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  disabled={updateTeamMutation.isPending}
                  onClick={() => setShowConfirmAlert(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 border border-[#D1D5DB] hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={updateTeamMutation.isPending}
                  onClick={handleExecuteReassign}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#1F3864] hover:bg-[#152747] shadow-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {updateTeamMutation.isPending && (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  <span>Confirm Change</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

