import React, { useState } from "react";
import { AppLayout } from "@/layout/AppLayout";
import { useEmailNotificationsQuery, useUpdateEmailNotificationsMutation } from "../api";

export const AdminSettings: React.FC = () => {
  const { data, isLoading, isError, refetch, isFetching } = useEmailNotificationsQuery();
  const updateMutation = useUpdateEmailNotificationsMutation();
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const [optimisticEnabled, setOptimisticEnabled] = useState<boolean | null>(null);
  const isEnabled = optimisticEnabled !== null ? optimisticEnabled : (data?.enabled ?? true);

  const handleToggle = async () => {
    if (updateMutation.isPending) return;
    const nextState = !isEnabled;
    setOptimisticEnabled(nextState);
    try {
      await updateMutation.mutateAsync({ enabled: nextState });
      setOptimisticEnabled(null);
      showToast(
        nextState
          ? "Email notifications have been globally enabled."
          : "Email notifications have been globally halted."
      );
    } catch {
      setOptimisticEnabled(null);
      showToast("Failed to update email notification settings. Please try again.", "error");
    }
  };

  const formattedDate = data?.updatedAt
    ? new Date(data.updatedAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : null;

  return (
    <AppLayout>
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-[#1F3864] text-white text-xs font-semibold rounded-xl shadow-xl border border-white/20 animate-in fade-in slide-in-from-top-4 duration-200">
          <span className="material-symbols-outlined text-[18px] text-emerald-400">
            {toastMessage.type === "success" ? "check_circle" : "error"}
          </span>
          <span>{toastMessage.text}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-white/60 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      <div className="flex flex-col gap-6 w-full pb-12">
        {/* Breadcrumbs & Page Header */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
            <span>Workspace</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span>System Configuration</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-[#1F3864] font-semibold">Settings</span>
          </div>

          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-2xl font-bold text-[#1F3864] tracking-tight">System Settings</h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#1F3864]/10 text-[#1F3864] text-[11px] font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-[13px]">lock</span>
              Admin Role Only
            </span>
          </div>

          <p className="text-xs text-gray-600 max-w-2xl leading-relaxed">
            Manage enterprise-wide system configurations, outbound notification dispatches, and global support policies.
          </p>
        </div>

        {/* Global Settings Card: Email Notifications */}
        <div className="bg-white rounded-2xl shadow-xs border border-[#EEEEEE] overflow-hidden transition-shadow hover:shadow-sm">
          {/* Card Header */}
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-[#1F3864]/10 text-[#1F3864] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[26px]">
                  {isEnabled ? "notifications_active" : "notifications_off"}
                </span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-base font-bold text-gray-900">Email Notifications</h2>
                  {isLoading ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-500 animate-pulse">
                      Loading...
                    </span>
                  ) : isEnabled ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active (Dispatching)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Halted (Paused)
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500 mt-0.5">
                  Controls all outbound transactional email delivery system-wide.
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={isFetching}
              onClick={() => refetch()}
              className="self-start sm:self-auto px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-[#1F3864] hover:bg-gray-50 rounded-lg border border-gray-200 flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              title="Refresh status"
            >
              <span className={`material-symbols-outlined text-[16px] ${isFetching ? "animate-spin" : ""}`}>
                refresh
              </span>
              <span>Re-check DB</span>
            </button>
          </div>

          {/* Card Body */}
          <div className="p-6 space-y-6">
            {/* Description & Impact Summary */}
            <p className="text-xs text-gray-600 leading-relaxed">
              When disabled, the backend server will immediately halt and suppress all outbound email notifications
              across the entire platform. This includes ticket creation receipts, workflow status changes, assignee
              notifications, team collaboration alerts, sub-ticket updates, and automated SLA escalation notices.
            </p>

            {/* Visual State Banner */}
            {isEnabled ? (
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-3">
                <span className="material-symbols-outlined text-emerald-600 text-[20px] shrink-0 mt-0.5">
                  mark_email_read
                </span>
                <div className="flex flex-col text-xs text-emerald-950">
                  <span className="font-bold">Email delivery is operating normally</span>
                  <span className="text-emerald-800/90 mt-0.5 leading-relaxed">
                    Transactional emails are actively being sent to ticket creators, assignees, and participating teams
                    according to established event triggers.
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3">
                <span className="material-symbols-outlined text-amber-600 text-[20px] shrink-0 mt-0.5">
                  unsubscribe
                </span>
                <div className="flex flex-col text-xs text-amber-950">
                  <span className="font-bold">Email delivery is globally halted</span>
                  <span className="text-amber-800/90 mt-0.5 leading-relaxed">
                    No notification emails are being sent out by the system. In-app activity and database operations
                    continue as normal without outbound dispatches.
                  </span>
                </div>
              </div>
            )}

            {isError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2 font-medium">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>Could not retrieve current setting status from PostgreSQL. System has defaulted to fail-closed.</span>
              </div>
            )}

            {/* The Dedicated ON / OFF Toggle Row */}
            <div className="p-4 sm:p-5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-900">
                  Global Email Delivery Switch
                </span>
                <span className="text-[11px] text-gray-500 mt-0.5">
                  {isEnabled
                    ? "Turn off to immediately stop all outgoing email dispatches platform-wide"
                    : "Turn on to resume normal outgoing email notification dispatches"}
                </span>
              </div>

              {/* Accessible Interactive Toggle Button & Label */}
              <div
                onClick={handleToggle}
                className="flex items-center gap-3.5 self-start sm:self-auto cursor-pointer select-none group"
              >
                <span
                  className={`text-xs font-bold uppercase tracking-wider transition-colors ${
                    isEnabled ? "text-[#1F3864]" : "text-gray-500"
                  }`}
                >
                  {isEnabled ? "Enabled" : "Disabled"}
                </span>

                <button
                  type="button"
                  role="switch"
                  aria-checked={isEnabled}
                  disabled={isLoading || updateMutation.isPending}
                  className={`relative inline-flex h-[30px] w-[56px] shrink-0 cursor-pointer items-center rounded-full p-[3px] transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#1F3864] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 shadow-inner ${
                    isEnabled ? "bg-[#1F3864]" : "bg-slate-300"
                  }`}
                  title={isEnabled ? "Click to disable all email notifications" : "Click to enable all email notifications"}
                >
                  <span
                    className={`inline-flex h-[24px] w-[24px] transform rounded-full bg-white shadow-md transition duration-200 ease-in-out items-center justify-center ${
                      isEnabled ? "translate-x-[26px]" : "translate-x-0"
                    }`}
                  >
                    {updateMutation.isPending ? (
                      <span className="w-3.5 h-3.5 border-2 border-[#1F3864] border-t-transparent rounded-full animate-spin" />
                    ) : isEnabled ? (
                      <svg className="w-3.5 h-3.5 text-[#1F3864]" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Card Footer: Metadata */}
          <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px] text-gray-400">history</span>
              <span>
                {formattedDate ? `Last updated: ${formattedDate}` : "Status loaded from PostgreSQL system_settings"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="font-medium text-gray-600">Database Synced</span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminSettings;
