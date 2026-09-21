import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useDeleteUserMutation } from "../api";
import { UserListItem } from "../types";

interface DeleteUserConfirmModalProps {
  user: UserListItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
}

export const DeleteUserConfirmModal: React.FC<DeleteUserConfirmModalProps> = ({
  user,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [error, setError] = useState<string | null>(null);
  const deleteMutation = useDeleteUserMutation();

  if (!isOpen || !user) return null;

  const handleConfirm = async () => {
    setError(null);
    try {
      await deleteMutation.mutateAsync(user.id);
      onSuccess?.(`User "${user.username}" deleted successfully.`);
      onClose();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to delete user."
      );
    }
  };

  const isPending = deleteMutation.isPending;

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
          <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400">
            <span className="material-symbols-outlined text-[28px]">
              delete_forever
            </span>
          </div>

          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            Delete User Account
          </h3>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Are you sure you want to permanently delete{" "}
            <span className="font-semibold text-gray-800 dark:text-gray-200">
              @{user.username}
            </span>
            ? This action cannot be undone.
          </p>

          {error && (
            <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-red-600 dark:text-red-400 text-xs text-left">
              <div className="flex items-start gap-1.5">
                <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5">
                  error
                </span>
                <span>{error}</span>
              </div>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isPending}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">
                    delete
                  </span>
                  <span>Delete User</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
