import React, { useState, useMemo, useEffect } from 'react';
import { AppLayout } from '@/layout/AppLayout';
import {
  usePrioritiesQuery,
  useUpdatePriorityMutation,
  useRetirePriorityMutation,
  useTicketStatusesQuery,
  useUpdateTicketStatusMutation,
  useRetireTicketStatusMutation,
} from '../api';
import { PriorityLevelItem, TicketStatusItem, TicketStatusBehavior } from '../types';
import { CreatePriorityModal } from './CreatePriorityModal';
import { EditPriorityModal } from './EditPriorityModal';
import { CreateStatusModal } from './CreateStatusModal';
import { EditStatusModal } from './EditStatusModal';
import { ConfirmActionModal } from './ConfirmActionModal';
import {
  getPriorityColor,
  getStatusColor,
  getColorBadgeStyles,
} from '../colorRegistry';
import { Can } from '@/shared/components';
import { PERMISSIONS } from '@/features/auth';

const BEHAVIOR_BADGES: Record<
  TicketStatusBehavior,
  { label: string; bg: string; text: string; border: string; icon: string }
> = {
  OPEN: {
    label: 'Open',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: 'inbox',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: 'pending',
  },
  ON_HOLD: {
    label: 'On Hold',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    icon: 'pause_circle',
  },
  RESOLVED: {
    label: 'Resolved',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: 'check_circle',
  },
  CLOSED: {
    label: 'Closed',
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-300',
    icon: 'lock',
  },
};

export const AdminPriorityStatusManagement: React.FC = () => {

  // Queries
  const {
    data: priorities = [],
    isLoading: prioritiesLoading,
    isFetching: prioritiesFetching,
    refetch: refetchPriorities,
  } = usePrioritiesQuery({ includeInactive: true });

  const {
    data: statuses = [],
    isLoading: statusesLoading,
    isFetching: statusesFetching,
    refetch: refetchStatuses,
  } = useTicketStatusesQuery({ includeInactive: true, teamId: 'all' });

  // Mutations
  const updatePriorityMutation = useUpdatePriorityMutation();
  const retirePriorityMutation = useRetirePriorityMutation();
  const updateStatusMutation = useUpdateTicketStatusMutation();
  const retireStatusMutation = useRetireTicketStatusMutation();

  // Search & Filter state
  const [prioritySearch, setPrioritySearch] = useState('');
  const [statusSearch, setStatusSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modals state
  const [isCreatePriorityOpen, setIsCreatePriorityOpen] = useState(false);
  const [selectedPriorityForEdit, setSelectedPriorityForEdit] = useState<PriorityLevelItem | null>(null);

  const [isCreateStatusOpen, setIsCreateStatusOpen] = useState(false);
  const [selectedStatusForEdit, setSelectedStatusForEdit] = useState<TicketStatusItem | null>(null);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'archive-priority' | 'restore-priority' | 'archive-status' | 'restore-status';
    priority?: PriorityLevelItem | null;
    statusItem?: TicketStatusItem | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    type: 'archive-priority',
    priority: null,
    statusItem: null,
    isLoading: false,
  });

  // Bottom Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Reactive local lists for real-time live movement while dragging
  const [localPriorities, setLocalPriorities] = useState<PriorityLevelItem[]>([]);
  const [localStatuses, setLocalStatuses] = useState<TicketStatusItem[]>([]);

  const [draggedPriorityId, setDraggedPriorityId] = useState<number | null>(null);
  const [draggedStatusId, setDraggedStatusId] = useState<number | null>(null);

  const [isReorderingPriority, setIsReorderingPriority] = useState(false);
  const [isReorderingStatus, setIsReorderingStatus] = useState(false);

  // Filtered Priorities
  const filteredPriorities = useMemo(() => {
    return (priorities as PriorityLevelItem[])
      .filter((p: PriorityLevelItem) => {
        if (activeFilter !== 'ALL' && p.status !== activeFilter) return false;
        if (!prioritySearch.trim()) return true;
        return p.label.toLowerCase().includes(prioritySearch.toLowerCase());
      })
      .sort((a: PriorityLevelItem, b: PriorityLevelItem) => a.sortOrder - b.sortOrder || a.id - b.id);
  }, [priorities, activeFilter, prioritySearch]);

  // Filtered Statuses
  const filteredStatuses = useMemo(() => {
    return (statuses as TicketStatusItem[])
      .filter((s: TicketStatusItem) => {
        if (activeFilter !== 'ALL' && s.status !== activeFilter) return false;
        if (!statusSearch.trim()) return true;
        const q = statusSearch.toLowerCase();
        return (
          s.label.toLowerCase().includes(q) ||
          (s.description && s.description.toLowerCase().includes(q)) ||
          (s.team && s.team.name.toLowerCase().includes(q)) ||
          s.behavior.toLowerCase().includes(q)
        );
      })
      .sort((a: TicketStatusItem, b: TicketStatusItem) => a.sortOrder - b.sortOrder || a.id - b.id);
  }, [statuses, activeFilter, statusSearch]);

  // Sync local lists with query results when not actively dragging
  useEffect(() => {
    if (draggedPriorityId === null) {
      setLocalPriorities(filteredPriorities);
    }
  }, [filteredPriorities, draggedPriorityId]);

  useEffect(() => {
    if (draggedStatusId === null) {
      setLocalStatuses(filteredStatuses);
    }
  }, [filteredStatuses, draggedStatusId]);

  // Real-Time Priority Drag Handlers
  const handlePriorityDragStart = (e: React.DragEvent, id: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(id));
    setDraggedPriorityId(id);
  };

  const handlePriorityDragOver = (e: React.DragEvent, hoverId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (!draggedPriorityId || draggedPriorityId === hoverId) return;

    setLocalPriorities((prev) => {
      const fromIndex = prev.findIndex((p) => p.id === draggedPriorityId);
      const toIndex = prev.findIndex((p) => p.id === hoverId);

      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return prev;

      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const handlePriorityDragEnd = async () => {
    if (!draggedPriorityId) return;
    setDraggedPriorityId(null);

    const originalMap = new Map((priorities as PriorityLevelItem[]).map((p) => [p.id, p.sortOrder]));
    const updates = localPriorities
      .map((p, idx) => ({ id: p.id, newSortOrder: idx + 1, oldSortOrder: originalMap.get(p.id) ?? p.sortOrder }))
      .filter((u) => u.newSortOrder !== u.oldSortOrder);

    if (updates.length > 0) {
      setIsReorderingPriority(true);
      try {
        await Promise.all(
          updates.map((u) =>
            updatePriorityMutation.mutateAsync({
              id: u.id,
              data: { sortOrder: u.newSortOrder },
            })
          )
        );
        await refetchPriorities();
        showToast('Priority sort order updated.');
      } catch (err: any) {
        showToast(err?.response?.data?.message || err?.message || 'Failed to update priority order.');
        refetchPriorities();
      } finally {
        setIsReorderingPriority(false);
      }
    }
  };

  // Real-Time Status Drag Handlers
  const handleStatusDragStart = (e: React.DragEvent, id: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(id));
    setDraggedStatusId(id);
  };

  const handleStatusDragOver = (e: React.DragEvent, hoverId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (!draggedStatusId || draggedStatusId === hoverId) return;

    setLocalStatuses((prev) => {
      const fromIndex = prev.findIndex((s) => s.id === draggedStatusId);
      const toIndex = prev.findIndex((s) => s.id === hoverId);

      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return prev;

      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const handleStatusDragEnd = async () => {
    if (!draggedStatusId) return;
    setDraggedStatusId(null);

    const originalMap = new Map((statuses as TicketStatusItem[]).map((s) => [s.id, s.sortOrder]));
    const updates = localStatuses
      .map((s, idx) => ({ id: s.id, newSortOrder: idx + 1, oldSortOrder: originalMap.get(s.id) ?? s.sortOrder }))
      .filter((u) => u.newSortOrder !== u.oldSortOrder);

    if (updates.length > 0) {
      setIsReorderingStatus(true);
      try {
        await Promise.all(
          updates.map((u) =>
            updateStatusMutation.mutateAsync({
              id: u.id,
              data: { sortOrder: u.newSortOrder },
            })
          )
        );
        await refetchStatuses();
        showToast('Workflow status sort order updated.');
      } catch (err: any) {
        showToast(err?.response?.data?.message || err?.message || 'Failed to update status order.');
        refetchStatuses();
      } finally {
        setIsReorderingStatus(false);
      }
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    const priorityList = priorities as PriorityLevelItem[];
    const statusList = statuses as TicketStatusItem[];
    const activePriorities = priorityList.filter((p: PriorityLevelItem) => p.status === 'ACTIVE').length;
    const activeStatuses = statusList.filter((s: TicketStatusItem) => s.status === 'ACTIVE').length;
    const systemDefaults = statusList.filter((s: TicketStatusItem) => s.isDefault).length;
    return {
      totalPriorities: priorityList.length,
      activePriorities,
      totalStatuses: statusList.length,
      activeStatuses,
      systemDefaults,
    };
  }, [priorities, statuses]);

  // Refresh handler
  const handleRefresh = async () => {
    await Promise.all([refetchPriorities(), refetchStatuses()]);
    showToast('Priorities and workflow statuses refreshed.');
  };

  // Confirm Action Handler
  const handleConfirmAction = async () => {
    setConfirmModal((prev) => ({ ...prev, isLoading: true }));
    try {
      if (confirmModal.type === 'archive-priority' && confirmModal.priority) {
        await retirePriorityMutation.mutateAsync(confirmModal.priority.id);
        showToast(`Priority level "${confirmModal.priority.label}" archived successfully.`);
      } else if (confirmModal.type === 'restore-priority' && confirmModal.priority) {
        await updatePriorityMutation.mutateAsync({
          id: confirmModal.priority.id,
          data: { status: 'ACTIVE' },
        });
        showToast(`Priority level "${confirmModal.priority.label}" restored successfully.`);
      } else if (confirmModal.type === 'archive-status' && confirmModal.statusItem) {
        await retireStatusMutation.mutateAsync(confirmModal.statusItem.id);
        showToast(`Workflow status "${confirmModal.statusItem.label}" archived successfully.`);
      } else if (confirmModal.type === 'restore-status' && confirmModal.statusItem) {
        await updateStatusMutation.mutateAsync({
          id: confirmModal.statusItem.id,
          data: { status: 'ACTIVE' },
        });
        showToast(`Workflow status "${confirmModal.statusItem.label}" restored successfully.`);
      }

      setConfirmModal({
        isOpen: false,
        type: 'archive-priority',
        priority: null,
        statusItem: null,
        isLoading: false,
      });
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Operation failed.');
      setConfirmModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-5 w-full max-w-7xl mx-auto px-3 sm:px-6 py-5">
        {/* ========================================================================= */}
        {/* TOP HEADER */}
        {/* ========================================================================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
              Priorities & Statuses
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Manage ticket priority levels and workflow lifecycle stages
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* New Priority Button */}
            <Can permission={PERMISSIONS.PRIORITY_CREATE}>
              <button
                type="button"
                onClick={() => setIsCreatePriorityOpen(true)}
                className="h-9 px-3.5 bg-[#1F3864] hover:bg-[#152747] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs active:scale-[0.98] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[17px]">flag</span>
                <span>New Priority</span>
              </button>
            </Can>

            {/* New Status Button */}
            <Can permission={PERMISSIONS.STATUS_CREATE}>
              <button
                type="button"
                onClick={() => setIsCreateStatusOpen(true)}
                className="h-9 px-3.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs active:scale-[0.98] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[17px]">checklist</span>
                <span>New Status</span>
              </button>
            </Can>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={prioritiesFetching || statusesFetching}
              className="h-9 px-3 bg-white hover:bg-gray-50 border border-[#E2E8F0] text-[#1F3864] text-xs font-bold rounded-xl flex items-center gap-1 transition-all shadow-xs active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              title="Refresh master data"
            >
              <span
                className={`material-symbols-outlined text-[17px] ${
                  prioritiesFetching || statusesFetching ? 'animate-spin' : ''
                }`}
              >
                refresh
              </span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* QUICK STATS & GLOBAL FILTER BAR */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-[#E2E8F0] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5">
          {/* Quick Metrics */}
          <div className="flex items-center gap-4 flex-wrap text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#1F3864]">Priority Levels:</span>
              <span className="font-bold text-gray-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                {stats.activePriorities} Active / {stats.totalPriorities} Total
              </span>
            </div>
            <div className="h-4 w-px bg-gray-200 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#1F3864]">Workflow Statuses:</span>
              <span className="font-bold text-gray-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                {stats.activeStatuses} Active / {stats.totalStatuses} Total
              </span>
              <span className="font-extrabold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-md text-[10px] uppercase">
                {stats.systemDefaults} System Defaults
              </span>
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-1 bg-[#F1F5F9] rounded-lg text-[11px] font-bold shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveFilter('ALL')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                activeFilter === 'ALL'
                  ? 'bg-white text-[#1F3864] shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('ACTIVE')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                activeFilter === 'ACTIVE'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('INACTIVE')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                activeFilter === 'INACTIVE'
                  ? 'bg-white text-amber-800 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Archived
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* VERTICAL SPLIT: TWO EQUAL HALVES */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          {/* ──────────────────────────────────────────────────────────────────────── */}
          {/* LEFT HALF: PRIORITY LEVELS MANAGEMENT */}
          {/* ──────────────────────────────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-xs border border-[#E2E8F0] overflow-hidden flex flex-col">
            {/* Column Header */}
            <div className="p-4 bg-gradient-to-r from-[#F8FAFC] to-[#F1F5F9] border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#1F3864] text-white flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">flag</span>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#0F172A]">
                    Priority Levels
                  </h2>
                  <p className="text-[11px] text-gray-500">
                    Global hierarchy for ticket urgency & SLA
                  </p>
                </div>
              </div>

              {/* Search Bar for Priorities */}
              <div className="relative w-full sm:w-44">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[15px]">
                  search
                </span>
                <input
                  type="text"
                  value={prioritySearch}
                  onChange={(e) => setPrioritySearch(e.target.value)}
                  placeholder="Search priorities..."
                  className="w-full h-7.5 pl-8 pr-2.5 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] placeholder:text-gray-400 focus:outline-none focus:border-[#1F3864] transition-all"
                />
              </div>
            </div>

            {/* Table / List Header */}
            <div className="grid grid-cols-12 px-4 py-2.5 bg-[#F8FAFC] text-gray-600 text-[11px] font-bold uppercase tracking-wider border-b border-[#E2E8F0]">
              <div className="col-span-3 flex items-center gap-1">
                <span>Rank</span>
                <span className="text-[9px] font-normal text-gray-400 lowercase">(drag to sort)</span>
              </div>
              <div className="col-span-4">Priority Label</div>
              <div className="col-span-2 text-center">Status</div>
              <div className="col-span-3 text-right">Actions</div>
            </div>

            {/* Priorities List */}
            <div className="divide-y divide-[#F1F5F9] min-h-[320px]">
              {prioritiesLoading || isReorderingPriority ? (
                <div className="py-16 flex flex-col items-center justify-center gap-2 text-gray-400">
                  <div className="w-5 h-5 border-2 border-[#1F3864]/20 border-t-[#1F3864] rounded-full animate-spin" />
                  <span className="text-xs font-semibold">
                    {isReorderingPriority ? 'Updating priority order...' : 'Loading priorities...'}
                  </span>
                </div>
              ) : localPriorities.length === 0 ? (
                <div className="py-16 text-center text-xs text-gray-400">
                  No priority levels match your criteria.
                </div>
              ) : (
                localPriorities.map((priority: PriorityLevelItem, index: number) => {
                  const isArchived = priority.status === 'INACTIVE';
                  const pColor = getPriorityColor(priority.id, priority.label);
                  const isBeingDragged = priority.id === draggedPriorityId;

                  return (
                    <div
                      key={priority.id}
                      draggable={true}
                      onDragStart={(e) => handlePriorityDragStart(e, priority.id)}
                      onDragOver={(e) => handlePriorityDragOver(e, priority.id)}
                      onDragEnd={handlePriorityDragEnd}
                      className={`grid grid-cols-12 px-4 py-3 items-center transition-all duration-200 select-none cursor-grab active:cursor-grabbing ${
                        isBeingDragged
                          ? 'bg-blue-50/90 border-2 border-dashed border-[#1F3864] shadow-lg ring-2 ring-[#1F3864]/20 scale-[1.01] z-20'
                          : isArchived
                          ? 'bg-amber-50/30 hover:bg-amber-50/50'
                          : 'bg-white hover:bg-[#F8FAFC]'
                      }`}
                    >
                      {/* Sort Order Rank Pill with Drag Handle & Live Rank */}
                      <div className="col-span-3 flex items-center gap-2">
                        <span
                          className={`material-symbols-outlined text-[18px] transition-colors shrink-0 ${
                            isBeingDragged ? 'text-[#1F3864] font-bold' : 'text-gray-400 hover:text-[#1F3864]'
                          }`}
                          title="Drag up or down to reorder"
                        >
                          drag_indicator
                        </span>
                        <span
                          className="w-6 h-6 rounded-lg text-white font-extrabold text-xs flex items-center justify-center shadow-2xs shrink-0 select-none"
                          style={{ backgroundColor: pColor }}
                        >
                          {index + 1}
                        </span>
                        {isBeingDragged && (
                          <span className="text-[10px] font-extrabold text-[#1F3864] bg-white px-2 py-0.5 rounded-full border border-blue-200 shadow-2xs animate-pulse">
                            Drop #{index + 1}
                          </span>
                        )}
                      </div>

                      {/* Label with Color Dot */}
                      <div className="col-span-4 flex flex-col pr-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                            style={{ backgroundColor: pColor }}
                          />
                          <span className="font-bold text-xs text-[#0F172A]">
                            {priority.label}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400 pl-4.5">
                          ID #{priority.id}
                        </span>
                      </div>

                      {/* Status Badge */}
                      <div className="col-span-2 flex justify-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            isArchived
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isArchived ? 'Archived' : 'Active'}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="col-span-3 flex items-center justify-end gap-1.5">
                        <Can permission={PERMISSIONS.PRIORITY_UPDATE}>
                          <button
                            type="button"
                            onClick={() => setSelectedPriorityForEdit(priority)}
                            className="p-1 rounded-lg text-gray-500 hover:text-[#1F3864] hover:bg-gray-100 transition-all cursor-pointer"
                            title="Edit Priority"
                          >
                            <span className="material-symbols-outlined text-[17px]">edit</span>
                          </button>
                        </Can>

                        <Can permission={PERMISSIONS.PRIORITY_RETIRE}>
                          {isArchived ? (
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmModal({
                                  isOpen: true,
                                  type: 'restore-priority',
                                  priority,
                                  statusItem: null,
                                  isLoading: false,
                                })
                              }
                              className="p-1 rounded-lg text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition-all cursor-pointer"
                              title="Restore Priority"
                            >
                              <span className="material-symbols-outlined text-[17px]">unarchive</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmModal({
                                  isOpen: true,
                                  type: 'archive-priority',
                                  priority,
                                  statusItem: null,
                                  isLoading: false,
                                })
                              }
                              className="p-1 rounded-lg text-amber-600 hover:text-amber-800 hover:bg-amber-50 transition-all cursor-pointer"
                              title="Archive Priority"
                            >
                              <span className="material-symbols-outlined text-[17px]">archive</span>
                            </button>
                          )}
                        </Can>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ──────────────────────────────────────────────────────────────────────── */}
          {/* RIGHT HALF: TICKET STATUSES MANAGEMENT */}
          {/* ──────────────────────────────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-xs border border-[#E2E8F0] overflow-hidden flex flex-col">
            {/* Column Header */}
            <div className="p-4 bg-gradient-to-r from-[#F8FAFC] to-[#F1F5F9] border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">checklist</span>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#0F172A]">
                    Workflow Statuses
                  </h2>
                  <p className="text-[11px] text-gray-500">
                    Lifecycle states with semantic behavior
                  </p>
                </div>
              </div>

              {/* Search Bar for Statuses */}
              <div className="relative w-full sm:w-44">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[15px]">
                  search
                </span>
                <input
                  type="text"
                  value={statusSearch}
                  onChange={(e) => setStatusSearch(e.target.value)}
                  placeholder="Search statuses..."
                  className="w-full h-7.5 pl-8 pr-2.5 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] placeholder:text-gray-400 focus:outline-none focus:border-[#1F3864] transition-all"
                />
              </div>
            </div>

            {/* Table / List Header */}
            <div className="grid grid-cols-12 px-4 py-2.5 bg-[#F8FAFC] text-gray-600 text-[11px] font-bold uppercase tracking-wider border-b border-[#E2E8F0]">
              <div className="col-span-3 flex items-center gap-1">
                <span>Rank</span>
                <span className="text-[9px] font-normal text-gray-400 lowercase">(drag to sort)</span>
              </div>
              <div className="col-span-4">Status & Behavior</div>
              <div className="col-span-2 text-center">Scope</div>
              <div className="col-span-3 text-right">Actions</div>
            </div>

            {/* Statuses List */}
            <div className="divide-y divide-[#F1F5F9] min-h-[320px]">
              {statusesLoading || isReorderingStatus ? (
                <div className="py-16 flex flex-col items-center justify-center gap-2 text-gray-400">
                  <div className="w-5 h-5 border-2 border-emerald-700/20 border-t-emerald-700 rounded-full animate-spin" />
                  <span className="text-xs font-semibold">
                    {isReorderingStatus ? 'Updating status order...' : 'Loading statuses...'}
                  </span>
                </div>
              ) : localStatuses.length === 0 ? (
                <div className="py-16 text-center text-xs text-gray-400">
                  No workflow statuses match your criteria.
                </div>
              ) : (
                localStatuses.map((statusItem: TicketStatusItem, index: number) => {
                  const isArchived = statusItem.status === 'INACTIVE';
                  const badge = BEHAVIOR_BADGES[statusItem.behavior] || BEHAVIOR_BADGES.OPEN;
                  const sColor = getStatusColor(statusItem.id, statusItem.behavior, statusItem.label);
                  const sBadgeStyle = getColorBadgeStyles(sColor);
                  const isBeingDragged = statusItem.id === draggedStatusId;

                  return (
                    <div
                      key={statusItem.id}
                      draggable={true}
                      onDragStart={(e) => handleStatusDragStart(e, statusItem.id)}
                      onDragOver={(e) => handleStatusDragOver(e, statusItem.id)}
                      onDragEnd={handleStatusDragEnd}
                      className={`grid grid-cols-12 px-4 py-3 items-center transition-all duration-200 select-none cursor-grab active:cursor-grabbing ${
                        isBeingDragged
                          ? 'bg-emerald-50/90 border-2 border-dashed border-emerald-700 shadow-lg ring-2 ring-emerald-700/20 scale-[1.01] z-20'
                          : isArchived
                          ? 'bg-amber-50/30 hover:bg-amber-50/50'
                          : 'bg-white hover:bg-[#F8FAFC]'
                      }`}
                    >
                      {/* Sort Order Rank Pill with Drag Handle & Live Rank */}
                      <div className="col-span-3 flex items-center gap-2">
                        <span
                          className={`material-symbols-outlined text-[18px] transition-colors shrink-0 ${
                            isBeingDragged ? 'text-emerald-700 font-bold' : 'text-gray-400 hover:text-emerald-700'
                          }`}
                          title="Drag up or down to reorder"
                        >
                          drag_indicator
                        </span>
                        <span
                          className="w-6 h-6 rounded-lg text-white font-extrabold text-xs flex items-center justify-center shadow-2xs shrink-0 select-none"
                          style={{ backgroundColor: sColor }}
                        >
                          {index + 1}
                        </span>
                        {isBeingDragged && (
                          <span className="text-[10px] font-extrabold text-emerald-800 bg-white px-2 py-0.5 rounded-full border border-emerald-200 shadow-2xs animate-pulse">
                            Drop #{index + 1}
                          </span>
                        )}
                      </div>

                      {/* Label + Behavior Pill */}
                      <div className="col-span-4 flex flex-col pr-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-[#0F172A]">
                            {statusItem.label}
                          </span>
                          {statusItem.isDefault && (
                            <span
                              className="inline-flex items-center text-[9px] font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded"
                              title="System default seeded status"
                            >
                              Default
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border shadow-2xs"
                            style={sBadgeStyle}
                          >
                            <span className="material-symbols-outlined text-[12px]">
                              {badge.icon}
                            </span>
                            <span>{statusItem.label} ({badge.label})</span>
                          </span>
                        </div>
                      </div>

                      {/* Scope Badge */}
                      <div className="col-span-2 flex justify-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            statusItem.team
                              ? 'bg-purple-50 text-purple-800 border border-purple-200'
                              : 'bg-gray-100 text-gray-700 border border-gray-200'
                          }`}
                        >
                          {statusItem.team ? statusItem.team.name : 'Global'}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="col-span-3 flex items-center justify-end gap-1.5">
                        <Can permission={PERMISSIONS.STATUS_UPDATE}>
                          <button
                            type="button"
                            onClick={() => setSelectedStatusForEdit(statusItem)}
                            className="p-1 rounded-lg text-gray-500 hover:text-[#1F3864] hover:bg-gray-100 transition-all cursor-pointer"
                            title="Edit Status"
                          >
                            <span className="material-symbols-outlined text-[17px]">edit</span>
                          </button>
                        </Can>

                        <Can permission={PERMISSIONS.STATUS_RETIRE}>
                          {isArchived ? (
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmModal({
                                  isOpen: true,
                                  type: 'restore-status',
                                  priority: null,
                                  statusItem,
                                  isLoading: false,
                                })
                              }
                              className="p-1 rounded-lg text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition-all cursor-pointer"
                              title="Restore Status"
                            >
                              <span className="material-symbols-outlined text-[17px]">unarchive</span>
                            </button>
                          ) : statusItem.isDefault ? (
                            <span
                              className="p-1 text-gray-300 cursor-not-allowed"
                              title="System default status cannot be archived"
                            >
                              <span className="material-symbols-outlined text-[17px]">lock</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmModal({
                                  isOpen: true,
                                  type: 'archive-status',
                                  priority: null,
                                  statusItem,
                                  isLoading: false,
                                })
                              }
                              className="p-1 rounded-lg text-amber-600 hover:text-amber-800 hover:bg-amber-50 transition-all cursor-pointer"
                              title="Archive Status"
                            >
                              <span className="material-symbols-outlined text-[17px]">archive</span>
                            </button>
                          )}
                        </Can>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}
      <CreatePriorityModal
        isOpen={isCreatePriorityOpen}
        onClose={() => setIsCreatePriorityOpen(false)}
        onSuccess={showToast}
        existingCount={priorities.length}
      />

      <EditPriorityModal
        isOpen={Boolean(selectedPriorityForEdit)}
        priority={selectedPriorityForEdit}
        onClose={() => setSelectedPriorityForEdit(null)}
        onSuccess={showToast}
      />

      <CreateStatusModal
        isOpen={isCreateStatusOpen}
        onClose={() => setIsCreateStatusOpen(false)}
        onSuccess={showToast}
        existingCount={statuses.length}
      />

      <EditStatusModal
        isOpen={Boolean(selectedStatusForEdit)}
        statusItem={selectedStatusForEdit}
        onClose={() => setSelectedStatusForEdit(null)}
        onSuccess={showToast}
      />

      <ConfirmActionModal
        isOpen={confirmModal.isOpen}
        title={
          confirmModal.type === 'archive-priority'
            ? 'Archive Priority Level'
            : confirmModal.type === 'restore-priority'
            ? 'Restore Priority Level'
            : confirmModal.type === 'archive-status'
            ? 'Archive Workflow Status'
            : 'Restore Workflow Status'
        }
        message={
          confirmModal.type === 'archive-priority'
            ? `Are you sure you want to archive priority level "${confirmModal.priority?.label}"? It will no longer appear for newly created tickets.`
            : confirmModal.type === 'restore-priority'
            ? `Restore priority level "${confirmModal.priority?.label}" to active status?`
            : confirmModal.type === 'archive-status'
            ? `Are you sure you want to archive workflow status "${confirmModal.statusItem?.label}"?`
            : `Restore workflow status "${confirmModal.statusItem?.label}" to active status?`
        }
        confirmLabel={
          confirmModal.type.startsWith('restore') ? 'Restore' : 'Archive'
        }
        confirmVariant={
          confirmModal.type.startsWith('restore') ? 'primary' : 'warning'
        }
        isLoading={confirmModal.isLoading}
        onConfirm={handleConfirmAction}
        onClose={() =>
          setConfirmModal({
            isOpen: false,
            type: 'archive-priority',
            priority: null,
            statusItem: null,
            isLoading: false,
          })
        }
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1F3864] text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 animate-in slide-in-from-bottom duration-200">
          <span className="material-symbols-outlined text-[20px] text-emerald-400">
            check_circle
          </span>
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}
    </AppLayout>
  );
};

export default AdminPriorityStatusManagement;
