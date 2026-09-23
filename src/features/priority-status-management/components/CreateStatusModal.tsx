import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { TicketStatusBehavior, MasterDataStatus } from '../types';
import { useCreateTicketStatusMutation } from '../api';
import { useTeamsQuery } from '@/features/team-management';
import { SelectDropdown, SelectOption } from '@/shared/components';
import { ColorPickerSection } from './ColorPickerSection';
import { setStatusColor, getStatusColor } from '../colorRegistry';

interface CreateStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (msg: string) => void;
  existingCount?: number;
  defaultTeamId?: string;
}

const LIFECYCLE_STAGES: {
  value: TicketStatusBehavior;
  label: string;
  desc: string;
  dotColor: string;
}[] = [
  {
    value: 'OPEN',
    label: 'Open (Intake)',
    desc: 'Tickets newly created or awaiting review',
    dotColor: 'bg-[#1E88E5]',
  },
  {
    value: 'IN_PROGRESS',
    label: 'In Progress (Active)',
    desc: 'Actively being diagnosed or worked on',
    dotColor: 'bg-[#FB8C00]',
  },
  {
    value: 'ON_HOLD',
    label: 'On Hold (Blocked / Waiting)',
    desc: 'Waiting on external input, customer, or vendor',
    dotColor: 'bg-[#8E24AA]',
  },
  {
    value: 'RESOLVED',
    label: 'Resolved (Completed)',
    desc: 'Fix deployed, awaiting customer or tech sign-off',
    dotColor: 'bg-[#43A047]',
  },
  {
    value: 'CLOSED',
    label: 'Closed (Archived)',
    desc: 'Ticket completed and sealed in archives',
    dotColor: 'bg-[#747780]',
  },
];

export const CreateStatusModal: React.FC<CreateStatusModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  existingCount = 0,
  defaultTeamId = 'global',
}) => {
  const [label, setLabel] = useState('');
  const [behavior, setBehavior] = useState<TicketStatusBehavior>('IN_PROGRESS');
  const [color, setColor] = useState<string>('#F59E0B');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState<number>(existingCount + 1);
  const [selectedTeamId, setSelectedTeamId] = useState<string>(
    defaultTeamId && defaultTeamId !== 'ALL' ? String(defaultTeamId) : 'global'
  );
  const [status, setStatus] = useState<MasterDataStatus>('ACTIVE');
  const [errorMessage, setErrorMessage] = useState('');

  const { data: teams = [] } = useTeamsQuery({ includeInactive: false });
  const createStatusMutation = useCreateTicketStatusMutation();

  if (!isOpen) return null;

  const teamOptions: SelectOption<string>[] = [
    { value: 'global', label: 'Global (Available to all teams)', dotColor: 'bg-[#1F3864]' },
    ...teams.map((t) => ({
      value: String(t.id),
      label: `Team: ${t.name}`,
      sublabel: t.department?.name,
      dotColor: 'bg-blue-500',
    })),
  ];

  const handleBehaviorChange = (val: TicketStatusBehavior) => {
    setBehavior(val);
    setColor(getStatusColor(null, val, label));
  };

  const handleLabelChange = (newLabel: string) => {
    setLabel(newLabel);
    setColor(getStatusColor(null, behavior, newLabel));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!label.trim()) {
      setErrorMessage('Status label is required.');
      return;
    }

    try {
      const created = await createStatusMutation.mutateAsync({
        label: label.trim(),
        behavior,
        description: description.trim() || undefined,
        sortOrder: Number(sortOrder) || 0,
        teamId: selectedTeamId === 'global' ? null : Number(selectedTeamId),
        status,
      });

      // Save custom color keyed by both ID and label
      setStatusColor(created.id, color, created.label);

      setLabel('');
      setDescription('');
      setBehavior('IN_PROGRESS');
      setColor('#F59E0B');
      setSortOrder(existingCount + 2);
      setSelectedTeamId('global');
      setStatus('ACTIVE');

      onSuccess?.(`Workflow status "${created.label}" created successfully.`);
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to create workflow status.';
      setErrorMessage(msg);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 top-0 left-0 right-0 bottom-0 !m-0 z-[100] flex items-center justify-center p-4 bg-[#0F1B2D]/50 backdrop-blur-[8px] transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-[0_25px_60px_-12px_rgba(0,0,0,0.4)] w-full max-w-lg mx-4 overflow-hidden border border-[#E2E8F0] flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient Header Accent */}
        <div className="h-1.5 bg-gradient-to-r from-[#1F3864] via-[#2B5EA7] to-[#0e61a1]" />

        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-b from-[#FAFBFD] to-white border-b border-[#EEF1F5] flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1F3864] to-[#2B5EA7] text-white flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-[20px]">checklist</span>
            </div>
            <div>
              <h3 className="font-bold text-base text-[#1A1A1A] leading-tight tracking-tight">
                New Workflow Status
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Add a global or team-specific lifecycle stage
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
              Status Label <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={60}
              placeholder="e.g. Under Engineering Review"
              value={label}
              onChange={(e) => handleLabelChange(e.target.value)}
              className="w-full h-10 px-3.5 bg-[#F9FAFB] border border-[#D1D5DB] rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1F3864] focus:ring-2 focus:ring-[#1F3864]/15 focus:bg-white transition-all font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">
                Lifecycle Behavior <span className="text-red-500">*</span>
              </label>
              <SelectDropdown<TicketStatusBehavior>
                value={behavior}
                onChange={handleBehaviorChange}
                options={LIFECYCLE_STAGES.map((s) => ({
                  value: s.value,
                  label: s.label,
                  sublabel: s.desc,
                  dotColor: s.dotColor,
                }))}
                size="sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">
                Scope / Team Assignment
              </label>
              <SelectDropdown<string>
                value={selectedTeamId}
                onChange={(val) => setSelectedTeamId(val)}
                options={teamOptions}
                size="sm"
              />
            </div>
          </div>

          {/* Color Setting Option */}
          <ColorPickerSection
            selectedColor={color}
            onChange={setColor}
            previewLabel={label}
            previewType="status"
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
          </div>

          <div>
            <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context on when tickets should enter this status..."
              className="w-full p-3 bg-[#F9FAFB] border border-[#D1D5DB] rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1F3864] focus:ring-2 focus:ring-[#1F3864]/15 focus:bg-white transition-all placeholder:text-gray-400 resize-none font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">
              Initial Status
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="status-mode"
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
                  name="status-mode"
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
              disabled={createStatusMutation.isPending}
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#D1D5DB] text-gray-700 hover:bg-gray-50 font-bold text-xs transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createStatusMutation.isPending}
              className="px-5 py-2 rounded-xl bg-[#1F3864] hover:bg-[#152747] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50 cursor-pointer active:scale-[0.98]"
            >
              {createStatusMutation.isPending ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  <span>Create Status</span>
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
