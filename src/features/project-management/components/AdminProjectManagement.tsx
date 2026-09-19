import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AppLayout } from '@/layout/AppLayout';
import { useProjectsQuery, useUpdateProjectMutation, useRetireProjectMutation, useDeleteProjectPermanentMutation } from '../api';
import { ProjectItem } from '../types';
import CreateProjectModal from './CreateProjectModal';
import EditProjectModal from './EditProjectModal';

export const AdminProjectManagement: React.FC = () => {
  const { data: projects = [], isLoading, isError, refetch, isFetching } = useProjectsQuery({ includeInactive: true });
  const updateMutation = useUpdateProjectMutation();
  const retireMutation = useRetireProjectMutation();
  const deletePermanentMutation = useDeleteProjectPermanentMutation();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  
  // Bottom Toast Notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);

  // Archive / Unarchive / Permanent Delete Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'archive' | 'unarchive' | 'delete';
    project: ProjectItem | null;
    isLoading: boolean;
    error: string | null;
  }>({
    isOpen: false,
    type: 'archive',
    project: null,
    isLoading: false,
    error: null,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Compute KPI metrics
  const totalProjects = projects.length;
  const activeProjects = useMemo(() => projects.filter(p => p.status === 'ACTIVE').length, [projects]);
  const archivedProjects = useMemo(() => projects.filter(p => p.status === 'INACTIVE').length, [projects]);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesSearch = 
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = 
        statusFilter === 'ALL' || project.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [projects, searchQuery, statusFilter]);

  const openConfirmModal = (project: ProjectItem, type: 'archive' | 'unarchive' | 'delete') => {
    setConfirmModal({
      isOpen: true,
      type,
      project,
      isLoading: false,
      error: null,
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmModal.project) return;
    setConfirmModal((prev) => ({ ...prev, isLoading: true, error: null }));
    const targetProject = confirmModal.project;

    try {
      if (confirmModal.type === 'delete') {
        await deletePermanentMutation.mutateAsync(targetProject.id);
        showToast(`Project "${targetProject.name}" permanently deleted successfully.`);
      } else if (confirmModal.type === 'unarchive') {
        await updateMutation.mutateAsync({
          id: targetProject.id,
          data: { status: 'ACTIVE' },
        });
        showToast(`Project "${targetProject.name}" restored and activated successfully.`);
      } else {
        await retireMutation.mutateAsync(targetProject.id);
        showToast(`Project "${targetProject.name}" archived successfully.`);
      }

      setConfirmModal({
        isOpen: false,
        type: 'archive',
        project: null,
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      setConfirmModal((prev) => ({
        ...prev,
        isLoading: false,
        error: err?.response?.data?.message || err?.message || `Failed to ${confirmModal.type} project.`,
      }));
    }
  };

  return (
    <AppLayout role="ADMIN" onSearch={(q) => setSearchQuery(q)}>
      <div className="space-y-6">
        {/* Bottom Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-[120] flex items-center gap-2 px-4 py-2.5 bg-[#1F3864] text-white rounded-lg shadow-xl text-xs font-semibold animate-in slide-in-from-bottom">
            <span className="material-symbols-outlined text-emerald-400 text-[18px]">
              check_circle
            </span>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-1">
              <span>Home</span>
              <span className="material-symbols-outlined text-[14px]">
                chevron_right
              </span>
              <span>Management</span>
              <span className="material-symbols-outlined text-[14px]">
                chevron_right
              </span>
              <span className="text-[#1F3864] dark:text-blue-400 font-semibold">
                Projects
              </span>
            </div>
            <h1 className="text-2xl font-bold text-[#1A1A1A] dark:text-white tracking-tight">
              Projects Management
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 bg-[#1F3864] hover:bg-[#152747] active:scale-[0.98] text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-2 shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">
              add
            </span>
            <span>New Project</span>
          </button>
        </div>

        {/* TOP ROW: 3 Quick KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* Active Projects Card */}
          <div className="p-4 sm:p-5 bg-white dark:bg-[#121E30] rounded-xl shadow-xs border border-[#E5E7EB] dark:border-[#1E2D45] flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Active Projects
              </span>
              <span className="text-2xl font-bold text-[#1F3864] dark:text-white mt-0.5">
                {activeProjects}
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <span className="material-symbols-outlined text-[24px]">check_circle</span>
            </div>
          </div>

          {/* Total Projects Card */}
          <div className="p-4 sm:p-5 bg-white dark:bg-[#121E30] rounded-xl shadow-xs border border-[#E5E7EB] dark:border-[#1E2D45] flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Total Projects
              </span>
              <span className="text-2xl font-bold text-[#1F3864] dark:text-white mt-0.5">
                {totalProjects}
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-[#1F3864]/5 dark:bg-blue-900/30 flex items-center justify-center text-[#1F3864] dark:text-blue-300">
              <span className="material-symbols-outlined text-[24px]">folder_managed</span>
            </div>
          </div>

          {/* Archived Projects Card */}
          <div className="p-4 sm:p-5 bg-white dark:bg-[#121E30] rounded-xl shadow-xs border border-[#E5E7EB] dark:border-[#1E2D45] flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Archived Projects
              </span>
              <span className="text-2xl font-bold text-gray-600 dark:text-gray-300 mt-0.5">
                {archivedProjects}
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <span className="material-symbols-outlined text-[24px]">archive</span>
            </div>
          </div>
        </div>


        {/* PROJECTS SECTION */}
        <div className="bg-white dark:bg-[#121E30] rounded-xl shadow-xs border border-[#E5E7EB] dark:border-[#1E2D45] overflow-hidden flex flex-col">
          {/* Table Toolbar */}
          <div className="p-4 flex flex-col gap-3 bg-white dark:bg-[#121E30] border-b border-[#F0F2F5] dark:border-[#1E2D45]">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
              <div className="relative w-full sm:w-80">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
                  search
                </span>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search projects by name or description..."
                  className="w-full h-9 pl-9 pr-3 bg-[#F9FAFB] dark:bg-[#1A283E] border border-[#D1D5DB] dark:border-[#283A55] rounded-lg text-xs text-[#1A1A1A] dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#0e61a1] transition-all"
                />
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
                    statusFilter === 'ALL'
                      ? 'bg-[#1F3864] text-white'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                  }`}
                >
                  All ({totalProjects})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('ACTIVE')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
                    statusFilter === 'ACTIVE'
                      ? 'bg-[#1F3864] text-white'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Active ({activeProjects})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('INACTIVE')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
                    statusFilter === 'INACTIVE'
                      ? 'bg-[#1F3864] text-white'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Archived ({archivedProjects})
                </button>
              </div>
            </div>

            {/* Next Line: Medium Navy Blue Refresh Button */}
            <div className="pt-2 flex justify-end border-t border-gray-100 dark:border-[#1E2D45]/60 w-full">
              <button
                type="button"
                onClick={() => {
                  refetch();
                  showToast("Refreshed projects list!");
                }}
                className="h-8 px-3.5 bg-[#2B4C7E] hover:bg-[#1F3864] text-white rounded-lg text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 shrink-0 active:scale-[0.98] cursor-pointer"
                title="Refresh Projects List"
              >
                <span className={`material-symbols-outlined text-[16px] ${isFetching ? "animate-spin" : ""}`}>
                  refresh
                </span>
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Projects Table & Mobile Cards */}
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-xs text-gray-500 gap-2">
              <span className="w-6 h-6 border-2 border-[#1F3864] border-t-transparent rounded-full animate-spin" />
              Loading projects...
            </div>
          ) : isError ? (
            <div className="py-12 text-center text-xs text-red-500 font-medium">
              Failed to load projects.
              <button
                type="button"
                onClick={() => refetch()}
                className="ml-2 underline text-[#1F3864] dark:text-blue-400 font-semibold"
              >
                Retry
              </button>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="py-16 text-center text-xs text-gray-500 dark:text-gray-400">
              <span className="material-symbols-outlined text-[36px] text-gray-300 dark:text-gray-600 block mb-1">
                folder_open
              </span>
              No projects found matching your criteria.
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE (Visible on md and above) */}
              <div className="hidden md:block overflow-x-auto w-full">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#FAFBFD] dark:bg-[#162234] border-b border-[#F0F2F5] dark:border-[#1E2D45] text-gray-500 dark:text-gray-400 font-semibold text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-4 sm:px-6 w-[30%] min-w-[200px]">
                        Project Name
                      </th>
                      <th className="py-3 px-4 sm:px-6 w-[35%] min-w-[220px]">
                        Description
                      </th>
                      <th className="py-3 px-4 sm:px-6 w-[12%] min-w-[100px] text-center">
                        Tickets
                      </th>
                      <th className="py-3 px-4 sm:px-6 w-[12%] min-w-[100px]">
                        Status
                      </th>
                      <th className="py-3 px-4 sm:px-6 w-[11%] min-w-[100px] text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F2F5] dark:divide-[#1E2D45] text-xs">
                    {filteredProjects.map((project) => {
                      const isActive = project.status === 'ACTIVE';
                      const ticketsCount = project._count?.tickets ?? 0;

                      return (
                        <tr 
                          key={project.id} 
                          className="hover:bg-gray-50/70 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          {/* Name */}
                          <td className="py-3.5 px-4 sm:px-6 font-bold text-sm text-[#1A1A1A] dark:text-white">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1F3864] to-[#2B5EA7] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                                {project.name.substring(0, 2).toUpperCase()}
                              </div>
                              <span className="truncate" title={project.name}>
                                {project.name}
                              </span>
                            </div>
                          </td>

                          {/* Description */}
                          <td className="py-3.5 px-4 sm:px-6 text-gray-500 dark:text-gray-400">
                            <span className="line-clamp-1" title={project.description || '—'}>
                              {project.description || '—'}
                            </span>
                          </td>

                          {/* Tickets */}
                          <td className="py-3.5 px-4 sm:px-6 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-900/30 text-[#0e61a1] dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                              <span className="material-symbols-outlined text-[13px]">
                                confirmation_number
                              </span>
                              {ticketsCount} {ticketsCount === 1 ? 'ticket' : 'tickets'}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 sm:px-6">
                            {isActive ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-slate-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                Archived
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 sm:px-6 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setEditingProject(project)}
                                className="p-1.5 text-gray-500 hover:text-[#1F3864] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                title="Edit project"
                              >
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => openConfirmModal(project, isActive ? 'archive' : 'unarchive')}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  isActive
                                    ? "text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                                    : "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                }`}
                                title={isActive ? "Archive project" : "Restore project"}
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  {isActive ? "archive" : "unarchive"}
                                </span>
                              </button>
                              {!isActive && (
                                <button
                                  type="button"
                                  onClick={() => openConfirmModal(project, 'delete')}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                                  title="Permanently Delete project"
                                >
                                  <span className="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* MOBILE SEPARATE CARDS (Visible on mobile < md) */}
              <div className="block md:hidden p-3 space-y-3 bg-[#F9FAFB]/40 dark:bg-slate-900/40">
                {filteredProjects.map((project) => {
                  const isActive = project.status === 'ACTIVE';
                  const ticketsCount = project._count?.tickets ?? 0;

                  return (
                    <div
                      key={project.id}
                      className="bg-white dark:bg-[#121E30] rounded-xl p-3.5 border border-[#E5E7EB] dark:border-[#1E2D45] shadow-xs flex flex-col space-y-3"
                    >
                      {/* Card Header: Icon Badge, Name, Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#1F3864] to-[#2B5EA7] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                            {project.name.substring(0, 2).toUpperCase()}
                          </span>
                          <div>
                            <h3 className="font-semibold text-sm text-[#1A1A1A] dark:text-white leading-tight">
                              {project.name}
                            </h3>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                              {project.description || 'System Project'}
                            </p>
                          </div>
                        </div>

                        <div>
                          {isActive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold text-[10px] border border-emerald-100 dark:border-emerald-900 shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span>Active</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 font-semibold text-[10px] border border-gray-200 dark:border-slate-700 shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                              <span>Archived</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Metadata Grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-gray-100 dark:border-slate-800">
                        <div>
                          <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                            Associated Tickets
                          </span>
                          <span className="font-semibold text-[#0e61a1] dark:text-blue-300">
                            {ticketsCount} {ticketsCount === 1 ? 'ticket' : 'tickets'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                            Created Date
                          </span>
                          <span className="font-medium text-gray-600 dark:text-gray-300">
                            {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : '—'}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons Footer */}
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => setEditingProject(project)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openConfirmModal(project, isActive ? 'archive' : 'unarchive')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                            isActive
                              ? "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40"
                              : "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {isActive ? "archive" : "unarchive"}
                          </span>
                          <span>{isActive ? "Archive" : "Restore"}</span>
                        </button>
                        {!isActive && (
                          <button
                            type="button"
                            onClick={() => openConfirmModal(project, 'delete')}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Create Project Modal */}
        <CreateProjectModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />

        {/* Edit Project Modal */}
        {editingProject && (
          <EditProjectModal
            isOpen={!!editingProject}
            onClose={() => setEditingProject(null)}
            project={editingProject}
          />
        )}

        {/* Confirmation Modal */}
        {confirmModal.isOpen &&
          confirmModal.project &&
          createPortal(
            <div
              className="fixed inset-0 top-0 left-0 right-0 bottom-0 !m-0 z-[110] flex items-center justify-center p-4 bg-[#0F1B2D]/50 backdrop-blur-[8px] transition-opacity duration-200"
              onClick={() =>
                setConfirmModal((prev) => ({ ...prev, isOpen: false }))
              }
            >
              <div
                className="bg-white dark:bg-[#121E30] rounded-2xl shadow-2xl max-w-md w-full border border-[#E5E7EB] dark:border-[#1E2D45] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 space-y-5">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                        confirmModal.type === 'delete'
                          ? 'bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-900'
                          : confirmModal.type === 'archive'
                          ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900'
                          : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[26px]">
                        {confirmModal.type === 'delete' ? 'delete_forever' : confirmModal.type === 'archive' ? 'archive' : 'unarchive'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-[#1A1A1A] dark:text-white tracking-tight">
                        {confirmModal.type === 'delete'
                          ? `Permanently Delete Project "${confirmModal.project.name}"?`
                          : confirmModal.type === 'archive'
                          ? `Archive Project "${confirmModal.project.name}"?`
                          : `Restore Project "${confirmModal.project.name}"?`}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                        {confirmModal.type === 'delete'
                          ? `Are you sure you want to permanently delete this project? This action cannot be undone.`
                          : confirmModal.type === 'archive'
                          ? `Are you sure you want to archive this project? It will be marked as inactive and hidden from active operational workflows.`
                          : `Are you sure you want to restore this project? It will be reactivated immediately.`}
                      </p>
                    </div>
                  </div>

                  {confirmModal.error && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-700 dark:text-red-300 font-medium">
                      {confirmModal.error}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EEF1F5] dark:border-[#1E2D45]">
                    <button
                      type="button"
                      disabled={confirmModal.isLoading}
                      onClick={() =>
                        setConfirmModal((prev) => ({ ...prev, isOpen: false }))
                      }
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 border border-[#D1D5DB] dark:border-[#283A55] hover:bg-gray-50 dark:hover:bg-slate-800 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={confirmModal.isLoading}
                      onClick={handleConfirmAction}
                      className={`px-5 py-2 rounded-xl text-xs font-semibold text-white shadow-sm flex items-center gap-2 transition-all active:scale-[0.99] ${
                        confirmModal.type === 'delete'
                          ? 'bg-red-600 hover:bg-red-700'
                          : confirmModal.type === 'archive'
                          ? 'bg-amber-600 hover:bg-amber-700'
                          : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      {confirmModal.isLoading && (
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      )}
                      <span className="material-symbols-outlined text-[16px]">
                        {confirmModal.type === 'delete' ? 'delete' : confirmModal.type === 'archive' ? 'archive' : 'unarchive'}
                      </span>
                      <span>
                        {confirmModal.isLoading
                          ? confirmModal.type === 'delete'
                            ? 'Deleting...'
                            : confirmModal.type === 'archive'
                            ? 'Archiving...'
                            : 'Restoring...'
                          : confirmModal.type === 'delete'
                          ? 'Permanently Delete'
                          : confirmModal.type === 'archive'
                          ? 'Archive Project'
                          : 'Restore Project'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )}
      </div>
    </AppLayout>
  );
};
