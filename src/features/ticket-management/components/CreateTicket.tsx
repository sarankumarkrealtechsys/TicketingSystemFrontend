import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/layout/AppLayout";
import {
  useActiveProjectsQuery,
  useActiveDepartmentsQuery,
  useActiveTeamsQuery,
  usePrioritiesQuery,
  useGlobalStatusesQuery,
  useSelectedTeamDetailQuery,
  useCreateTicketMutation,
} from "../api";
import { UserSummary } from "../types";

export const CreateTicket: React.FC = () => {
  const navigate = useNavigate();

  // Queries for dynamic dropdown data
  const {
    data: projects = [],
    isLoading: isLoadingProjects,
    isFetching: isFetchingProjects,
    refetch: refetchProjects,
  } = useActiveProjectsQuery();
  const {
    data: departments = [],
    isLoading: isLoadingDepartments,
    isFetching: isFetchingDepartments,
    refetch: refetchDepartments,
  } = useActiveDepartmentsQuery();
  const {
    data: allTeams = [],
    isLoading: isLoadingTeams,
    isFetching: isFetchingTeams,
    refetch: refetchTeams,
  } = useActiveTeamsQuery();
  const {
    data: priorities = [],
    isLoading: isLoadingPriorities,
    isFetching: isFetchingPriorities,
    refetch: refetchPriorities,
  } = usePrioritiesQuery();

  // Dropdown open states
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [isDepartmentDropdownOpen, setIsDepartmentDropdownOpen] = useState(false);
  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);

  // Dropdown click-outside refs
  const projectRef = useRef<HTMLDivElement>(null);
  const departmentRef = useRef<HTMLDivElement>(null);
  const teamRef = useRef<HTMLDivElement>(null);
  const assigneeRef = useRef<HTMLDivElement>(null);
  const priorityRef = useRef<HTMLDivElement>(null);

  // Form State
  const [selectedProjectId, setSelectedProjectId] = useState<number | "">("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | "">("");
  const [departmentSearchQuery, setDepartmentSearchQuery] = useState("");
  const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>([]);
  const [teamSearchQuery, setTeamSearchQuery] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPriorityId, setSelectedPriorityId] = useState<number | "">("");
  const [selectedStatusId, setSelectedStatusId] = useState<number | "">("");
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<number[]>([]);
  const [assigneeSearchQuery, setAssigneeSearchQuery] = useState("");

  // File Uploads State
  const [uploadedFiles, setUploadedFiles] = useState<
    Array<{
      id: string;
      file: File;
      name: string;
      size: string;
      progress: number;
      status: "uploading" | "completed";
    }>
  >([]);

  // Toast Notification & Error state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const createTicketMutation = useCreateTicketMutation();

  // Click Outside Handler for closing custom dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (projectRef.current && !projectRef.current.contains(target)) {
        setIsProjectDropdownOpen(false);
      }
      if (departmentRef.current && !departmentRef.current.contains(target)) {
        setIsDepartmentDropdownOpen(false);
      }
      if (teamRef.current && !teamRef.current.contains(target)) {
        setIsTeamDropdownOpen(false);
      }
      if (assigneeRef.current && !assigneeRef.current.contains(target)) {
        setIsAssigneeDropdownOpen(false);
      }
      if (priorityRef.current && !priorityRef.current.contains(target)) {
        setIsPriorityDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-select first Project
  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  // Auto-select first Department
  useEffect(() => {
    if (!selectedDepartmentId && departments.length > 0) {
      setSelectedDepartmentId(departments[0].id);
    }
  }, [departments, selectedDepartmentId]);

  // Filter Teams by selected Department
  const departmentTeams = useMemo(() => {
    if (!selectedDepartmentId) return [];
    return allTeams.filter((t) => t.departmentId === Number(selectedDepartmentId));
  }, [allTeams, selectedDepartmentId]);

  // Reset & Auto-select primary team when Department changes
  useEffect(() => {
    if (departmentTeams.length > 0) {
      // Check if current selected teams are still in department
      const validSelected = selectedTeamIds.filter((id) =>
        departmentTeams.some((t) => t.id === id)
      );
      if (validSelected.length === 0) {
        setSelectedTeamIds([departmentTeams[0].id]);
      } else {
        setSelectedTeamIds(validSelected);
      }
    } else {
      setSelectedTeamIds([]);
    }
  }, [departmentTeams]);

  // Primary team ID (first selected team)
  const primaryTeamId = selectedTeamIds[0] || null;

  // Fetch Primary Team detail for members list
  const {
    data: primaryTeamDetail,
    isFetching: isFetchingTeamDetail,
    refetch: refetchTeamDetail,
  } = useSelectedTeamDetailQuery(primaryTeamId);

  // Combine members from primary team
  const availableTeamMembers: UserSummary[] = useMemo(() => {
    if (!primaryTeamDetail?.members) return [];
    return primaryTeamDetail.members.map((m: any) => m.user || m).filter(Boolean);
  }, [primaryTeamDetail]);

  // Fetch Global statuses (available to all)
  const {
    data: statuses = [],
    isFetching: isFetchingStatuses,
    refetch: refetchStatuses,
  } = useGlobalStatusesQuery();

  // Find default OPEN status
  const openStatus = useMemo(() => {
    return (
      statuses.find((s) => s.behavior === "OPEN") ||
      statuses.find((s) => (s.label || s.name || "").toLowerCase() === "open") ||
      statuses.find((s) => s.isDefault) ||
      statuses[0]
    );
  }, [statuses]);

  // Set default status when statuses load
  useEffect(() => {
    if (openStatus && !selectedStatusId) {
      setSelectedStatusId(openStatus.id);
    }
  }, [openStatus, selectedStatusId]);

  // Set default priority when priorities load
  useEffect(() => {
    if (!selectedPriorityId && priorities.length > 0) {
      const highOrFirst =
        priorities.find((p) =>
          (p.label || p.name || "").toLowerCase().includes("high")
        ) || priorities[0];
      if (highOrFirst) {
        setSelectedPriorityId(highOrFirst.id);
      }
    }
  }, [priorities, selectedPriorityId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const isRefreshingAll =
    isFetchingProjects ||
    isFetchingDepartments ||
    isFetchingTeams ||
    isFetchingTeamDetail ||
    isFetchingPriorities ||
    isFetchingStatuses;

  const handleRefreshAll = async () => {
    try {
      await Promise.all([
        refetchProjects(),
        refetchDepartments(),
        refetchTeams(),
        primaryTeamId ? refetchTeamDetail() : Promise.resolve(),
        refetchPriorities(),
        refetchStatuses(),
      ]);
      showToast("Dropdown options updated");
    } catch {
      showToast("Failed to refresh some dropdown options");
    }
  };

  // Filtered Departments by search query
  const filteredDepartments = useMemo(() => {
    return departments.filter((dept) =>
      dept.name.toLowerCase().includes(departmentSearchQuery.toLowerCase())
    );
  }, [departments, departmentSearchQuery]);

  // Filtered Teams by search query
  const filteredDepartmentTeams = useMemo(() => {
    return departmentTeams.filter((t) =>
      t.name.toLowerCase().includes(teamSearchQuery.toLowerCase())
    );
  }, [departmentTeams, teamSearchQuery]);

  // Filter team members by assignee search query
  const filteredTeamMembers = useMemo(() => {
    return availableTeamMembers.filter((member) => {
      if (!member) return false;
      const fullName = (
        member.name ||
        `${member.firstName || ""} ${member.lastName || ""}`.trim() ||
        member.email ||
        ""
      ).toLowerCase();
      const email = (member.email || "").toLowerCase();
      const query = (assigneeSearchQuery || "").toLowerCase();
      return fullName.includes(query) || email.includes(query);
    });
  }, [availableTeamMembers, assigneeSearchQuery]);

  // Toggle Team checkbox in multi-select
  const handleToggleTeam = (teamId: number) => {
    setSelectedTeamIds((prev) => {
      if (prev.includes(teamId)) {
        if (prev.length === 1) return prev; // Keep at least one team selected
        return prev.filter((id) => id !== teamId);
      } else {
        return [...prev, teamId];
      }
    });
  };

  // Toggle Assignee checkbox in multi-select
  const handleToggleAssignee = (userId: number) => {
    setSelectedAssigneeIds((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleRemoveAssignee = (userId: number) => {
    setSelectedAssigneeIds((prev) => prev.filter((id) => id !== userId));
  };

  // File Upload Handlers
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };

  const processFiles = (newFiles: File[]) => {
    const formatted = newFiles.map((f) => ({
      id: Math.random().toString(36).substring(2, 9),
      file: f,
      name: f.name,
      size: (f.size / (1024 * 1024)).toFixed(1) + " MB",
      progress: 100,
      status: "completed" as const,
    }));
    setUploadedFiles((prev) => [...prev, ...formatted]);
  };

  const handleRemoveFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleInsertFormat = (prefix: string, suffix: string = "") => {
    setDescription((prev) => `${prev}${prefix}${suffix}`);
  };

  // Selected Project object
  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  // Selected Department object
  const selectedDepartment = departments.find((d) => d.id === selectedDepartmentId);
  // Selected Priority object
  const selectedPriority = priorities.find((p) => p.id === selectedPriorityId);
  // Selected Status object (always defaulted to Open status)
  const selectedStatus = openStatus || statuses.find((s) => s.id === selectedStatusId);

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedProjectId) {
      setFormError("Please select a project.");
      return;
    }
    if (!selectedDepartmentId) {
      setFormError("Please select a department.");
      return;
    }
    if (selectedTeamIds.length === 0) {
      setFormError("Please select at least one team.");
      return;
    }
    if (!summary.trim()) {
      setFormError("Please provide a summary for the ticket.");
      return;
    }
    if (!description.trim()) {
      setFormError("Please provide a description.");
      return;
    }
    if (selectedAssigneeIds.length === 0) {
      setFormError("Please select at least one assignee.");
      return;
    }
    if (!selectedPriorityId) {
      setFormError("Please select a priority level.");
      return;
    }

    const primaryId = selectedTeamIds[0];
    const collaboratingIds = selectedTeamIds.slice(1);

    try {
      await createTicketMutation.mutateAsync({
        projectId: Number(selectedProjectId),
        departmentId: Number(selectedDepartmentId),
        teamId: Number(primaryId),
        collaboratingTeamIds: collaboratingIds,
        summary: summary.trim(),
        description: description.trim(),
        assigneeIds: selectedAssigneeIds,
        priorityId: Number(selectedPriorityId),
        statusId: selectedStatusId ? Number(selectedStatusId) : undefined,
      });

      showToast("Ticket created successfully!");
      setTimeout(() => {
        navigate(-1);
      }, 1200);
    } catch (err: any) {
      setFormError(
        err?.response?.data?.message || err?.message || "Failed to create ticket. Please check inputs."
      );
    }
  };

  return (
    <AppLayout>
      <div className="relative w-full pb-44">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-20 right-6 z-[120] flex items-center gap-2 px-4 py-2.5 bg-[#1F3864] text-white rounded-lg shadow-xl text-xs font-semibold animate-in slide-in-from-bottom">
            <span className="material-symbols-outlined text-emerald-400 text-[18px]">
              check_circle
            </span>
            <span>{toastMessage}</span>
          </div>
        )}

        <div className="max-w-[840px] mx-auto space-y-6">
          {/* Breadcrumb Header */}
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-1">
              <span className="hover:text-[#1F3864] cursor-pointer" onClick={() => navigate("/")}>
                Home
              </span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span>Tickets</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-[#1F3864] dark:text-blue-400 font-semibold">
                Create Ticket
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-2xl font-bold text-[#1A1A1A] dark:text-white tracking-tight">
                Create Ticket
              </h1>
              <button
                type="button"
                onClick={handleRefreshAll}
                disabled={isRefreshingAll}
                className="h-9 px-3.5 bg-white dark:bg-[#121E30] hover:bg-gray-50 dark:hover:bg-[#1A283E] border border-[#D1D5DB] dark:border-[#283A55] text-[#1F3864] dark:text-blue-300 rounded-lg text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 active:scale-[0.98] cursor-pointer disabled:opacity-60"
                title="Refresh all dropdown options (projects, departments, teams, assignees, priorities, statuses)"
              >
                <span
                  className={`material-symbols-outlined text-[17px] ${
                    isRefreshingAll ? "animate-spin text-[#1E88E5]" : "text-[#5F6368] dark:text-gray-400"
                  }`}
                >
                  refresh
                </span>
                <span>{isRefreshingAll ? "Refreshing..." : "Refresh"}</span>
              </button>
            </div>
          </div>

          {/* Form Error Alert */}
          {formError && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-700 dark:text-red-300 font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-red-600 text-[18px]">error</span>
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* SECTION 1: Cascading Routing & Classification */}
            <section className="bg-white dark:bg-[#121E30] rounded-xl p-5 shadow-xs border border-[#E5E7EB] dark:border-[#1E2D45] space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#F0F2F5] dark:border-[#1E2D45]">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#1F3864]/10 dark:bg-blue-900/30 flex items-center justify-center text-[#1F3864] dark:text-blue-300">
                    <span className="material-symbols-outlined text-[18px]">account_tree</span>
                  </div>
                  <h2 className="font-bold text-sm text-[#1A1A1A] dark:text-white">
                    1. Cascading Routing & Scope
                  </h2>
                </div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Required
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Custom Project Selector */}
                <div className="relative" ref={projectRef}>
                  <label className="block text-xs font-semibold text-[#1A1A1A] dark:text-gray-200 mb-1.5">
                    Project <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsProjectDropdownOpen((prev) => !prev)}
                    className="w-full h-10 px-3 bg-[#F9FAFB] dark:bg-[#1A283E] border border-[#D1D5DB] dark:border-[#283A55] rounded-lg text-xs text-left flex items-center justify-between text-[#1A1A1A] dark:text-white focus:outline-none focus:border-[#0e61a1] transition-colors cursor-pointer"
                  >
                    <span className="truncate">
                      {selectedProject ? selectedProject.name : "Select Project..."}
                    </span>
                    <span className="material-symbols-outlined text-gray-400 text-[18px]">
                      expand_more
                    </span>
                  </button>

                  {isProjectDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white dark:bg-[#121E30] border border-[#E5E7EB] dark:border-[#1E2D45] rounded-xl shadow-2xl max-h-56 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800">
                      {projects.length === 0 ? (
                        <div className="p-3 text-xs text-gray-400 text-center">No active projects</div>
                      ) : (
                        projects.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => {
                              setSelectedProjectId(p.id);
                              setIsProjectDropdownOpen(false);
                            }}
                            className={`p-2.5 text-xs flex items-center justify-between cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors ${
                              selectedProjectId === p.id
                                ? "bg-blue-50/70 dark:bg-blue-900/30 text-[#0e61a1] dark:text-blue-300 font-semibold"
                                : "text-[#1A1A1A] dark:text-white"
                            }`}
                          >
                            <span>{p.name}</span>
                            {selectedProjectId === p.id && (
                              <span className="material-symbols-outlined text-[16px] text-[#0e61a1]">
                                check
                              </span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Custom Searchable Department Selector */}
                <div className="relative" ref={departmentRef}>
                  <label className="block text-xs font-semibold text-[#1A1A1A] dark:text-gray-200 mb-1.5">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsDepartmentDropdownOpen((prev) => !prev)}
                    className="w-full h-10 px-3 bg-[#F9FAFB] dark:bg-[#1A283E] border border-[#D1D5DB] dark:border-[#283A55] rounded-lg text-xs text-left flex items-center justify-between text-[#1A1A1A] dark:text-white focus:outline-none focus:border-[#0e61a1] transition-colors cursor-pointer"
                  >
                    <span className="truncate">
                      {selectedDepartment ? selectedDepartment.name : "Select Department..."}
                    </span>
                    <span className="material-symbols-outlined text-gray-400 text-[18px]">
                      expand_more
                    </span>
                  </button>

                  {isDepartmentDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white dark:bg-[#121E30] border border-[#E5E7EB] dark:border-[#1E2D45] rounded-xl shadow-2xl p-2 space-y-2">
                      {/* Search Bar Input */}
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[16px]">
                          search
                        </span>
                        <input
                          type="text"
                          value={departmentSearchQuery}
                          onChange={(e) => setDepartmentSearchQuery(e.target.value)}
                          placeholder="Search department..."
                          className="w-full h-8 pl-8 pr-3 bg-gray-50 dark:bg-[#1A283E] border border-gray-200 dark:border-[#283A55] rounded-md text-xs text-[#1A1A1A] dark:text-white focus:outline-none focus:border-[#0e61a1]"
                        />
                      </div>

                      <div className="max-h-48 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800">
                        {filteredDepartments.length === 0 ? (
                          <div className="p-3 text-xs text-gray-400 text-center">
                            No matching departments found
                          </div>
                        ) : (
                          filteredDepartments.map((d) => (
                            <div
                              key={d.id}
                              onClick={() => {
                                setSelectedDepartmentId(d.id);
                                setIsDepartmentDropdownOpen(false);
                                setDepartmentSearchQuery("");
                              }}
                              className={`p-2 text-xs flex items-center justify-between cursor-pointer rounded hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors ${
                                selectedDepartmentId === d.id
                                  ? "bg-blue-50 dark:bg-blue-900/30 text-[#0e61a1] dark:text-blue-300 font-semibold"
                                  : "text-[#1A1A1A] dark:text-white"
                              }`}
                            >
                              <span>{d.name}</span>
                              {selectedDepartmentId === d.id && (
                                <span className="material-symbols-outlined text-[16px] text-[#0e61a1]">
                                  check
                                </span>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Multi-Team Checkbox Selector */}
              <div className="relative" ref={teamRef}>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-[#1A1A1A] dark:text-gray-200">
                    Team(s) Selection <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-gray-400 italic">
                    Filtered by selected department • Multi-team collaboration enabled
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsTeamDropdownOpen((prev) => !prev)}
                  className="w-full min-h-[42px] p-2 bg-[#F9FAFB] dark:bg-[#1A283E] border border-[#D1D5DB] dark:border-[#283A55] rounded-lg text-xs text-left flex items-center justify-between gap-2 focus:outline-none focus:border-[#0e61a1] transition-colors cursor-pointer"
                >
                  <div className="flex flex-wrap gap-1.5 items-center flex-1">
                    {selectedTeamIds.length === 0 ? (
                      <span className="text-gray-400">Select Team(s)...</span>
                    ) : (
                      selectedTeamIds.map((id, index) => {
                        const t = departmentTeams.find((item) => item.id === id);
                        if (!t) return null;
                        const isPrimary = index === 0;
                        return (
                          <span
                            key={id}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${
                              isPrimary
                                ? "bg-blue-100 dark:bg-blue-900/50 text-[#1F3864] dark:text-blue-200 border-blue-300 dark:border-blue-700"
                                : "bg-purple-50 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                            }`}
                          >
                            <span>{t.name}</span>
                            {isPrimary && (
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-[#1F3864] text-white px-1 rounded">
                                Primary
                              </span>
                            )}
                          </span>
                        );
                      })
                    )}
                  </div>
                  <span className="material-symbols-outlined text-gray-400 text-[18px]">
                    expand_more
                  </span>
                </button>

                {isTeamDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white dark:bg-[#121E30] border border-[#E5E7EB] dark:border-[#1E2D45] rounded-xl shadow-2xl p-3 space-y-2">
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[16px]">
                        search
                      </span>
                      <input
                        type="text"
                        value={teamSearchQuery}
                        onChange={(e) => setTeamSearchQuery(e.target.value)}
                        placeholder="Search teams..."
                        className="w-full h-8 pl-8 pr-3 bg-gray-50 dark:bg-[#1A283E] border border-gray-200 dark:border-[#283A55] rounded-md text-xs text-[#1A1A1A] dark:text-white focus:outline-none focus:border-[#0e61a1]"
                      />
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-1 divide-y divide-gray-100 dark:divide-slate-800">
                      {filteredDepartmentTeams.length === 0 ? (
                        <div className="p-3 text-xs text-gray-400 text-center">
                          {!selectedDepartmentId
                            ? "Please select a department first"
                            : "No teams found for this department"}
                        </div>
                      ) : (
                        filteredDepartmentTeams.map((team) => {
                          const isChecked = selectedTeamIds.includes(team.id);
                          const isPrimary = selectedTeamIds[0] === team.id;

                          return (
                            <div
                              key={team.id}
                              onClick={() => handleToggleTeam(team.id)}
                              className="pt-2 flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                            >
                              <div className="flex items-center gap-2.5">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}}
                                  className="w-4 h-4 text-[#1F3864] rounded border-gray-300 focus:ring-0 cursor-pointer"
                                />
                                <span className="text-xs font-semibold text-[#1A1A1A] dark:text-white">
                                  {team.name}
                                </span>
                              </div>
                              {isChecked && (
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                    isPrimary
                                      ? "bg-[#1F3864] text-white"
                                      : "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300"
                                  }`}
                                >
                                  {isPrimary ? "Primary Team" : "Collaborating"}
                                </span>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* DONE BUTTON */}
                    <div className="pt-2 border-t border-gray-100 dark:border-slate-800 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setIsTeamDropdownOpen(false)}
                        className="px-4 py-1.5 bg-[#1F3864] text-white text-xs font-semibold rounded-lg hover:bg-[#152747] transition-all cursor-pointer"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* SECTION 2: Ticket Summary & Details */}
            <section className="bg-white dark:bg-[#121E30] rounded-xl p-5 shadow-xs border border-[#E5E7EB] dark:border-[#1E2D45] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#F0F2F5] dark:border-[#1E2D45]">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#1F3864]/10 dark:bg-blue-900/30 flex items-center justify-center text-[#1F3864] dark:text-blue-300">
                    <span className="material-symbols-outlined text-[18px]">info</span>
                  </div>
                  <h2 className="font-bold text-sm text-[#1A1A1A] dark:text-white">
                    2. Ticket Content
                  </h2>
                </div>
              </div>

              {/* Summary Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-[#1A1A1A] dark:text-gray-200">
                    Summary <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] font-medium text-gray-400">
                    {summary.length} / 120
                  </span>
                </div>
                <input
                  type="text"
                  value={summary}
                  maxLength={120}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Brief summary of the issue..."
                  className="w-full h-9 px-3 bg-[#F9FAFB] dark:bg-[#1A283E] border border-[#D1D5DB] dark:border-[#283A55] rounded-lg text-xs text-[#1A1A1A] dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#0e61a1] transition-all"
                />
              </div>

              {/* Description Textarea */}
              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] dark:text-gray-200 mb-1.5">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed steps to reproduce, logs, or context..."
                  className="w-full p-3 font-sans text-xs text-[#1A1A1A] dark:text-white bg-[#F9FAFB] dark:bg-[#1A283E] border border-[#D1D5DB] dark:border-[#283A55] rounded-lg focus:outline-none focus:border-[#0e61a1] resize-y leading-relaxed"
                />
              </div>
            </section>

            {/* SECTION 3: Filtered Multi-Assignees & Triage */}
            <section className="bg-white dark:bg-[#121E30] rounded-xl p-5 shadow-xs border border-[#E5E7EB] dark:border-[#1E2D45] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#F0F2F5] dark:border-[#1E2D45]">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#1F3864]/10 dark:bg-blue-900/30 flex items-center justify-center text-[#1F3864] dark:text-blue-300">
                    <span className="material-symbols-outlined text-[18px]">assignment_ind</span>
                  </div>
                  <h2 className="font-bold text-sm text-[#1A1A1A] dark:text-white">
                    3. Multi-Assignees & Triage
                  </h2>
                </div>
                <span className="text-[11px] font-semibold text-[#0e61a1] dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">
                  Team Members Filtered
                </span>
              </div>

              {/* Assignee Multi-select Selector */}
              <div className="relative" ref={assigneeRef}>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-[#1A1A1A] dark:text-gray-200">
                    Assignee(s) <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-gray-400 italic">
                    Only personnel from selected team(s)
                  </span>
                </div>

                {/* Selected Chips Container */}
                <div
                  className="min-h-[42px] p-1.5 bg-[#F9FAFB] dark:bg-[#1A283E] border border-[#D1D5DB] dark:border-[#283A55] rounded-lg flex flex-wrap items-center gap-1.5 cursor-pointer focus-within:border-[#0e61a1]"
                  onClick={() => setIsAssigneeDropdownOpen(true)}
                >
                  {selectedAssigneeIds.map((userId) => {
                    const member = availableTeamMembers.find((m) => m.id === userId);
                    const name = member
                      ? member.name || `${member.firstName || ""} ${member.lastName || ""}`.trim() || member.email
                      : `User #${userId}`;
                    const initials = name.substring(0, 2).toUpperCase();

                    return (
                      <span
                        key={userId}
                        className="inline-flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800 text-[#1F3864] dark:text-blue-300 text-xs font-medium"
                      >
                        <span className="w-5 h-5 rounded-full bg-[#1F3864] text-white flex items-center justify-center text-[10px] font-bold">
                          {initials}
                        </span>
                        <span>{name}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveAssignee(userId);
                          }}
                          className="hover:text-red-600 transition-colors ml-0.5 flex items-center cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </span>
                    );
                  })}

                  <div className="flex-1 min-w-[160px] flex items-center gap-1 px-1">
                    <span className="material-symbols-outlined text-[16px] text-gray-400">
                      search
                    </span>
                    <input
                      type="text"
                      value={assigneeSearchQuery}
                      onFocus={() => setIsAssigneeDropdownOpen(true)}
                      onChange={(e) => {
                        setAssigneeSearchQuery(e.target.value);
                        setIsAssigneeDropdownOpen(true);
                      }}
                      placeholder={
                        selectedAssigneeIds.length === 0
                          ? "Search and assign team member..."
                          : "Add member..."
                      }
                      className="w-full bg-transparent border-none text-xs text-[#1A1A1A] dark:text-white placeholder:text-gray-400 focus:outline-none p-0"
                    />
                  </div>
                </div>

                {/* Dropdown Popup */}
                {isAssigneeDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white dark:bg-[#121E30] border border-[#E5E7EB] dark:border-[#1E2D45] rounded-xl shadow-2xl p-3 space-y-2">
                    <div className="max-h-48 overflow-y-auto space-y-1 divide-y divide-gray-100 dark:divide-slate-800">
                      {filteredTeamMembers.length === 0 ? (
                        <div className="p-3 text-xs text-gray-400 text-center">
                          {availableTeamMembers.length === 0
                            ? "No team members found for selected team"
                            : "No matching members found"}
                        </div>
                      ) : (
                        filteredTeamMembers.map((member) => {
                          const isChecked = selectedAssigneeIds.includes(member.id);
                          const name =
                            member.name ||
                            `${member.firstName || ""} ${member.lastName || ""}`.trim() ||
                            member.email;
                          const initials = name.substring(0, 2).toUpperCase();

                          return (
                            <div
                              key={member.id}
                              onClick={() => handleToggleAssignee(member.id)}
                              className="pt-2 flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                            >
                              <div className="flex items-center gap-2.5">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}}
                                  className="w-4 h-4 text-[#1F3864] rounded border-gray-300 focus:ring-0 cursor-pointer"
                                />
                                <span className="w-6 h-6 rounded-full bg-[#1F3864] text-white flex items-center justify-center text-[10px] font-bold">
                                  {initials}
                                </span>
                                <div className="flex flex-col">
                                  <span className="text-xs font-semibold text-[#1A1A1A] dark:text-white leading-tight">
                                    {name}
                                  </span>
                                  <span className="text-[11px] text-gray-400 leading-tight">
                                    {member.email}
                                  </span>
                                </div>
                              </div>
                              {isChecked && (
                                <span className="material-symbols-outlined text-[18px] text-[#0e61a1]">
                                  check
                                </span>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* DONE BUTTON */}
                    <div className="pt-2 border-t border-gray-100 dark:border-slate-800 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setIsAssigneeDropdownOpen(false)}
                        className="px-4 py-1.5 bg-[#1F3864] text-white text-xs font-semibold rounded-lg hover:bg-[#152747] transition-all cursor-pointer"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Priority & Status Custom Selector Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Priority Selector */}
                <div className="relative" ref={priorityRef}>
                  <label className="block text-xs font-semibold text-[#1A1A1A] dark:text-gray-200 mb-1.5">
                    Priority <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsPriorityDropdownOpen((prev) => !prev)}
                    className="w-full h-10 px-3 bg-[#F9FAFB] dark:bg-[#1A283E] border border-[#D1D5DB] dark:border-[#283A55] rounded-lg text-xs text-left flex items-center justify-between text-[#1A1A1A] dark:text-white focus:outline-none focus:border-[#0e61a1] transition-colors cursor-pointer"
                  >
                    <span className="truncate">
                      {selectedPriority
                        ? selectedPriority.label || selectedPriority.name
                        : "Select Priority..."}
                    </span>
                    <span className="material-symbols-outlined text-gray-400 text-[18px]">
                      expand_more
                    </span>
                  </button>

                  {isPriorityDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white dark:bg-[#121E30] border border-[#E5E7EB] dark:border-[#1E2D45] rounded-xl shadow-2xl max-h-48 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800">
                      {priorities.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSelectedPriorityId(p.id);
                            setIsPriorityDropdownOpen(false);
                          }}
                          className={`p-2.5 text-xs flex items-center justify-between cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors ${
                            selectedPriorityId === p.id
                              ? "bg-blue-50 dark:bg-blue-900/30 text-[#0e61a1] dark:text-blue-300 font-semibold"
                              : "text-[#1A1A1A] dark:text-white"
                          }`}
                        >
                          <span>{p.label || p.name || `Priority #${p.id}`}</span>
                          {selectedPriorityId === p.id && (
                            <span className="material-symbols-outlined text-[16px] text-[#0e61a1]">
                              check
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Status (Default Open - Read Only) */}
                <div className="relative">
                  <label className="block text-xs font-semibold text-[#1A1A1A] dark:text-gray-200 mb-1.5">
                    Status
                  </label>
                  <div className="w-full h-10 px-3.5 bg-[#F3F4F6]/80 dark:bg-[#152236] border border-[#E5E7EB] dark:border-[#1E2D45] rounded-lg text-xs flex items-center justify-between text-[#1A1A1A] dark:text-white cursor-default select-none">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#1E88E5] ring-2 ring-blue-500/20"></span>
                      <span className="font-bold text-[#1E88E5] uppercase tracking-wide text-[11px]">
                        {selectedStatus?.label || selectedStatus?.name || "Open"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 4: Attachments */}
            <section className="bg-white dark:bg-[#121E30] rounded-xl p-5 shadow-xs border border-[#E5E7EB] dark:border-[#1E2D45] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#F0F2F5] dark:border-[#1E2D45]">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#1F3864]/10 dark:bg-blue-900/30 flex items-center justify-center text-[#1F3864] dark:text-blue-300">
                    <span className="material-symbols-outlined text-[18px]">attach_file</span>
                  </div>
                  <h2 className="font-bold text-sm text-[#1A1A1A] dark:text-white">
                    4. Attachments
                  </h2>
                </div>
                <span className="text-[11px] font-medium text-gray-400">
                  Max 50MB
                </span>
              </div>

              {/* Upload Drag & Drop Zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                className="border-2 border-dashed border-[#CBD5E1] dark:border-[#283A55] hover:border-[#0e61a1] rounded-xl p-6 text-center bg-[#F9FAFB]/70 dark:bg-[#1A283E]/50 transition-colors cursor-pointer group"
              >
                <input
                  type="file"
                  multiple
                  id="file-input"
                  className="hidden"
                  onChange={handleFileInputChange}
                />
                <label htmlFor="file-input" className="cursor-pointer block">
                  <div className="w-11 h-11 rounded-full bg-[#1F3864]/10 dark:bg-blue-900/40 text-[#1F3864] dark:text-blue-300 flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[24px]">cloud_upload</span>
                  </div>
                  <p className="text-xs font-semibold text-[#1A1A1A] dark:text-white">
                    Drag and drop files here, or{" "}
                    <span className="text-[#0e61a1] dark:text-blue-400 underline">
                      browse files
                    </span>
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Supports telemetry logs (.log), images (.png, .jpg), and documents up to 50MB
                  </p>
                </label>
              </div>

              {/* Active File List */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2 pt-2">
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="p-3 rounded-lg border border-[#E2E8F0] dark:border-[#1E2D45] bg-white dark:bg-[#1A283E] flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[18px]">description</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-[#1A1A1A] dark:text-white truncate">
                            {file.name}
                          </span>
                          <span className="text-[11px] text-gray-400">{file.size}</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full w-full" />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(file.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors p-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </form>
        </div>

        {/* STICKY FOOTER ACTION BAR */}
        <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-white/95 dark:bg-[#121E30]/95 backdrop-blur-md border-t border-[#E5E7EB] dark:border-[#1E2D45] z-50 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
          <div className="max-w-[840px] mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
              <span className="material-symbols-outlined text-[16px] text-emerald-600">
                cloud_done
              </span>
              <span>Draft ready</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 border border-[#D1D5DB] dark:border-[#283A55] hover:bg-gray-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={createTicketMutation.isPending}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#1F3864] hover:bg-[#152747] active:scale-[0.98] shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
              >
                {createTicketMutation.isPending && (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                <span className="material-symbols-outlined text-[18px]">add_task</span>
                <span>
                  {createTicketMutation.isPending ? "Creating..." : "Create Ticket"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default CreateTicket;
