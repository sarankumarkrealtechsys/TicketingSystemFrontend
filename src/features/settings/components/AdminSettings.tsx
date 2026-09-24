import React, { useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/layout/AppLayout";
import { PERMISSIONS } from "@/features/auth/permissions";
import { Can } from "@/shared/components";
import { useCan } from "@/features/auth";
import {
  useEmailNotificationsQuery,
  useInAppNotificationsQuery,
  useUpdateEmailNotificationsMutation,
  useUpdateInAppNotificationsMutation,
} from "../api";
import { ROUTES } from "@/app/routes/routePaths";

export const AdminSettings: React.FC = () => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const canManageEmail = useCan(PERMISSIONS.EMAIL_NOTIFICATIONS_MANAGE);
  const canManageInApp = useCan(PERMISSIONS.IN_APP_NOTIFICATIONS_MANAGE);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage(text);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  return (
    <AppLayout>
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2.5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${
            toastType === "success"
              ? "bg-emerald-900 text-white border-emerald-700"
              : "bg-red-900 text-white border-red-700"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {toastType === "success" ? "check_circle" : "error"}
          </span>
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 hover:opacity-75 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      <div className="flex flex-col gap-6 w-full pb-12">
        {/* Breadcrumbs & Page Header */}
        <div className="flex flex-col gap-1.5">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
            <Link
              to={ROUTES.ROOT}
              className="hover:text-[#1F3864] dark:hover:text-blue-400 transition-colors cursor-pointer"
            >
              Home
            </Link>
            <span className="material-symbols-outlined text-[14px] text-gray-400 select-none">chevron_right</span>
            <Link
              to={ROUTES.ADMIN_DASHBOARD}
              className="hover:text-[#1F3864] dark:hover:text-blue-400 transition-colors cursor-pointer"
            >
              Management
            </Link>
            <span className="material-symbols-outlined text-[14px] text-gray-400 select-none">chevron_right</span>
            <span className="text-[#1F3864] font-semibold">Settings</span>
          </nav>

          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-2xl font-bold text-[#1F3864] tracking-tight">System Settings</h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#1F3864]/10 text-[#1F3864] text-[11px] font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-[13px]">lock</span>
              Administrative Access
            </span>
          </div>
        </div>

        {/* Section: Notification Channels */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#1F3864] text-[20px]">
              notifications
            </span>
            <h2 className="text-base font-bold text-[#0F172A]">
              Notification Channels
            </h2>
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
            <div className="flex flex-col gap-4">
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
  const { data, isLoading, isError } = useEmailNotificationsQuery();
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

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-[#E2E8F0] p-4 sm:p-5 transition-all hover:shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Channel Icon & Info */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-[#1F3864]/10 text-[#1F3864] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px]">
              {isEnabled ? "mark_email_read" : "unsubscribe"}
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-gray-900">Email Notifications</h3>
              {isLoading ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-500 animate-pulse">
                  Loading...
                </span>
              ) : isEnabled ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Paused
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500 mt-0.5">
              Outbound transactional emails across the platform.
            </span>
          </div>
        </div>

        {/* Toggle Switch */}
        <div className="flex items-center gap-3 self-end sm:self-auto shrink-0 pt-1 sm:pt-0">
          <span
            className={`text-xs font-bold uppercase tracking-wider transition-colors ${
              isEnabled ? "text-[#1F3864]" : "text-gray-400"
            }`}
          >
            {isEnabled ? "Enabled" : "Disabled"}
          </span>

          <button
            type="button"
            role="switch"
            aria-checked={isEnabled}
            disabled={isLoading || updateMutation.isPending}
            onClick={handleToggle}
            className={`relative inline-flex h-[28px] w-[52px] shrink-0 cursor-pointer items-center rounded-full p-[2px] transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#1F3864] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 shadow-inner ${
              isEnabled ? "bg-[#1F3864]" : "bg-slate-300"
            }`}
            title={isEnabled ? "Disable email notifications" : "Enable email notifications"}
          >
            <span
              className={`inline-flex h-[24px] w-[24px] transform rounded-full bg-white shadow-md transition duration-200 ease-in-out items-center justify-center ${
                isEnabled ? "translate-x-[24px]" : "translate-x-0"
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

      {isError && (
        <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2 font-medium">
          <span className="material-symbols-outlined text-[16px]">error</span>
          <span>Could not retrieve status. Defaulted to fail-closed.</span>
        </div>
      )}
    </div>
  );
};

/**
 * Global In-App Notifications Toggle Card
 */
const InAppNotificationsCard: React.FC<CardProps> = ({ showToast }) => {
  const { data, isLoading, isError } = useInAppNotificationsQuery();
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

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-[#E2E8F0] p-4 sm:p-5 transition-all hover:shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Channel Icon & Info */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-[#1F3864]/10 text-[#1F3864] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px]">
              {isEnabled ? "notifications_active" : "notifications_off"}
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-gray-900">In-App Notifications</h3>
              {isLoading ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-500 animate-pulse">
                  Loading...
                </span>
              ) : isEnabled ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Paused
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500 mt-0.5">
              Live Socket.IO alerts and bell notification delivery.
            </span>
          </div>
        </div>

        {/* Toggle Switch */}
        <div className="flex items-center gap-3 self-end sm:self-auto shrink-0 pt-1 sm:pt-0">
          <span
            className={`text-xs font-bold uppercase tracking-wider transition-colors ${
              isEnabled ? "text-[#1F3864]" : "text-gray-400"
            }`}
          >
            {isEnabled ? "Enabled" : "Disabled"}
          </span>

          <button
            type="button"
            role="switch"
            aria-checked={isEnabled}
            disabled={isLoading || updateMutation.isPending}
            onClick={handleToggle}
            className={`relative inline-flex h-[28px] w-[52px] shrink-0 cursor-pointer items-center rounded-full p-[2px] transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#1F3864] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 shadow-inner ${
              isEnabled ? "bg-[#1F3864]" : "bg-slate-300"
            }`}
            title={isEnabled ? "Disable in-app notifications" : "Enable in-app notifications"}
          >
            <span
              className={`inline-flex h-[24px] w-[24px] transform rounded-full bg-white shadow-md transition duration-200 ease-in-out items-center justify-center ${
                isEnabled ? "translate-x-[24px]" : "translate-x-0"
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

      {isError && (
        <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2 font-medium">
          <span className="material-symbols-outlined text-[16px]">error</span>
          <span>Could not retrieve status. Defaulted to fail-closed.</span>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
