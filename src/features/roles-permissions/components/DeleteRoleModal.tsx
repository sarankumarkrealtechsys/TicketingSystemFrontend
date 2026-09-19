import React, { useState } from 'react';
import { RoleItem, RoleDetail } from '../types';

interface DeleteRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: RoleItem | RoleDetail | null;
  onConfirm: (id: number) => Promise<void>;
  isLoading: boolean;
}

export const DeleteRoleModal: React.FC<DeleteRoleModalProps> = ({
  isOpen,
  onClose,
  role,
  onConfirm,
  isLoading,
}) => {
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !role) return null;

  const handleConfirm = async () => {
    try {
      setError(null);
      await onConfirm(role.id);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to delete role');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#03224D]/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-red-50 flex items-center justify-between border-b border-red-100">
          <div className="flex items-center gap-2.5 text-red-700">
            <span className="material-symbols-outlined text-[22px]">
              warning
            </span>
            <h3 className="font-semibold text-[17px]">
              Delete Custom Role
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 rounded-lg p-1 hover:bg-red-100/50 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <p className="text-sm text-gray-600 leading-relaxed">
            Are you sure you want to permanently delete the custom role{' '}
            <strong className="text-[#0F172A]">"{role.name}"</strong>?
          </p>

          {role.userCount > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] text-amber-600 shrink-0">
                group
              </span>
              <span>
                <strong>Warning:</strong> {role.userCount} active user(s) are currently assigned to this role. You must reassign those users before deleting.
              </span>
            </div>
          )}

          <p className="text-xs text-gray-500">
            This action will remove all capability grants linked to this role and cannot be undone.
          </p>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 mt-2 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="h-9 px-4 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isLoading || role.userCount > 0}
              className="h-9 px-5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                  <span>Confirm Deletion</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteRoleModal;
