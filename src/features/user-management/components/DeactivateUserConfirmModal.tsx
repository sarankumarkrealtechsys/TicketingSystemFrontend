import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useDeactivateUserMutation, useUpdateUserMutation } from "../api";
import { UserListItem } from "../types";

interface DeactivateUserConfirmModalProps {
  user: UserListItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
}

export const DeactivateUserConfirmModal: React.FC<
  DeactivateUserConfirmModalProps
> = ({ user, isOpen, onClose, onSuccess }) => {
  const [error, setError] = useState<string | null>(null);

  const deactivateMutation = useDeactivateUserMutation();
  const updateMutation = useUpdateUserMutation();

  if (!isOpen || !user) return null;

  const isCurrentlyActive = user.status === "ACTIVE";

  const handleConfirm = async () => {
    setError(null);
    try {
      if (isCurrentlyActive) {
        await deactivateMutation.mutateAsync(user.id);
        onSuccess?.(`User "${user.username}" deactivated successfully.`);
      } else {
        await updateMutation.mutateAsync({
          userId: user.id,
          data: { status: "ACTIVE" },
        });
        onSuccess?.(`User "${user.username}" reactivated successfully.`);
      }
      onClose();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          `Failed to ${isCurrentlyActive ? "deactivate" : "reactivate"} user.`
      );
    }
  };

  const isPending =
    deactivateMutation.isPending || updateMutation.isPending;

  return createPortal(
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#121E30] rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-sm overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center space-y-3">
          <div
            className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center ${
              isCurrentlyActive
                ? "bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
                : "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
            }`}
          >
            <span className="material-symbols-outlined text-[28px]">
              {isCurrentlyActive ? "person_off" : "person_check"}
            </span>
          </div>

          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            {isCurrentlyActive ? "Deactivate User Account" : "Reactivate User Account"}
          </h3>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            {isCurrentlyActive ? (
              <>
                Are you sure you want to deactivate{" "}
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  @{user.username}
                </span>
                ? The user will immediately be logged out and unable to access the system.
              </>
            ) : (
              <>
                Are you sure you want to reactivate{" "}
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  @{user.username}
                </span>
                ? The user will be able to log in and access assigned features.
              </>
            )}
          </p>

          {error && (
            <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-red-600 dark:text-red-400 text-xs">
              {error}
            </div>
          )}
        </div>

        <div className="px-6 py-3.5 bg-gray-50 dark:bg-slate-800/40 flex items-center justify-end gap-2.5 border-t border-gray-100 dark:border-gray-800 text-xs">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-3.5 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
            className={`px-4 py-2 rounded-lg text-white font-semibold shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 ${
              isCurrentlyActive
                ? "bg-amber-600 hover:bg-amber-700"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {isPending && (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            <span>
              {isCurrentlyActive ? "Deactivate User" : "Reactivate User"}
            </span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
