import React from 'react';

interface RolesGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RolesGuideModal: React.FC<RolesGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#03224D]/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#F8FAFC] flex items-center justify-between border-b border-[#E2E8F0]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1F3864]/10 text-[#1F3864] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">
                help_outline
              </span>
            </div>
            <div>
              <h3 className="font-bold text-base text-[#0F172A]">
                Roles & Permissions Guide
              </h3>
              <p className="text-xs text-gray-500">
                Learn how to govern user privileges, configure granular scopes, and manage roles
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 rounded-lg p-1 hover:bg-gray-100 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6 text-xs text-gray-700">
          {/* Section 1: System vs Custom Roles */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-sm font-bold text-[#1F3864]">
              <span className="material-symbols-outlined text-[18px]">
                shield
              </span>
              <h4>1. System Roles vs. Custom Roles</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 bg-blue-50/60 border border-blue-200/70 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-blue-900 text-xs">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-[10px]">System</span>
                  <span>ADMIN & USER</span>
                </div>
                <p className="text-[11px] text-blue-800/90 leading-relaxed">
                  Permanent core roles provided by the platform. System roles cannot be renamed, deactivated, or deleted.
                </p>
              </div>

              <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/70 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900 text-xs">
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px]">Custom</span>
                  <span>Organization Roles</span>
                </div>
                <p className="text-[11px] text-emerald-800/90 leading-relaxed">
                  Administrator-defined roles (e.g. Support Lead, QA Reviewer) tailored to departmental needs and specific workflows.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: 5-Level Scope Granularity */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-sm font-bold text-[#1F3864]">
              <span className="material-symbols-outlined text-[18px]">
                tune
              </span>
              <h4>2. Understanding Permission Scopes</h4>
            </div>
            <p className="text-[11px] text-gray-600">
              Each capability can be granted at varying levels of visibility and authority:
            </p>

            <div className="space-y-2 bg-[#F8FAFC] border border-[#E2E8F0] p-3.5 rounded-xl">
              <div className="flex items-start gap-2.5">
                <span className="px-2 py-0.5 bg-[#1F3864] text-white text-[10px] font-bold rounded-md shrink-0 mt-0.5">
                  GLOBAL
                </span>
                <span className="text-[11px] text-gray-700">
                  <strong>Unrestricted Access:</strong> Operates across all departments, teams, and tickets org-wide.
                </span>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="px-2 py-0.5 bg-[#1E88E5] text-white text-[10px] font-bold rounded-md shrink-0 mt-0.5">
                  DEPT
                </span>
                <span className="text-[11px] text-gray-700">
                  <strong>Department Scope:</strong> Access is restricted strictly to users, tickets, and teams inside the user's department.
                </span>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="px-2 py-0.5 bg-slate-600 text-white text-[10px] font-bold rounded-md shrink-0 mt-0.5">
                  TEAM
                </span>
                <span className="text-[11px] text-gray-700">
                  <strong>Team Scope:</strong> Access is limited to tickets and queues belonging to the user's active team memberships.
                </span>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="px-2 py-0.5 bg-slate-500 text-white text-[10px] font-bold rounded-md shrink-0 mt-0.5">
                  ASSIGNED
                </span>
                <span className="text-[11px] text-gray-700">
                  <strong>Assigned Only:</strong> Access is permitted only on tickets specifically assigned to the user.
                </span>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="px-2 py-0.5 bg-gray-400 text-white text-[10px] font-bold rounded-md shrink-0 mt-0.5">
                  OWN
                </span>
                <span className="text-[11px] text-gray-700">
                  <strong>Created by Self:</strong> Access is permitted only on tickets or items submitted by the user.
                </span>
              </div>
            </div>

            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg text-[11px] text-amber-900 flex items-start gap-2">
              <span className="material-symbols-outlined text-[16px] text-amber-600 shrink-0 mt-0.5">
                lightbulb
              </span>
              <span>
                <strong>Smart Scope Hierarchy:</strong> Checking <code>GLOBAL</code> automatically clears narrower scopes because Global encompasses all levels. Selecting a narrower scope automatically removes Global.
              </span>
            </div>
          </div>

          {/* Section 3: Archiving, Restoring & Deleting */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-sm font-bold text-[#1F3864]">
              <span className="material-symbols-outlined text-[18px]">
                inventory_2
              </span>
              <h4>3. Role Lifecycle: Archive, Restore & Delete</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-amber-50/60 border border-amber-200/70 rounded-xl space-y-1">
                <div className="flex items-center gap-1 font-bold text-amber-900 text-xs">
                  <span className="material-symbols-outlined text-[15px] text-amber-700">archive</span>
                  <span>Archive</span>
                </div>
                <p className="text-[11px] text-amber-800/90 leading-relaxed">
                  Deactivates a role without deleting historical data. Existing assigned users retain access, but new users cannot be assigned.
                </p>
              </div>

              <div className="p-3 bg-emerald-50/60 border border-emerald-200/70 rounded-xl space-y-1">
                <div className="flex items-center gap-1 font-bold text-emerald-900 text-xs">
                  <span className="material-symbols-outlined text-[15px] text-emerald-700">unarchive</span>
                  <span>Restore</span>
                </div>
                <p className="text-[11px] text-emerald-800/90 leading-relaxed">
                  Instantly restores an archived role to active status, re-enabling user assignments and permissions governance.
                </p>
              </div>

              <div className="p-3 bg-red-50/60 border border-red-200/70 rounded-xl space-y-1">
                <div className="flex items-center gap-1 font-bold text-red-900 text-xs">
                  <span className="material-symbols-outlined text-[15px] text-red-700">delete</span>
                  <span>Delete</span>
                </div>
                <p className="text-[11px] text-red-800/90 leading-relaxed">
                  Permanently deletes a custom role and purges all its database grants. Allowed only when 0 users are assigned.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Saving Changes */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-sm font-bold text-[#1F3864]">
              <span className="material-symbols-outlined text-[18px]">
                save
              </span>
              <h4>4. Committing Your Edits</h4>
            </div>
            <p className="text-[11px] text-gray-600 leading-relaxed">
              When configuring checkboxes in the permission matrix, an <strong>Unsaved Changes</strong> badge will appear. Click the navy <strong>Save Changes</strong> button in the top right to apply your configuration immediately. You can click <strong>Discard</strong> at any time to revert back.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-5 bg-[#1F3864] hover:bg-[#152747] text-white rounded-lg text-xs font-semibold shadow-xs transition-all active:scale-[0.98]"
          >
            Got it, close guide
          </button>
        </div>
      </div>
    </div>
  );
};

export default RolesGuideModal;
