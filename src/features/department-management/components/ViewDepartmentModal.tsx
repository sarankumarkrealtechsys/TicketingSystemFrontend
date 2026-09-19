import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useDepartmentDetailQuery } from "../api";
import { DepartmentItem } from "../types";

export interface ViewDepartmentModalProps {
  department: DepartmentItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ViewDepartmentModal: React.FC<ViewDepartmentModalProps> = ({
  department,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"teams" | "personnel">("teams");

  const deptId = department?.id;
  const { data: deptDetail, isLoading } = useDepartmentDetailQuery(
    isOpen && deptId ? deptId : undefined,
  );

  if (!isOpen || !department) return null;

  const teams = deptDetail?.teams || [];
  const users = deptDetail?.users || [];
  const isActive = department.status === "ACTIVE";

  return createPortal(
    <div
      className="fixed inset-0 top-0 left-0 right-0 bottom-0 !m-0 z-[100] flex items-center justify-center p-4 bg-[#0F1B2D]/50 backdrop-blur-[8px] transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#121E30] rounded-2xl shadow-[0_25px_60px_-12px_rgba(0,0,0,0.4)] w-full max-w-3xl overflow-hidden border border-[#E2E8F0] dark:border-[#1E2D45] flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#1F3864] to-[#284980] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center font-bold text-base shadow-sm">
              <span className="material-symbols-outlined text-[22px] text-white">
                corporate_fare
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-white">
                  {department.name}
                </h2>
                {isActive ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    Active
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-500/20 text-gray-300 border border-gray-400/30">
                    Archived
                  </span>
                )}
              </div>
              <p className="text-xs text-white/70">
                Department Overview &amp; Available Teams
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Info Banner */}
        <div className="px-6 py-3 bg-[#FAFBFD] dark:bg-[#162234] border-b border-[#F0F2F5] dark:border-[#1E2D45] flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-gray-400 text-[18px]">
              description
            </span>
            <span className="line-clamp-1 italic">
              {department.description || "No description provided."}
            </span>
          </div>
          <div className="flex items-center gap-4 shrink-0 font-medium">
            <span>
              <strong className="text-[#1F3864] dark:text-blue-400 font-bold">
                {teams.length}
              </strong>{" "}
              {teams.length === 1 ? "Team" : "Teams"}
            </span>
            <span>
              <strong className="text-violet-600 dark:text-violet-400 font-bold">
                {users.length}
              </strong>{" "}
              {users.length === 1 ? "Member" : "Members"}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-[#F0F2F5] dark:border-[#1E2D45] flex items-center gap-6 bg-white dark:bg-[#121E30]">
          <button
            type="button"
            onClick={() => setActiveTab("teams")}
            className={`py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "teams"
                ? "border-[#1F3864] dark:border-blue-400 text-[#1F3864] dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">groups</span>
            Available Teams ({teams.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("personnel")}
            className={`py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "personnel"
                ? "border-[#1F3864] dark:border-blue-400 text-[#1F3864] dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">badge</span>
            Department Members ({users.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-xs text-gray-500 gap-2">
              <span className="w-6 h-6 border-2 border-[#1F3864] border-t-transparent rounded-full animate-spin" />
              Loading department teams and members...
            </div>
          ) : activeTab === "teams" ? (
            /* Teams Tab */
            teams.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-500 dark:text-gray-400 border border-dashed border-gray-200 dark:border-slate-800 rounded-xl">
                <span className="material-symbols-outlined text-[36px] text-gray-300 dark:text-gray-600 block mb-1">
                  group_off
                </span>
                No teams are currently associated with this department.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Teams allocated to {department.name}
                </div>
                <div className="overflow-x-auto w-full border border-[#E5E7EB] dark:border-[#1E2D45] rounded-xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#FAFBFD] dark:bg-[#162234] border-b border-[#F0F2F5] dark:border-[#1E2D45] text-gray-500 dark:text-gray-400 font-semibold text-[11px] uppercase tracking-wider">
                        <th className="py-2.5 px-4">Team Name</th>
                        <th className="py-2.5 px-4">Description</th>
                        <th className="py-2.5 px-4">Team Admin</th>
                        <th className="py-2.5 px-4">Members</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0F2F5] dark:divide-[#1E2D45] text-xs">
                      {teams.map((t) => (
                        <tr
                          key={t.id}
                          className="hover:bg-gray-50/70 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="py-3 px-4 font-bold text-sm text-[#1A1A1A] dark:text-white">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-[#E3F2FD] dark:bg-blue-900/40 text-[#1E88E5] dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0">
                                <span className="material-symbols-outlined text-[16px]">
                                  groups
                                </span>
                              </div>
                              <span>{t.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-500 dark:text-gray-400">
                            {t.description || "—"}
                          </td>
                          <td className="py-3 px-4 font-mono text-gray-600 dark:text-gray-300">
                            {t.teamAdminEmail || "Unassigned"}
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300">
                              {t._count?.members || 0} Members
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          ) : (
            /* Personnel Tab */
            users.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-500 dark:text-gray-400 border border-dashed border-gray-200 dark:border-slate-800 rounded-xl">
                <span className="material-symbols-outlined text-[36px] text-gray-300 dark:text-gray-600 block mb-1">
                  person_off
                </span>
                No members currently assigned to this department.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Personnel Roster in {department.name}
                </div>
                <div className="overflow-x-auto w-full border border-[#E5E7EB] dark:border-[#1E2D45] rounded-xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#FAFBFD] dark:bg-[#162234] border-b border-[#F0F2F5] dark:border-[#1E2D45] text-gray-500 dark:text-gray-400 font-semibold text-[11px] uppercase tracking-wider">
                        <th className="py-2.5 px-4">Member Name</th>
                        <th className="py-2.5 px-4">Email</th>
                        <th className="py-2.5 px-4">Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0F2F5] dark:divide-[#1E2D45] text-xs">
                      {users.map((u) => (
                        <tr
                          key={u.id}
                          className="hover:bg-gray-50/70 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="py-3 px-4 font-bold text-sm text-[#1A1A1A] dark:text-white">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 flex items-center justify-center font-bold text-xs shrink-0">
                                {(u.name || u.username || "U")[0].toUpperCase()}
                              </div>
                              <div>
                                <span>{u.name}</span>
                                <span className="text-[11px] text-gray-400 block font-normal">
                                  @{u.username}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-gray-600 dark:text-gray-300">
                            {u.email}
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 text-[11px] font-medium">
                              {u.userRole?.name || "Specialist"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#FAFBFD] dark:bg-[#162234] border-t border-[#F0F2F5] dark:border-[#1E2D45] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ViewDepartmentModal;
