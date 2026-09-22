import React, { useState, useEffect } from 'react';
import { RoleItem, RoleDetail } from '../types';
import { SelectDropdown } from '@/shared/components';

interface EditRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: RoleItem | RoleDetail | null;
  onSubmit: (data: { name?: string; description?: string; status?: 'ACTIVE' | 'INACTIVE' }) => Promise<void>;
  isLoading: boolean;
}

export const EditRoleModal: React.FC<EditRoleModalProps> = ({
  isOpen,
  onClose,
  role,
  onSubmit,
  isLoading,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (role) {
      setName(role.name || '');
      setDescription(role.description || '');
      setStatus(role.status || 'ACTIVE');
      setError(null);
    }
  }, [role, isOpen]);

  if (!isOpen || !role) return null;

  const isSystem = role.isSystem || ['ADMIN', 'USER'].includes(role.name.toUpperCase());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Role name is required');
      return;
    }

    try {
      setError(null);
      await onSubmit({
        name: isSystem ? undefined : name.trim(),
        description: description.trim() || undefined,
        status: isSystem ? undefined : status,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to update role');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#03224D]/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-[#F8FAFC] flex items-center justify-between border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#1F3864] text-[22px]">
              edit
            </span>
            <h3 className="font-semibold text-[17px] text-[#0F172A]">
              Edit Role Metadata
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 rounded-lg p-1 hover:bg-gray-100 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <div>
            <label
              htmlFor="edit-role-name"
              className="block font-medium text-xs text-[#334155] uppercase tracking-wider mb-1.5"
            >
              Role Name <span className="text-red-500">*</span>
            </label>
            <input
              id="edit-role-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading || isSystem}
              className={`w-full h-10 px-3 bg-white border border-[#CBD5E1] rounded-lg text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E88E5] focus:border-transparent transition-all ${
                isSystem ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
              }`}
            />
            {isSystem && (
              <p className="text-[11px] text-amber-600 mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">lock</span>
                System role names cannot be modified.
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="edit-role-desc"
              className="block font-medium text-xs text-[#334155] uppercase tracking-wider mb-1.5"
            >
              Description
            </label>
            <textarea
              id="edit-role-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the role responsibilities..."
              disabled={isLoading}
              className="w-full p-3 bg-white border border-[#CBD5E1] rounded-lg text-sm text-[#0F172A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E88E5] focus:border-transparent transition-all"
            />
          </div>

          {!isSystem && (
            <div>
              <label
                htmlFor="edit-role-status"
                className="block font-medium text-xs text-[#334155] uppercase tracking-wider mb-1.5"
              >
                Status
              </label>
              <SelectDropdown<'ACTIVE' | 'INACTIVE'>
                id="edit-role-status"
                value={status}
                onChange={(val) => setStatus(val)}
                options={[
                  { value: 'ACTIVE', label: 'Active', dotColor: 'bg-emerald-500', sublabel: 'Assignable to active users' },
                  { value: 'INACTIVE', label: 'Inactive (Retired)', dotColor: 'bg-gray-400', sublabel: 'Cannot be assigned to users' },
                ]}
                disabled={isLoading}
                size="md"
              />
            </div>
          )}

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
              type="submit"
              disabled={isLoading}
              className="h-9 px-5 rounded-lg text-xs font-semibold bg-[#1F3864] hover:bg-[#284980] text-white shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRoleModal;
