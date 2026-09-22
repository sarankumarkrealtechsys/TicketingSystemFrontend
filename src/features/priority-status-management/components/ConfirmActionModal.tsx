import React from 'react';
import { createPortal } from 'react-dom';

interface ConfirmActionModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmVariant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel,
  confirmVariant = 'warning',
  isLoading = false,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  const getButtonStyles = () => {
    switch (confirmVariant) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 text-white';
      case 'primary':
      default:
        return 'bg-[#1F3864] hover:bg-[#152747] text-white';
    }
  };

  const getIcon = () => {
    switch (confirmVariant) {
      case 'danger':
        return { name: 'delete', bg: 'bg-red-100 text-red-600' };
      case 'warning':
        return { name: 'archive', bg: 'bg-amber-100 text-amber-700' };
      case 'primary':
      default:
        return { name: 'check_circle', bg: 'bg-blue-100 text-[#1F3864]' };
    }
  };

  const iconInfo = getIcon();

  return createPortal(
    <div
      className="fixed inset-0 top-0 left-0 right-0 bottom-0 !m-0 z-[110] flex items-center justify-center p-4 bg-[#0F1B2D]/50 backdrop-blur-[8px] transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-[0_25px_60px_-12px_rgba(0,0,0,0.4)] w-full max-w-sm mx-4 overflow-hidden border border-[#E2E8F0] p-6 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`w-12 h-12 rounded-2xl ${iconInfo.bg} flex items-center justify-center mb-3.5 shadow-xs`}
        >
          <span className="material-symbols-outlined text-[26px]">
            {iconInfo.name}
          </span>
        </div>

        <h3 className="font-bold text-base text-[#0F172A] mb-1.5">
          {title}
        </h3>

        <p className="text-xs text-gray-500 mb-6 leading-relaxed">
          {message}
        </p>

        <div className="flex items-center gap-2.5 w-full">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="flex-1 h-9 rounded-xl border border-[#D1D5DB] text-gray-700 hover:bg-gray-50 font-bold text-xs transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`flex-1 h-9 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-[0.98] ${getButtonStyles()} disabled:opacity-50`}
          >
            {isLoading ? (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span>{confirmLabel}</span>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
