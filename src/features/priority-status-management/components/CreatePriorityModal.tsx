import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { MasterDataStatus } from '../types';
import { useCreatePriorityMutation } from '../api';
import { ColorPickerSection } from './ColorPickerSection';
import { setPriorityColor, getPriorityColor } from '../colorRegistry';

interface CreatePriorityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (msg: string) => void;
  existingCount?: number;
}

export const CreatePriorityModal: React.FC<CreatePriorityModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  existingCount = 0,
}) => {
  const [label, setLabel] = useState('');
  const [sortOrder, setSortOrder] = useState<number>(existingCount + 1);
  const [color, setColor] = useState<string>('#EF4444');
  const [hasUserPickedColor, setHasUserPickedColor] = useState<boolean>(false);
  const [status, setStatus] = useState<MasterDataStatus>('ACTIVE');
  const [errorMessage, setErrorMessage] = useState('');

  const createPriorityMutation = useCreatePriorityMutation();

  if (!isOpen) return null;

  const handleLabelChange = (newLabel: string) => {
    setLabel(newLabel);
    if (!hasUserPickedColor) {
      setColor(getPriorityColor(null, newLabel));
    }
  };

  const handleColorChange = (newHex: string) => {
    setColor(newHex);
    setHasUserPickedColor(true);
  };

  const resetForm = () => {
    setLabel('');
    setSortOrder(existingCount + 2);
    setColor('#EF4444');
    setHasUserPickedColor(false);
    setStatus('ACTIVE');
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!label.trim()) {
      setErrorMessage('Priority label is required.');
      return;
    }

    try {
      const created = await createPriorityMutation.mutateAsync({
        label: label.trim(),
        sortOrder: Number(sortOrder) || 0,
        status,
      });

      // Save custom color keyed by both ID and label for 100% color fidelity
      setPriorityColor(created.id, color, created.label);

      resetForm();
      onSuccess?.(`Priority level "${created.label}" created successfully.`);
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to create priority level.';
      setErrorMessage(msg);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 top-0 left-0 right-0 bottom-0 !m-0 z-[100] flex items-center justify-center p-4 bg-[#0F1B2D]/50 backdrop-blur-[8px] transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-[0_25px_60px_-12px_rgba(0,0,0,0.4)] w-full max-w-md mx-4 overflow-hidden border border-[#E2E8F0] flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient Header Accent */}
        <div className="h-1.5 bg-gradient-to-r from-[#1F3864] via-[#2B5EA7] to-[#0e61a1]" />

        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-b from-[#FAFBFD] to-white border-b border-[#EEF1F5] flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1F3864] to-[#2B5EA7] text-white flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-[20px]">flag</span>
            </div>
            <div>
              <h3 className="font-bold text-base text-[#1A1A1A] leading-tight tracking-tight">
                New Priority Level
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Define a global ticket priority ranking
              </p>
            </div>
          </div>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-all duration-150 cursor-pointer"
            onClick={onClose}
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2.5 animate-in fade-in shadow-xs">
              <span className="material-symbols-outlined text-[18px] text-red-600 shrink-0">
                error
              </span>
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">
              Priority Label <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={50}
              placeholder="e.g. Critical, High, Normal, Low"
              value={label}
              onChange={(e) => handleLabelChange(e.target.value)}
              className="w-full h-10 px-3.5 bg-[#F9FAFB] border border-[#D1D5DB] rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1F3864] focus:ring-2 focus:ring-[#1F3864]/15 focus:bg-white transition-all placeholder:text-gray-400 font-medium"
            />
          </div>

          {/* Color Setting Option */}
          <ColorPickerSection
            selectedColor={color}
            onChange={handleColorChange}
            previewLabel={label}
            previewType="priority"
            previewRank={sortOrder}
          />

          <div>
            <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">
              Sort Order (Rank) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min={0}
              max={999}
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className="w-full h-10 px-3.5 bg-[#F9FAFB] border border-[#D1D5DB] rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1F3864] focus:ring-2 focus:ring-[#1F3864]/15 focus:bg-white transition-all font-medium"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Lower numbers appear first (e.g. 1 = Highest / Critical).
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">
              Initial Status
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="ACTIVE"
                  checked={status === 'ACTIVE'}
                  onChange={() => setStatus('ACTIVE')}
                  className="accent-[#1F3864]"
                />
                <span>Active</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="INACTIVE"
                  checked={status === 'INACTIVE'}
                  onChange={() => setStatus('INACTIVE')}
                  className="accent-[#1F3864]"
                />
                <span>Archived / Inactive</span>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-[#EEF1F5] flex items-center justify-end gap-2.5">
            <button
              type="button"
              disabled={createPriorityMutation.isPending}
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#D1D5DB] text-gray-700 hover:bg-gray-50 font-bold text-xs transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createPriorityMutation.isPending}
              className="px-5 py-2 rounded-xl bg-[#1F3864] hover:bg-[#152747] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50 cursor-pointer active:scale-[0.98]"
            >
              {createPriorityMutation.isPending ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  <span>Create Priority</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
