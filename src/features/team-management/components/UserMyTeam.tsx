import React, { useState, useEffect } from "react";
import {
  useTeamsQuery,
  useTeamDetailQuery,
  useTeamStatusesQuery,
} from "../api";
import { CreateStatusModal } from "./CreateStatusModal";

export const UserMyTeam: React.FC = () => {
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [isNewStatusOpen, setIsNewStatusOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // User query: backend automatically scopes GET /api/teams to caller's active teams
  const { data: myTeams = [], isLoading: isTeamsLoading } = useTeamsQuery();

  // Set default team
  useEffect(() => {
    if (myTeams.length > 0 && selectedTeamId === null) {
      setSelectedTeamId(myTeams[0].id);
    }
  }, [myTeams, selectedTeamId]);

  // Team detail query
  const { data: currentTeam, isLoading: isTeamDetailLoading } =
    useTeamDetailQuery(selectedTeamId);

  // Statuses for this team
  const { data: teamStatuses = [], isLoading: isStatusesLoading } =
    useTeamStatusesQuery(selectedTeamId);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  if (isTeamsLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-2 text-gray-500 text-xs">
        <span className="w-6 h-6 border-2 border-[#1F3864] border-t-transparent rounded-full animate-spin" />
        Loading your team workspace...
      </div>
    );
  }

  if (myTeams.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] p-12 text-center max-w-lg mx-auto mt-8">
        <span className="material-symbols-outlined text-[48px] text-gray-300 mb-3 block">
          group_off
        </span>
        <h2 className="text-lg font-bold text-[#1A1A1A]">
          No Team Assignment Found
        </h2>
        <p className="text-xs text-gray-500 mt-1 mb-6">
          You are not currently assigned to any active team. Please contact your administrator.
        </p>
      </div>
    );
  }

  const activeMembers =
    currentTeam?.members?.filter((m) => m.removedAt === null) || [];

  const getLifecycleBadge = (behavior: string) => {
    switch (behavior) {
      case "OPEN":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "IN_PROGRESS":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "ON_HOLD":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "RESOLVED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "CLOSED":
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getLifecycleDot = (behavior: string) => {
    switch (behavior) {
      case "OPEN":
        return "bg-[#1E88E5]";
      case "IN_PROGRESS":
        return "bg-[#FB8C00]";
      case "ON_HOLD":
        return "bg-[#8E24AA]";
      case "RESOLVED":
        return "bg-[#43A047]";
      case "CLOSED":
      default:
        return "bg-[#747780]";
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-[#1F3864] text-white rounded-lg shadow-xl text-xs font-semibold animate-in slide-in-from-bottom">
          <span className="material-symbols-outlined text-emerald-400 text-[18px]">
            check_circle
          </span>
          <span>{successToast}</span>
        </div>
      )}

      {/* Clean Header & Breadcrumbs (Zero redundant text) */}
      <div className="flex flex-col space-y-1">
        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
          <span>Home</span>
          <span className="material-symbols-outlined text-[14px]">
            chevron_right
          </span>
          <span className="text-[#1F3864] font-semibold">My Team</span>
        </div>
        <h1 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">
          {currentTeam?.name || "My Team"}
        </h1>
      </div>

      {/* Multi-Team Switcher (if user belongs to multiple teams) */}
      {myTeams.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-semibold text-gray-500 shrink-0">
            Switch Team:
          </span>
          {myTeams.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedTeamId(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                selectedTeamId === t.id
                  ? "bg-[#1F3864] text-white shadow-xs"
                  : "bg-white text-gray-700 border border-[#D1D5DB] hover:bg-gray-50"
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}

      {/* TOP ROW: 4 KPI Cards (Strictly 2 per row on mobile, 4 per row on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Team Name */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-[#E5E7EB] shadow-xs flex flex-col justify-between space-y-3 hover:border-[#1F3864]/30 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Team Name
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#1F3864]/10 text-[#1F3864] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px] sm:text-[20px]">
                groups
              </span>
            </div>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#1A1A1A] truncate" title={currentTeam?.name}>
              {currentTeam?.name || "—"}
            </h3>
            <p className="text-xs text-gray-500 truncate mt-0.5" title={currentTeam?.description || "Operational Unit"}>
              {currentTeam?.description || "Operational Unit"}
            </p>
          </div>
        </div>

        {/* Card 2: Department */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-[#E5E7EB] shadow-xs flex flex-col justify-between space-y-3 hover:border-blue-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Department
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#E3F2FD] text-[#1E88E5] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px] sm:text-[20px]">
                corporate_fare
              </span>
            </div>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#1A1A1A] truncate" title={currentTeam?.department?.name}>
              {currentTeam?.department?.name || "—"}
            </h3>
            <p className="text-xs text-gray-500 font-mono mt-0.5">
              Dept ID: #{currentTeam?.departmentId || "—"}
            </p>
          </div>
        </div>

        {/* Card 3: Team Lead */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-[#E5E7EB] shadow-xs flex flex-col justify-between space-y-3 hover:border-amber-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Team Lead
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#FFF8E1] text-[#F57F17] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px] sm:text-[20px]">
                military_tech
              </span>
            </div>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#1A1A1A] truncate capitalize">
              {currentTeam?.teamAdminEmail ? currentTeam.teamAdminEmail.split("@")[0].replace(".", " ") : "Primary Lead"}
            </h3>
            <p className="text-xs text-gray-500 font-mono truncate mt-0.5" title={currentTeam?.teamAdminEmail}>
              {currentTeam?.teamAdminEmail || "Not assigned"}
            </p>
          </div>
        </div>

        {/* Card 4: Active Members Count */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-[#E5E7EB] shadow-xs flex flex-col justify-between space-y-3 hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Active Members
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px] sm:text-[20px]">
                person_check
              </span>
            </div>
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-[#1A1A1A]">
              {activeMembers.length}
            </h3>
            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active team members
            </p>
          </div>
        </div>
      </div>

      {/* TEAMMATES ROSTER SECTION - LIST VIEW (Web & Mobile Responsive) */}
      <div className="bg-white rounded-xl shadow-xs border border-[#E5E7EB] overflow-hidden">
        {/* Section Header */}
        <div className="p-4 sm:p-5 bg-white border-b border-[#F0F2F5] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1F3864]/10 text-[#1F3864] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">badge</span>
            </div>
            <h2 className="font-bold text-base text-[#1A1A1A]">Team Roster</h2>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 font-semibold border border-gray-200">
            {activeMembers.length} Members
          </span>
        </div>

        {/* Teammates List */}
        <div>
          {isTeamDetailLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-xs text-gray-500 gap-2">
              <span className="w-5 h-5 border-2 border-[#1F3864] border-t-transparent rounded-full animate-spin" />
              Loading roster...
            </div>
          ) : activeMembers.length === 0 ? (
            <div className="py-10 text-center text-xs text-gray-500">
              No teammates currently assigned to this team roster.
            </div>
          ) : (
            <div className="divide-y divide-[#F0F2F5]">
              {activeMembers.map((m) => {
                const initials = (m.user?.name || m.user?.username || "U")
                  .split(" ")
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();
                const isLead =
                  m.user?.email?.toLowerCase() ===
                  currentTeam?.teamAdminEmail?.toLowerCase();

                return (
                  <div
                    key={m.id}
                    className="p-4 sm:px-6 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/60 transition-colors"
                  >
                    {/* Left: Avatar + Name + Role + Email */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#1F3864] to-[#2B5EA7] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-[#1A1A1A] truncate" title={m.user?.name || m.user?.username}>
                            {m.user?.name || m.user?.username}
                          </span>
                          {isLead ? (
                            <span className="px-2 py-0.5 rounded-full bg-[#1F3864]/10 text-[#1F3864] text-[11px] font-bold border border-[#1F3864]/20">
                              Team Lead
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[11px] font-medium">
                              {m.user?.userRole?.name || "Specialist"}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 font-mono block truncate mt-0.5" title={m.user?.email}>
                          {m.user?.email || `@${m.user?.username}`}
                        </span>
                      </div>
                    </div>

                    {/* Right: Joined Date + Active Pill */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 text-xs text-gray-500 pl-12 sm:pl-0 shrink-0">
                      <div className="flex items-center gap-1.5 text-[11px] sm:text-xs">
                        <span className="material-symbols-outlined text-[15px] text-gray-400">
                          calendar_today
                        </span>
                        <span>
                          Joined {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : "—"}
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* TEAM WORKFLOW STATUSES SECTION - LIST VIEW (Web & Mobile Responsive) */}
      <div className="bg-white rounded-xl shadow-xs border border-[#E5E7EB] overflow-hidden">
        {/* Section Header */}
        <div className="p-4 sm:p-5 bg-white border-b border-[#F0F2F5] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1E88E5] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">
                account_tree
              </span>
            </div>
            <h2 className="font-bold text-base text-[#1A1A1A]">
              Team Workflow Statuses
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setIsNewStatusOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1F3864] hover:bg-[#152747] text-white rounded-lg text-xs font-semibold shadow-xs transition-all active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>New Status</span>
          </button>
        </div>

        {/* Statuses List */}
        <div>
          {isStatusesLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-xs text-gray-500 gap-2">
              <span className="w-5 h-5 border-2 border-[#1F3864] border-t-transparent rounded-full animate-spin" />
              Loading workflow statuses...
            </div>
          ) : teamStatuses.length === 0 ? (
            <div className="py-10 text-center text-xs text-gray-500">
              No custom workflow statuses configured for this team.
            </div>
          ) : (
            <div className="divide-y divide-[#F0F2F5]">
              {teamStatuses.map((s) => {
                const dotColor = getLifecycleDot(s.behavior);
                const badgeClass = getLifecycleBadge(s.behavior);
                const isTeamSpecific = Boolean(s.teamId);

                return (
                  <div
                    key={s.id}
                    className="p-4 sm:px-6 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/60 transition-colors"
                  >
                    {/* Left: Dot + Custom Label + Optional Description */}
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      <span className={`w-3 h-3 rounded-full mt-1 sm:mt-0 shrink-0 ${dotColor}`} />
                      <div className="min-w-0">
                        <span className="font-bold text-sm text-[#1A1A1A] block truncate" title={s.label}>
                          {s.label}
                        </span>
                        {s.description && (
                          <span className="text-xs text-gray-500 line-clamp-1 block mt-0.5">
                            {s.description}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Mapped Lifecycle Badge + Scope Pill */}
                    <div className="flex items-center gap-2.5 sm:gap-4 pl-6 sm:pl-0 shrink-0">
                      <span
                        className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold uppercase tracking-wider ${badgeClass}`}
                      >
                        {s.behavior.replace("_", " ")}
                      </span>
                      {isTeamSpecific ? (
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-[#0e61a1] border border-blue-100">
                          {currentTeam?.name}
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                          Global Default
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* New Status Modal */}
      {currentTeam && (
        <CreateStatusModal
          teamId={currentTeam.id}
          teamName={currentTeam.name}
          isOpen={isNewStatusOpen}
          onClose={() => setIsNewStatusOpen(false)}
          onSuccess={() => showToast("New workflow status created successfully!")}
        />
      )}
    </div>
  );
};

export default UserMyTeam;
