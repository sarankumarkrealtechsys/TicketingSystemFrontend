import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/layout/AppLayout";
import {
  useActiveProjectsQuery,
  useActiveDepartmentsQuery,
  useActiveTeamsQuery,
  usePrioritiesQuery,
  useGlobalStatusesQuery,
  useTeamStatusesQuery,
  useSelectedTeamsDetailsQuery,
  useCreateTicketMutation,
} from "../api";
import { apiClient } from "@/shared/api";
import { UserSummary } from "../types";

export interface AnnotatedAssignee extends UserSummary {
  teamNames: string[];
}
import {
  DynamicCustomFieldsRenderer,
  AddFieldModal,
  EditFieldModal,
  useTicketFieldsQuery,
  useDeleteTicketFieldMutation,
  TicketFieldDefinition,
} from "@/features/ticket-fields";
import { PERMISSIONS, useCan } from "@/features/auth";
import { getPriorityColor, getStatusColor } from "@/features/priority-status-management/colorRegistry";

export const CreateTicket: React.FC = () => {
  const navigate = useNavigate();
  const canManageTicketFields = useCan(PERMISSIONS.TICKET_FIELD_MANAGE);

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

  // Explicitly sort priorities by their configured sortOrder
  const sortedPriorities = useMemo(() => {
    return [...priorities].sort(
      (a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id - b.id
    );
  }, [priorities]);

  // Dropdown open states
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [isDepartmentDropdownOpen, setIsDepartmentDropdownOpen] = useState(false);
  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);

  // Live listener for color registry updates and masterdata updates across tabs and modals
  const [, setColorTick] = useState(0);
  useEffect(() => {
    const handleColorUpdate = () => setColorTick((c) => c + 1);
    const handleMasterDataUpdate = () => {
      refetchPriorities();
    };
    window.addEventListener("rts_colors_updated", handleColorUpdate);
    window.addEventListener("rts_masterdata_updated", handleMasterDataUpdate);
    window.addEventListener("storage", handleColorUpdate);
    return () => {
      window.removeEventListener("rts_colors_updated", handleColorUpdate);
      window.removeEventListener("rts_masterdata_updated", handleMasterDataUpdate);
      window.removeEventListener("storage", handleColorUpdate);
    };
  }, [refetchPriorities]);

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

  const primaryTeamId = selectedTeamIds[0] || null;
  const primaryTeam = allTeams.find((t) => t.id === primaryTeamId);

  // Dynamic Custom Fields State & Query
  const { data: availableCustomFields = [] } = useTicketFieldsQuery({
    teamId: primaryTeamId ?? undefined,
    includeInactive: false,
  });
  const [customFieldValues, setCustomFieldValues] = useState<Record<number, any>>({});
  const [customFieldErrors, setCustomFieldErrors] = useState<Record<number, string>>({});
  const [isAddFieldModalOpen, setIsAddFieldModalOpen] = useState(false);

  const handleCustomFieldChange = (fieldId: number, val: any) => {
    setCustomFieldValues((prev) => ({ ...prev, [fieldId]: val }));
    if (customFieldErrors[fieldId]) {
      setCustomFieldErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  const handleCustomFieldCreated = (newField: TicketFieldDefinition) => {
    setCustomFieldValues((prev) => ({
      ...prev,
      [newField.id]: newField.fieldType === "BOOLEAN" ? false : "",
    }));
    showToast(`Custom field "${newField.name}" added to ticket!`);
  };

  const [fieldToEdit, setFieldToEdit] = useState<TicketFieldDefinition | null>(null);
  const [fieldToDelete, setFieldToDelete] = useState<TicketFieldDefinition | null>(null);
  const deleteTicketFieldMutation = useDeleteTicketFieldMutation();

  const handleCustomFieldUpdated = (updated: TicketFieldDefinition) => {
    showToast(`Custom field "${updated.name}" updated!`);
  };

  const handleConfirmDeleteField = async () => {
    if (!fieldToDelete) return;
    try {
      await deleteTicketFieldMutation.mutateAsync(fieldToDelete.id);
      setCustomFieldValues((prev) => {
        const next = { ...prev };
        delete next[fieldToDelete.id];
        return next;
      });
      showToast(`Custom field "${fieldToDelete.name}" deleted.`);
      setFieldToDelete(null);
    } catch (err: any) {
      setFormError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to delete custom field."
      );
    }
  };

  const createTicketMutation = useCreateTicketMutation();

  // Listen for priority/status color updates in real-time
  const [, setColorUpdateTick] = useState(0);
  useEffect(() => {
    const handleColorsChanged = () => setColorUpdateTick((v) => v + 1);
    window.addEventListener("rts_colors_updated", handleColorsChanged);
    window.addEventListener("storage", handleColorsChanged);
    return () => {
      window.removeEventListener("rts_colors_updated", handleColorsChanged);
      window.removeEventListener("storage", handleColorsChanged);
    };
  }, []);

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

  // Fetch details for all selected teams in parallel
  const selectedTeamsQueries = useSelectedTeamsDetailsQuery(selectedTeamIds);
  const isFetchingTeamDetails = selectedTeamsQueries.some((q) => q.isFetching);
  const isLoadingTeamDetails = selectedTeamsQueries.some((q) => q.isLoading);

  // Combine and deduplicate active members from all currently selected teams
  const availableTeamMembers: AnnotatedAssignee[] = useMemo(() => {
    const map = new Map<number, AnnotatedAssignee>();

    for (const q of selectedTeamsQueries) {
      const teamDetail = q.data;
      if (!teamDetail || !Array.isArray(teamDetail.members)) continue;
      // Guarantee only currently selected teams are considered
      if (!selectedTeamIds.includes(teamDetail.id)) continue;

      const teamName = teamDetail.name || `Team #${teamDetail.id}`;

      for (const m of teamDetail.members) {
        if (m.removedAt) continue;
        const u = m.user || (m as any);
        if (!u || !u.id || u.status === "INACTIVE") continue;

        if (map.has(u.id)) {
          const existing = map.get(u.id)!;
          if (!existing.teamNames.includes(teamName)) {
            existing.teamNames.push(teamName);
          }
        } else {
          map.set(u.id, {
            ...u,
            teamNames: [teamName],
          });
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      const nameA = a.name || a.username || a.email || "";
      const nameB = b.name || b.username || b.email || "";
      return nameA.localeCompare(nameB);
    });
  }, [selectedTeamsQueries, selectedTeamIds]);

  // Prune any selected assignees that are not in the new available list
  useEffect(() => {
    if (availableTeamMembers.length > 0) {
      setSelectedAssigneeIds((prev) =>
        prev.filter((id) => availableTeamMembers.some((m) => m.id === id))
      );
    } else {
      setSelectedAssigneeIds([]);
    }
  }, [availableTeamMembers]);

  // Fetch Global statuses (available to all)
  const {
    data: globalStatuses = [],
    isFetching: isFetchingGlobalStatuses,
    refetch: refetchGlobalStatuses,
  } = useGlobalStatusesQuery();

  // Fetch Team statuses when a primary team is selected
  const {
    data: teamStatuses = [],
    isFetching: isFetchingTeamStatuses,
    refetch: refetchTeamStatuses,
  } = useTeamStatusesQuery(primaryTeamId);

  // Scoped statuses: if primaryTeamId is chosen and team has statuses, use teamStatuses (Global + Team), otherwise globalStatuses
  const statuses = useMemo(() => {
    if (primaryTeamId && teamStatuses && teamStatuses.length > 0) {
      return teamStatuses;
    }
    return globalStatuses;
  }, [primaryTeamId, teamStatuses, globalStatuses]);

  const isFetchingStatuses = isFetchingGlobalStatuses || isFetchingTeamStatuses;
  const refetchStatuses = () => {
    refetchGlobalStatuses();
    if (primaryTeamId) refetchTeamStatuses();
  };

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
    if (!selectedPriorityId && sortedPriorities.length > 0) {
      const highOrFirst =
        sortedPriorities.find((p) =>
          (p.label || p.name || "").toLowerCase().includes("high")
        ) || sortedPriorities[0];
      if (highOrFirst) {
        setSelectedPriorityId(highOrFirst.id);
      }
    }
  }, [sortedPriorities, selectedPriorityId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const isRefreshingAll =
    isFetchingProjects ||
    isFetchingDepartments ||
    isFetchingTeams ||
    isFetchingTeamDetails ||
    isFetchingPriorities ||
    isFetchingStatuses;

  const handleRefreshAll = async () => {
    try {
      await Promise.all([
        refetchProjects(),
        refetchDepartments(),
        refetchTeams(),
        ...selectedTeamsQueries.map((q) => q.refetch()),
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

  // Switch team on row click (or promote collaborating team to primary)
  const handleSelectTeamRow = (teamId: number) => {
    setSelectedTeamIds((prev) => {
      // If team is already primary, do nothing
      if (prev[0] === teamId) return prev;

      // If team is already in collaborating list, promote it to primary
      if (prev.includes(teamId)) {
        return [teamId, ...prev.filter((id) => id !== teamId)];
      }

      // If only 1 team was selected, switch to this new team directly
      if (prev.length <= 1) {
        return [teamId];
      }

      // If multiple teams are already selected, add as collaborating
      return [...prev, teamId];
    });
  };

  // Toggle Team checkbox explicitly
  const handleToggleTeamCheckbox = (teamId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTeamIds((prev) => {
      if (prev.includes(teamId)) {
        if (prev.length === 1) {
          showToast("At least one team must be selected.");
          return prev;
        }
        return prev.filter((id) => id !== teamId);
      } else {
        return [...prev, teamId];
      }
    });
  };

  // Set a collaborating team as Primary
  const handleSetPrimaryTeam = (teamId: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedTeamIds((prev) => {
      if (!prev.includes(teamId)) {
        return [teamId, ...prev];
      }
      return [teamId, ...prev.filter((id) => id !== teamId)];
    });
    showToast("Primary team updated.");
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

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes <= 0) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const processFiles = (newFiles: File[]) => {
    const formatted = newFiles.map((f) => ({
      id: Math.random().toString(36).substring(2, 9),
      file: f,
      name: f.name,
      size: formatFileSize(f.size),
      progress: 100,
      status: "completed" as const,
    }));
    setUploadedFiles((prev) => [...prev, ...formatted]);
  };

  const handleRemoveFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };


  const getInitials = (name: string): string => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Selected Project object
  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  // Selected Department object
  const selectedDepartment = departments.find((d) => d.id === selectedDepartmentId);
  // Selected Priority object
  const selectedPriority = priorities.find((p) => p.id === selectedPriorityId);
  // Selected Status object
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

    // Validate required custom fields
    const missingRequiredField = availableCustomFields.find(
      (f) =>
        f.isRequired &&
        f.status === "ACTIVE" &&
        (customFieldValues[f.id] === undefined ||
          customFieldValues[f.id] === null ||
          customFieldValues[f.id] === "" ||
          (Array.isArray(customFieldValues[f.id]) &&
            customFieldValues[f.id].length === 0))
    );
    if (missingRequiredField) {
      setFormError(`Custom field "${missingRequiredField.name}" is required.`);
      setCustomFieldErrors((prev) => ({
        ...prev,
        [missingRequiredField.id]: "This field is required",
      }));
      return;
    }

    // Format non-empty custom fields array
    const formattedCustomFields = Object.entries(customFieldValues)
      .filter(
        ([_, val]) =>
          val !== undefined &&
          val !== null &&
          val !== "" &&
          (!Array.isArray(val) || val.length > 0)
      )
      .map(([fieldDefId, value]) => ({
        fieldDefinitionId: Number(fieldDefId),
        value,
      }));

    const primaryId = selectedTeamIds[0];
    const collaboratingIds = selectedTeamIds.slice(1);

    try {
      const createdTicket = await createTicketMutation.mutateAsync({
        projectId: Number(selectedProjectId),
        departmentId: Number(selectedDepartmentId),
        teamId: Number(primaryId),
        collaboratingTeamIds: collaboratingIds,
        summary: summary.trim(),
        description: description.trim(),
        assigneeIds: selectedAssigneeIds,
        priorityId: Number(selectedPriorityId),
        statusId: selectedStatusId ? Number(selectedStatusId) : undefined,
        customFields:
          formattedCustomFields.length > 0 ? formattedCustomFields : undefined,
      });

      // Upload file attachments to backend storage and link to created ticket
      if (uploadedFiles.length > 0 && createdTicket?.id) {
        for (const uf of uploadedFiles) {
          try {
            const formData = new FormData();
            formData.append("file", uf.file);
            await apiClient.post(
              `/tickets/${createdTicket.id}/attachments`,
              formData,
              {
                headers: { "Content-Type": "multipart/form-data" },
              }
            );
          } catch (attErr) {
            console.error("Failed to upload attachment:", attErr);
          }
        }
      }

      showToast("Ticket created successfully!");
      setTimeout(() => {
        navigate(-1);
      }, 1000);
    } catch (err: any) {
      setFormError(
        err?.response?.data?.message || err?.message || "Failed to create ticket. Please check inputs."
      );
    }
  };

  return (
    <AppLayout>
      <div className="relative w-full pb-36 bg-[#F7F8FA] min-h-screen">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-24 right-6 z-[120] flex items-center gap-2 px-4 py-2.5 bg-[#1F3864] text-white rounded-lg shadow-xl text-xs font-semibold animate-in slide-in-from-bottom">
            <span className="material-symbols-outlined text-emerald-400 text-[18px]">
              check_circle
            </span>
            <span>{toastMessage}</span>
          </div>
        )}

        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-4 space-y-5">
          {/* Breadcrumb & Page Heading */}
          <header className="flex flex-col gap-1">
            <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 text-gray-500 text-xs font-medium">
              <span
                onClick={() => navigate("/")}
                className="hover:text-[#1F3864] transition-colors cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[15px]">home</span>
                <span>Home</span>
              </span>
              <span className="text-gray-400">/</span>
              <span
                onClick={() => navigate("/tickets")}
                className="hover:text-[#1F3864] transition-colors cursor-pointer"
              >
                Tickets
              </span>
              <span className="text-gray-400">/</span>
              <span className="text-[#1F3864] font-semibold">Create Ticket</span>
            </nav>

            <div className="flex items-center justify-between gap-3 mt-0.5">
              <div>
                <h1 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">Create Ticket</h1>
              </div>

              <button
                type="button"
                onClick={handleRefreshAll}
                disabled={isRefreshingAll}
                className="h-8.5 px-3 bg-white hover:bg-gray-50 border border-[#D1D5DB] text-[#1F3864] rounded-lg text-xs font-semibold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60 shrink-0"
                title="Refresh options"
              >
                <span
                  className={`material-symbols-outlined text-[16px] ${
                    isRefreshingAll ? "animate-spin text-[#1E88E5]" : "text-gray-500"
                  }`}
                >
                  refresh
                </span>
                <span>{isRefreshingAll ? "Refreshing..." : "Refresh"}</span>
              </button>
            </div>
          </header>

          {/* Form Error Alert */}
          {formError && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2 shadow-2xs">
              <span className="material-symbols-outlined text-red-600 text-[18px]">error</span>
              <span>{formError}</span>
            </div>
          )}

          {/* 2-Column Responsive Layout (Stitch Pattern) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ── Left Column (~65% width: 8 cols on lg) ── */}
            <section className="lg:col-span-8 flex flex-col gap-5">
              {/* Primary Form Card */}
              <div className="bg-white rounded-xl shadow-xs border border-[#E5E7EB] p-5 sm:p-6 space-y-5">
                {/* Project, Department & Team Cascading Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {/* Project Dropdown */}
                  <div className="flex flex-col gap-1.5" ref={projectRef}>
                    <label className="text-xs font-semibold text-[#1A1A1A] flex items-center gap-1">
                      Project <span className="text-red-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-[#1F3864]">
                        <span className="material-symbols-outlined text-[18px]">folder</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsProjectDropdownOpen((prev) => !prev)}
                        className="w-full h-10 pl-9 pr-8 bg-gray-50/70 border border-[#D1D5DB] rounded-lg text-xs text-left flex items-center justify-between text-[#1A1A1A] focus:outline-none focus:border-[#1F3864] transition-colors cursor-pointer"
                      >
                        <span className="truncate font-medium">
                          {selectedProject ? selectedProject.name : "Select Project..."}
                        </span>
                        <span className="material-symbols-outlined text-gray-400 text-[18px] pointer-events-none">
                          expand_more
                        </span>
                      </button>

                      {isProjectDropdownOpen && (
                        <div className="absolute left-0 right-0 top-full mt-1 z-40 bg-white border border-[#E5E7EB] rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-gray-100">
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
                                className={`p-2.5 text-xs flex items-center justify-between cursor-pointer hover:bg-blue-50 transition-colors ${
                                  selectedProjectId === p.id
                                    ? "bg-blue-50 text-[#1F3864] font-bold"
                                    : "text-[#1A1A1A]"
                                }`}
                              >
                                <span className="truncate">{p.name}</span>
                                {selectedProjectId === p.id && (
                                  <span className="material-symbols-outlined text-[16px] text-[#1F3864]">
                                    check
                                  </span>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Department Dropdown */}
                  <div className="flex flex-col gap-1.5" ref={departmentRef}>
                    <label className="text-xs font-semibold text-[#1A1A1A] flex items-center gap-1">
                      Department <span className="text-red-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-[#1F3864]">
                        <span className="material-symbols-outlined text-[18px]">corporate_fare</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsDepartmentDropdownOpen((prev) => !prev)}
                        className="w-full h-10 pl-9 pr-8 bg-gray-50/70 border border-[#D1D5DB] rounded-lg text-xs text-left flex items-center justify-between text-[#1A1A1A] focus:outline-none focus:border-[#1F3864] transition-colors cursor-pointer"
                      >
                        <span className="truncate font-medium">
                          {selectedDepartment ? selectedDepartment.name : "Select Dept..."}
                        </span>
                        <span className="material-symbols-outlined text-gray-400 text-[18px] pointer-events-none">
                          expand_more
                        </span>
                      </button>

                      {isDepartmentDropdownOpen && (
                        <div className="absolute left-0 right-0 top-full mt-1 z-40 bg-white border border-[#E5E7EB] rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-gray-100">
                          <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
                            <input
                              type="text"
                              value={departmentSearchQuery}
                              onChange={(e) => setDepartmentSearchQuery(e.target.value)}
                              placeholder="Search departments..."
                              className="w-full px-2.5 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          {filteredDepartments.length === 0 ? (
                            <div className="p-3 text-xs text-gray-400 text-center">No departments</div>
                          ) : (
                            filteredDepartments.map((d) => (
                              <div
                                key={d.id}
                                onClick={() => {
                                  setSelectedDepartmentId(d.id);
                                  setIsDepartmentDropdownOpen(false);
                                }}
                                className={`p-2.5 text-xs flex items-center justify-between cursor-pointer hover:bg-blue-50 transition-colors ${
                                  selectedDepartmentId === d.id
                                    ? "bg-blue-50 text-[#1F3864] font-bold"
                                    : "text-[#1A1A1A]"
                                }`}
                              >
                                <span className="truncate">{d.name}</span>
                                {selectedDepartmentId === d.id && (
                                  <span className="material-symbols-outlined text-[16px] text-[#1F3864]">
                                    check
                                  </span>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Team Dropdown */}
                  <div className="flex flex-col gap-1.5" ref={teamRef}>
                    <label className="text-xs font-semibold text-[#1A1A1A] flex items-center gap-1">
                      Team <span className="text-red-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-[#1F3864]">
                        <span className="material-symbols-outlined text-[18px]">groups</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsTeamDropdownOpen((prev) => !prev)}
                        className="w-full h-10 pl-9 pr-8 bg-gray-50/70 border border-[#D1D5DB] rounded-lg text-xs text-left flex items-center justify-between text-[#1A1A1A] focus:outline-none focus:border-[#1F3864] transition-colors cursor-pointer"
                      >
                        <span className="truncate font-medium">
                          {selectedTeamIds.length === 0
                            ? "Select Team..."
                            : selectedTeamIds.length === 1
                            ? primaryTeam?.name || "1 Team Selected"
                            : `${primaryTeam?.name || "Team"} (+${selectedTeamIds.length - 1} collab)`}
                        </span>
                        <span className="material-symbols-outlined text-gray-400 text-[18px] pointer-events-none">
                          expand_more
                        </span>
                      </button>

                      {isTeamDropdownOpen && (
                        <div className="absolute left-0 right-0 top-full mt-1 z-40 bg-white border border-[#E5E7EB] rounded-xl shadow-xl max-h-64 overflow-y-auto divide-y divide-gray-100">
                          <div className="p-2 border-b border-gray-100 sticky top-0 bg-white z-10">
                            <input
                              type="text"
                              value={teamSearchQuery}
                              onChange={(e) => setTeamSearchQuery(e.target.value)}
                              placeholder="Search teams..."
                              className="w-full px-2.5 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          {filteredDepartmentTeams.length === 0 ? (
                            <div className="p-3 text-xs text-gray-400 text-center">No teams for this department</div>
                          ) : (
                            filteredDepartmentTeams.map((t) => {
                              const isChecked = selectedTeamIds.includes(t.id);
                              const isPrimary = selectedTeamIds[0] === t.id;
                              return (
                                <div
                                  key={t.id}
                                  onClick={() => handleSelectTeamRow(t.id)}
                                  className={`p-2.5 text-xs flex items-center justify-between cursor-pointer hover:bg-blue-50 transition-colors ${
                                    isPrimary
                                      ? "bg-blue-50/80 font-bold text-[#1F3864]"
                                      : isChecked
                                      ? "bg-slate-50 font-medium text-[#1A1A1A]"
                                      : "text-[#1A1A1A]"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 truncate min-w-0">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onClick={(e) => handleToggleTeamCheckbox(t.id, e)}
                                      onChange={() => {}}
                                      className="rounded text-[#1F3864] focus:ring-[#1F3864] w-3.5 h-3.5 cursor-pointer shrink-0"
                                      title={isChecked ? "Deselect team" : "Select team"}
                                    />
                                    <span className="truncate">{t.name}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                    {isPrimary ? (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1F3864] text-white font-bold flex items-center gap-1 shadow-2xs">
                                        <span className="material-symbols-outlined text-[12px]">star</span>
                                        Primary
                                      </span>
                                    ) : isChecked ? (
                                      <div className="flex items-center gap-1">
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-700 font-medium">
                                          Collab
                                        </span>
                                        <button
                                          type="button"
                                          onClick={(e) => handleSetPrimaryTeam(t.id, e)}
                                          className="text-[10px] px-2 py-0.5 rounded bg-blue-100 hover:bg-blue-200 text-[#1F3864] font-semibold transition-colors cursor-pointer flex items-center gap-0.5"
                                          title="Set as Primary Team"
                                        >
                                          <span className="material-symbols-outlined text-[11px]">star</span>
                                          Set Primary
                                        </button>
                                      </div>
                                    ) : null}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Summary / Title */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#1A1A1A] flex items-center gap-1" htmlFor="ticket-summary">
                      Summary <span className="text-red-500 font-bold">*</span>
                    </label>
                    <span className="font-mono text-[11px] text-gray-400">
                      {summary.length} / 120
                    </span>
                  </div>
                  <input
                    id="ticket-summary"
                    type="text"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value.slice(0, 120))}
                    placeholder="Brief summary of the issue (e.g. SSO Gateway latency spike & 504 timeouts)"
                    className="w-full h-10 px-3.5 bg-gray-50/70 border border-[#D1D5DB] rounded-lg text-xs font-medium text-[#1A1A1A] placeholder:text-gray-400 focus:outline-none focus:border-[#1F3864] focus:bg-white transition-all shadow-2xs"
                  />
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#1A1A1A] flex items-center gap-1" htmlFor="ticket-description">
                    Description <span className="text-red-500 font-bold">*</span>
                  </label>
                  <textarea
                    id="ticket-description"
                    rows={6}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detailed steps to reproduce, telemetry logs, or contextual background..."
                    className="w-full p-3.5 bg-gray-50/70 border border-[#D1D5DB] rounded-lg text-xs font-sans text-[#1A1A1A] placeholder:text-gray-400 focus:outline-none focus:border-[#1F3864] focus:ring-1 focus:ring-[#1F3864] focus:bg-white transition-all shadow-2xs resize-y leading-relaxed"
                  />
                </div>

                {/* Attachments Section */}
                <div className="flex flex-col gap-2 pt-1 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#1A1A1A] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[17px] text-gray-500">attach_file</span>
                      <span>Attachments <span className="font-normal text-gray-400">(Optional)</span></span>
                    </label>
                    <span className="text-[11px] text-gray-400 font-medium">Max 50MB per file</span>
                  </div>

                  {/* Drag and Drop Dropzone */}
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleFileDrop}
                    className="border-2 border-dashed border-[#CBD5E1] hover:border-[#1F3864] rounded-xl p-5 text-center bg-[#F9FAFB]/70 hover:bg-blue-50/20 transition-all cursor-pointer group"
                  >
                    <input
                      type="file"
                      multiple
                      id="file-input"
                      className="hidden"
                      onChange={handleFileInputChange}
                    />
                    <label htmlFor="file-input" className="cursor-pointer block">
                      <div className="w-9 h-9 rounded-full bg-[#1F3864]/10 text-[#1F3864] flex items-center justify-center mx-auto mb-1.5 group-hover:scale-105 transition-transform">
                        <span className="material-symbols-outlined text-[22px]">cloud_upload</span>
                      </div>
                      <p className="text-xs font-semibold text-[#1A1A1A]">
                        Drag files here or <span className="text-[#0E61A1] underline">browse files</span> from your workstation
                      </p>
                      <span className="text-[11px] text-gray-400 block mt-0.5">
                        Supports PNG, JPG, PDF, TXT, LOG, CSV up to 50MB
                      </span>
                    </label>
                  </div>

                  {/* File Preview Chips */}
                  {uploadedFiles.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      {uploadedFiles.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-200 shadow-2xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded bg-blue-100 flex items-center justify-center text-[#1F3864] shrink-0">
                              <span className="material-symbols-outlined text-[16px]">
                                {file.name.match(/\.(png|jpe?g|gif|webp)$/i) ? "image" : "description"}
                              </span>
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-semibold text-[#1A1A1A] truncate">
                                {file.name}
                              </span>
                              <span className="text-[10px] text-gray-400">{file.size} · Ready</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="material-symbols-outlined text-[16px] text-emerald-600">
                              check_circle
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(file.id)}
                              className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                              title="Remove file"
                            >
                              <span className="material-symbols-outlined text-[15px]">close</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Dynamic Custom Fields Section (Placed below Attachments) */}
                {(canManageTicketFields || availableCustomFields.length > 0) && (
                  <div className="pt-5 border-t border-gray-100 flex flex-col gap-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-[#1F3864] uppercase tracking-wider flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[17px]">tune</span>
                          <span>Dynamic Custom Fields</span>
                        </label>
                        {primaryTeam?.name && (
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-[#1F3864] font-semibold text-[10px] border border-blue-100">
                            {primaryTeam.name}
                          </span>
                        )}
                      </div>
                      {canManageTicketFields && availableCustomFields.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setIsAddFieldModalOpen(true)}
                          className="h-8 px-2.5 bg-blue-50 hover:bg-blue-100 text-[#1F3864] border border-blue-200 rounded-lg text-xs font-semibold shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[15px]">add</span>
                          <span>Add Field</span>
                        </button>
                      )}
                    </div>

                    {availableCustomFields.length > 0 ? (
                      <DynamicCustomFieldsRenderer
                        fields={availableCustomFields}
                        values={customFieldValues}
                        errors={customFieldErrors}
                        onChange={handleCustomFieldChange}
                        onOpenAddFieldModal={() => setIsAddFieldModalOpen(true)}
                        canManage={canManageTicketFields}
                        onEditField={(field) => setFieldToEdit(field)}
                        onDeleteField={(field) => setFieldToDelete(field)}
                        hideHeader={true}
                      />
                    ) : canManageTicketFields ? (
                      <div className="p-5 rounded-xl border border-dashed border-gray-300 text-center bg-gray-50/70 space-y-2.5">
                        <div className="w-9 h-9 mx-auto rounded-full bg-blue-50 text-[#1F3864] flex items-center justify-center mb-1">
                          <span className="material-symbols-outlined text-[20px]">playlist_add</span>
                        </div>
                        <p className="text-xs text-gray-700 font-semibold">
                          No custom fields configured for this team yet.
                        </p>
                        <p className="text-[11px] text-gray-500 max-w-sm mx-auto">
                          Need to capture specific parameters? You can define custom fields for this workflow.
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsAddFieldModalOpen(true)}
                          className="px-3.5 py-1.5 rounded-lg bg-[#1F3864] text-white text-xs font-semibold hover:bg-[#152747] transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs mt-1"
                        >
                          <span className="material-symbols-outlined text-[15px]">add</span>
                          <span>Add Custom Field</span>
                        </button>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </section>

            {/* ── Right Column (~35% width: 4 cols on lg, Triage & Metadata Panel) ── */}
            <aside className="lg:col-span-4 flex flex-col gap-5">
              {/* Triage & Routing Card */}
              <div className="bg-white rounded-xl shadow-xs border border-[#E5E7EB] p-6 sm:p-7 flex flex-col gap-6">

                {/* Priority Selection */}
                <div className="flex flex-col gap-2" ref={priorityRef}>
                  <label className="text-xs font-semibold text-[#1A1A1A] flex items-center gap-1" htmlFor="ticket-priority">
                    Priority <span className="text-red-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    {(() => {
                      const selectedPriorityColor = selectedPriority
                        ? getPriorityColor(selectedPriority.id, selectedPriority.label || selectedPriority.name)
                        : "#9CA3AF";
                      return (
                        <button
                          type="button"
                          onClick={() => setIsPriorityDropdownOpen((prev) => !prev)}
                          className="w-full h-10 px-3 bg-gray-50/70 border border-[#D1D5DB] rounded-lg text-xs text-left flex items-center justify-between text-[#1A1A1A] focus:outline-none focus:border-[#1F3864] transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{
                                backgroundColor: selectedPriorityColor,
                                boxShadow: `0 0 0 2px ${selectedPriorityColor}33`,
                              }}
                            />
                            <span className="font-semibold truncate">
                              {selectedPriority
                                ? selectedPriority.label || selectedPriority.name
                                : "Select Priority..."}
                            </span>
                          </div>
                          <span className="material-symbols-outlined text-gray-400 text-[18px] pointer-events-none">
                            expand_more
                          </span>
                        </button>
                      );
                    })()}

                    {isPriorityDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1 z-40 bg-white border border-[#E5E7EB] rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-gray-100">
                        {sortedPriorities.map((p) => {
                          const pLabel = p.label || p.name || `Priority #${p.id}`;
                          const pColor = getPriorityColor(p.id, pLabel);
                          return (
                            <div
                              key={p.id}
                              onClick={() => {
                                setSelectedPriorityId(p.id);
                                setIsPriorityDropdownOpen(false);
                              }}
                              className={`p-2.5 text-xs flex items-center justify-between cursor-pointer hover:bg-blue-50 transition-colors ${
                                selectedPriorityId === p.id
                                  ? "bg-blue-50 text-[#1F3864] font-bold"
                                  : "text-[#1A1A1A]"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{
                                    backgroundColor: pColor,
                                    boxShadow: `0 0 0 2px ${pColor}33`,
                                  }}
                                />
                                <span>{pLabel}</span>
                              </div>
                              {selectedPriorityId === p.id && (
                                <span className="material-symbols-outlined text-[16px] text-[#1F3864]">
                                  check
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Initial Status */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-[#1A1A1A]" htmlFor="ticket-status">
                    Workflow Status
                  </label>
                  {(() => {
                    const currentStatusColor = selectedStatus
                      ? getStatusColor(
                          selectedStatus.id,
                          selectedStatus.behavior,
                          selectedStatus.label || selectedStatus.name
                        )
                      : "#3B82F6";
                    return (
                      <div className="w-full h-10 px-3 bg-gray-100/80 border border-[#E5E7EB] rounded-lg text-xs flex items-center justify-between text-[#1A1A1A] cursor-default select-none">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{
                              backgroundColor: currentStatusColor,
                              boxShadow: `0 0 0 2px ${currentStatusColor}33`,
                            }}
                          />
                          <span
                            className="font-bold uppercase tracking-wide text-[11px]"
                            style={{ color: currentStatusColor }}
                          >
                            {selectedStatus?.label || selectedStatus?.name || "Open (Default Team Status)"}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 bg-white px-2 py-0.5 rounded border border-gray-200">
                          Initial State
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* Assignees (Multi-Select Tag Input) */}
                <div className="flex flex-col gap-2" ref={assigneeRef}>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#1A1A1A] flex items-center gap-1">
                      Assignee(s) <span className="text-red-500 font-bold">*</span>
                    </label>
                    <span className="text-[10px] text-gray-400 italic truncate max-w-[200px]">
                      {isLoadingTeamDetails
                        ? "Loading team members..."
                        : selectedTeamIds.length > 1
                        ? `${selectedTeamIds.length} Teams (${availableTeamMembers.length} members)`
                        : primaryTeam?.name
                        ? `${primaryTeam.name} (${availableTeamMembers.length} members)`
                        : "Pick team first"}
                    </span>
                  </div>

                  {/* Selected Assignee Chips */}
                  <div className="flex flex-col gap-2 min-h-[44px]">
                    {selectedAssigneeIds.length === 0 ? (
                      <div className="text-[11px] text-gray-400 py-1.5 italic">
                        No assignee selected yet. Select below.
                      </div>
                    ) : (
                      selectedAssigneeIds.map((userId) => {
                        const member = availableTeamMembers.find((m) => m && m.id === userId);
                        if (!member) return null;
                        const memberName =
                          member.name || `${member.firstName || ""} ${member.lastName || ""}`.trim() || member.email;
                        const teamLabel = member.teamNames && member.teamNames.length > 0 ? member.teamNames.join(", ") : undefined;
                        return (
                          <div
                            key={userId}
                            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200 hover:bg-blue-50/50 transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-6 h-6 rounded-full bg-[#1F3864] text-white text-[10px] flex items-center justify-center font-bold shrink-0">
                                {getInitials(memberName)}
                              </div>
                              <div className="flex flex-col min-w-0 leading-tight">
                                <span className="text-xs font-semibold text-[#1A1A1A] truncate">
                                  {memberName}
                                </span>
                                <div className="flex items-center gap-1.5 text-[10px] text-gray-400 truncate">
                                  <span>{member.email}</span>
                                  {teamLabel && (
                                    <>
                                      <span>•</span>
                                      <span className="text-[#1F3864] font-medium">{teamLabel}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveAssignee(userId)}
                              className="text-gray-400 hover:text-red-600 transition-colors p-1 cursor-pointer"
                              title="Remove assignee"
                            >
                              <span className="material-symbols-outlined text-[15px]">close</span>
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Add Member Dropdown Trigger & Search Input */}
                  <div className="relative mt-0.5">
                    <button
                      type="button"
                      onClick={() => setIsAssigneeDropdownOpen((prev) => !prev)}
                      className="w-full h-9 px-3 bg-white hover:bg-gray-50 border border-dashed border-[#CBD5E1] rounded-lg text-xs text-left flex items-center justify-between text-gray-600 focus:outline-none transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-gray-400">person_add</span>
                        <span>+ Add assignee...</span>
                      </div>
                      <span className="material-symbols-outlined text-gray-400 text-[16px]">
                        expand_more
                      </span>
                    </button>

                    {isAssigneeDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1 z-40 bg-white border border-[#E5E7EB] rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-gray-100">
                        <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
                          <input
                            type="text"
                            value={assigneeSearchQuery}
                            onChange={(e) => setAssigneeSearchQuery(e.target.value)}
                            placeholder="Search assignees..."
                            className="w-full px-2.5 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        {isLoadingTeamDetails ? (
                          <div className="p-3 text-xs text-gray-400 text-center flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-[16px] animate-spin text-[#1F3864]">
                              progress_activity
                            </span>
                            <span>Loading team members...</span>
                          </div>
                        ) : filteredTeamMembers.length === 0 ? (
                          <div className="p-3 text-xs text-gray-400 text-center">
                            {availableTeamMembers.length === 0
                              ? "No assignees available for selected team(s)"
                              : "No matching assignees"}
                          </div>
                        ) : (
                          filteredTeamMembers.map((member) => {
                            if (!member) return null;
                            const isChecked = selectedAssigneeIds.includes(member.id);
                            const nameStr =
                              member.name ||
                              `${member.firstName || ""} ${member.lastName || ""}`.trim() ||
                              member.email;
                            const teamLabel = member.teamNames && member.teamNames.length > 0 ? member.teamNames.join(", ") : undefined;
                            return (
                              <div
                                key={member.id}
                                onClick={() => handleToggleAssignee(member.id)}
                                className={`p-2 text-xs flex items-center justify-between cursor-pointer hover:bg-blue-50 transition-colors ${
                                  isChecked ? "bg-blue-50/70 text-[#1F3864] font-bold" : "text-[#1A1A1A]"
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {}}
                                    className="rounded text-[#1F3864] focus:ring-[#1F3864] w-3.5 h-3.5 shrink-0"
                                  />
                                  <div className="w-5 h-5 rounded-full bg-blue-100 text-[#1F3864] text-[9px] flex items-center justify-center font-bold shrink-0">
                                    {getInitials(nameStr)}
                                  </div>
                                  <div className="flex flex-col truncate min-w-0">
                                    <span className="truncate">{nameStr}</span>
                                    {teamLabel && (
                                      <span className="text-[10px] text-gray-400 font-normal truncate">
                                        {teamLabel}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {isChecked && (
                                  <span className="material-symbols-outlined text-[15px] text-[#1F3864] shrink-0 ml-1">
                                    check
                                  </span>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                </div>


              </div>
            </aside>
          </div>
        </div>

        {/* ── STICKY FOOTER ACTION BAR ── */}
        <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-white/95 backdrop-blur-md border-t border-[#E5E7EB] z-50 px-4 sm:px-6 py-3.5 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
          <div className="max-w-[1200px] mx-auto flex items-center justify-between">
            {/* Draft Auto-saved Indicator */}
            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
              <span className="material-symbols-outlined text-[17px] text-emerald-600">cloud_done</span>
              <span>Draft ready</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="h-9 px-4 rounded-lg border border-[#D1D5DB] text-gray-700 hover:bg-gray-100 text-xs font-semibold transition-colors bg-white shadow-2xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={createTicketMutation.isPending}
                className="h-9 px-5 rounded-lg bg-[#1F3864] hover:bg-[#152747] active:scale-[0.98] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                {createTicketMutation.isPending ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-[18px]">add_task</span>
                )}
                <span>{createTicketMutation.isPending ? "Creating..." : "Create Ticket"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Inline Add Custom Field Modal */}
        <AddFieldModal
          isOpen={isAddFieldModalOpen}
          onClose={() => setIsAddFieldModalOpen(false)}
          onFieldCreated={handleCustomFieldCreated}
          currentTeamId={primaryTeamId}
          currentTeamName={primaryTeam?.name}
        />

        {/* Inline Edit Custom Field Modal */}
        <EditFieldModal
          isOpen={!!fieldToEdit}
          onClose={() => setFieldToEdit(null)}
          field={fieldToEdit}
          onFieldUpdated={handleCustomFieldUpdated}
        />

        {/* Delete Confirmation Modal */}
        {fieldToDelete && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white dark:bg-[#121E30] rounded-xl shadow-2xl border border-gray-100 dark:border-[#1E2D45] p-5 max-w-sm w-full space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Delete Custom Field?</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    "{fieldToDelete.name}" will be retired and no longer available for tickets.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setFieldToDelete(null)}
                  disabled={deleteTicketFieldMutation.isPending}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteField}
                  disabled={deleteTicketFieldMutation.isPending}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {deleteTicketFieldMutation.isPending ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-[15px]">delete</span>
                  )}
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default CreateTicket;
