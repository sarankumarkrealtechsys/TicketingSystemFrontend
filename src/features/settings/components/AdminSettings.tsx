import React, { useState } from "react";
import { AppLayout } from "@/layout/AppLayout";
import { Can } from "@/shared/components";
import { PERMISSIONS, useCan } from "@/features/auth";
import {
  useEmailNotificationsQuery,
  useUpdateEmailNotificationsMutation,
  useInAppNotificationsQuery,
  useUpdateInAppNotificationsMutation,
} from "../api";

export const AdminSettings: React.FC = () => {
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const canManageEmail = useCan(PERMISSIONS.EMAIL_NOTIFICATIONS_MANAGE);
  const canManageInApp = useCan(PERMISSIONS.IN_APP_NOTIFICATIONS_MANAGE);

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

      <div className="flex flex-col gap-8 w-full pb-12">
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
              Administrative Access
            </span>
          </div>

          <p className="text-xs text-gray-600 max-w-2xl leading-relaxed">
            Manage enterprise-wide system configurations, outbound notification dispatches, and real-time operational policies.
          </p>
        </div>

        {/* Section: Notification Channels */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#1F3864] text-[20px]">
                notifications
              </span>
              Notification Channels
            </h2>
            <p className="text-xs text-gray-500">
              Configure global dispatch kill switches for outbound transactional emails and real-time in-app alerts.
            </p>
          </div>

          {!canManageEmail && !canManageInApp ? (
            <div className="p-8 rounded-2xl bg-white border border-[#E2E8F0] text-center flex flex-col items-center justify-center gap-2 shadow-2xs">
              <span className="material-symbols-outlined text-gray-400 text-[36px]">
                lock
              </span>
              <p className="text-sm font-semibold text-gray-700">No Accessible Settings</p>
              <p className="text-xs text-gray-500 max-w-md">
                Your role does not possess permissions to configure email or in-app notification channels.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Card 1: Email Notifications */}
              <Can permission={PERMISSIONS.EMAIL_NOTIFICATIONS_MANAGE}>
                <EmailNotificationsCard showToast={showToast} />
              </Can>

              {/* Card 2: In-App Notifications */}
              <Can permission={PERMISSIONS.IN_APP_NOTIFICATIONS_MANAGE}>
                <InAppNotificationsCard showToast={showToast} />
              </Can>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

interface CardProps {
  showToast: (text: string, type?: "success" | "error") => void;
}

/**
 * Global Email Notifications Toggle Card
 */
const EmailNotificationsCard: React.FC<CardProps> = ({ showToast }) => {
  const { data, isLoading, isError, refetch, isFetching } = useEmailNotificationsQuery();
  const updateMutation = useUpdateEmailNotificationsMutation();

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
    <div className="bg-white rounded-2xl shadow-xs border border-[#EEEEEE] overflow-hidden transition-shadow hover:shadow-sm">
      {/* Card Header */}
      <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#1F3864]/10 text-[#1F3864] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[26px]">
              {isEnabled ? "mark_email_read" : "unsubscribe"}
            </span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2.5">
              <h3 className="text-base font-bold text-gray-900">Email Notifications</h3>
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

        {/* Toggle Switch Row */}
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
  );
};

/**
 * Global In-App Notifications Toggle Card
 */
const InAppNotificationsCard: React.FC<CardProps> = ({ showToast }) => {
  const { data, isLoading, isError, refetch, isFetching } = useInAppNotificationsQuery();
  const updateMutation = useUpdateInAppNotificationsMutation();

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
          ? "In-app notifications have been globally enabled."
          : "In-app notifications have been globally halted."
      );
    } catch {
      setOptimisticEnabled(null);
      showToast("Failed to update in-app notification settings. Please try again.", "error");
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
              <h3 className="text-base font-bold text-gray-900">In-App Notifications</h3>
              {isLoading ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-500 animate-pulse">
                  Loading...
                </span>
              ) : isEnabled ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active (Broadcasting)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Halted (Paused)
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500 mt-0.5">
              Controls real-time Socket.IO alerts and bell notifications across the platform.
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
        <p className="text-xs text-gray-600 leading-relaxed">
          When disabled, the backend server will immediately halt and suppress all real-time Socket.IO notification
          broadcasts and database notification record creation. Ticket assignments, updates, and collaborative actions
          will not generate in-app alerts.
        </p>

        {/* Visual State Banner */}
        {isEnabled ? (
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-3">
            <span className="material-symbols-outlined text-emerald-600 text-[20px] shrink-0 mt-0.5">
              notifications_active
            </span>
            <div className="flex flex-col text-xs text-emerald-950">
              <span className="font-bold">In-app notifications are operating normally</span>
              <span className="text-emerald-800/90 mt-0.5 leading-relaxed">
                Live Socket.IO alerts and bell notification records are actively being delivered to assigned users
                in real time.
              </span>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3">
            <span className="material-symbols-outlined text-amber-600 text-[20px] shrink-0 mt-0.5">
              notifications_off
            </span>
            <div className="flex flex-col text-xs text-amber-950">
              <span className="font-bold">In-app notifications are globally halted</span>
              <span className="text-amber-800/90 mt-0.5 leading-relaxed">
                No notification records are written to the database and no live Socket.IO events are emitted.
                Application operations and ticket workflows continue as normal without in-app alerts.
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

        {/* Toggle Switch Row */}
        <div className="p-4 sm:p-5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-900">
              Global In-App Notification Switch
            </span>
            <span className="text-[11px] text-gray-500 mt-0.5">
              {isEnabled
                ? "Turn off to immediately halt all in-app notification creation and live socket alerts"
                : "Turn on to resume normal in-app notification creation and live socket alerts"}
            </span>
          </div>

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
              title={isEnabled ? "Click to disable all in-app notifications" : "Click to enable all in-app notifications"}
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
  );
};

export default AdminSettings;
