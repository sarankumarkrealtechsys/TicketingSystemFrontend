import React from "react";
import { AppLayout } from "@/layout/AppLayout";
import { useAppSelector, useCan } from "@/features/auth/authSlice";

export const UserDashboard: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const canCreateTicket = useCan("TICKET_CREATE");
  const canViewTickets = useCan("TICKET_VIEW");

  return (
    <AppLayout role="USER">
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1A1A1A]">
              Welcome back, {user?.name || user?.username || "User"}
            </h1>
            <p className="text-sm text-[#5F6368] mt-0.5">
              Department:{" "}
              <span className="font-semibold text-[#1A1A1A]">
                {user?.department?.name || "General"}
              </span>{" "}
              • Role:{" "}
              <span className="font-semibold text-[#1A1A1A]">
                {user?.role?.name || "Standard User"}
              </span>
            </p>
          </div>

          {canCreateTicket && (
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E88E5] text-white rounded-lg text-sm font-semibold shadow-sm hover:bg-[#1976D2] transition-colors active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Create New Ticket
            </button>
          )}
        </div>

        {/* Quick KPI / Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-[10px] border border-[#EEEEEE] shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#5F6368] uppercase tracking-wider">
                My Open Tickets
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#E3F2FD] flex items-center justify-center text-[#1E88E5]">
                <span className="material-symbols-outlined text-[18px]">
                  confirmation_number
                </span>
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-[#1A1A1A]">0</span>
              <span className="text-xs text-[#5F6368] ml-2">Active</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-[10px] border border-[#EEEEEE] shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#5F6368] uppercase tracking-wider">
                Awaiting My Reply
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#FFF8E1] flex items-center justify-center text-[#F9A825]">
                <span className="material-symbols-outlined text-[18px]">
                  pending_actions
                </span>
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-[#1A1A1A]">0</span>
              <span className="text-xs text-[#5F6368] ml-2">Pending review</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-[10px] border border-[#EEEEEE] shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#5F6368] uppercase tracking-wider">
                Resolved Tickets
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#E8F5E9] flex items-center justify-center text-[#2E7D32]">
                <span className="material-symbols-outlined text-[18px]">
                  task_alt
                </span>
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-[#1A1A1A]">0</span>
              <span className="text-xs text-[#2E7D32] ml-2">Closed</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-[10px] border border-[#EEEEEE] shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#5F6368] uppercase tracking-wider">
                Average Resolution
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#F3E5F5] flex items-center justify-center text-[#7B1FA2]">
                <span className="material-symbols-outlined text-[18px]">
                  schedule
                </span>
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-[#1A1A1A]">--</span>
              <span className="text-xs text-[#5F6368] ml-2">SLA on track</span>
            </div>
          </div>
        </div>

        {/* User Scope / Permission Information Card */}
        <div className="bg-white rounded-[10px] border border-[#EEEEEE] shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#EEEEEE] pb-3">
            <div>
              <h2 className="text-base font-bold text-[#1A1A1A]">
                Session & Authorization Scope
              </h2>
              <p className="text-xs text-[#5F6368] mt-0.5">
                Active permissions granted to your role for enterprise resource access
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E8F5E9] text-[#2E7D32]">
              <span className="w-2 h-2 rounded-full bg-[#2E7D32]"></span>
              Session Authenticated
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3 bg-[#F7F8FA] rounded-lg border border-[#EEEEEE]">
              <span className="text-[11px] font-semibold text-[#5F6368] uppercase">
                User ID
              </span>
              <p className="text-sm font-bold text-[#1A1A1A] mt-0.5">#{user?.id}</p>
            </div>
            <div className="p-3 bg-[#F7F8FA] rounded-lg border border-[#EEEEEE]">
              <span className="text-[11px] font-semibold text-[#5F6368] uppercase">
                Username
              </span>
              <p className="text-sm font-bold text-[#1A1A1A] mt-0.5">
                {user?.username}
              </p>
            </div>
            <div className="p-3 bg-[#F7F8FA] rounded-lg border border-[#EEEEEE]">
              <span className="text-[11px] font-semibold text-[#5F6368] uppercase">
                Department
              </span>
              <p className="text-sm font-bold text-[#1A1A1A] mt-0.5">
                {user?.department?.name || "General Support"}
              </p>
            </div>
            <div className="p-3 bg-[#F7F8FA] rounded-lg border border-[#EEEEEE]">
              <span className="text-[11px] font-semibold text-[#5F6368] uppercase">
                Ticket Access
              </span>
              <p className="text-sm font-bold text-[#1E88E5] mt-0.5">
                {canViewTickets ? "Authorized" : "Restricted"}
              </p>
            </div>
          </div>
        </div>

        {/* Ticket Queue Placeholder */}
        <div className="bg-white rounded-[10px] border border-[#EEEEEE] shadow-sm p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#E3F2FD] text-[#1E88E5] mx-auto flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">inbox</span>
          </div>
          <h3 className="text-base font-bold text-[#1A1A1A]">No Active Tickets</h3>
          <p className="text-xs text-[#5F6368] max-w-md mx-auto">
            You currently have no open tickets in your personal queue. Need technical
            assistance? Submit a ticket above to reach the IT support team.
          </p>
        </div>
      </div>
    </AppLayout>
  );
};

export default UserDashboard;
