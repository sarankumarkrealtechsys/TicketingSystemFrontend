import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Check,
  Clock,
  User,
  Users,
  Paperclip,
  MessageSquare,
  History,
  FileText,
  Layers,
  ArrowRightLeft,
  AlertCircle,
  Download,
  Plus,
  Shield,
  Send,
  Loader2,
  ChevronDown,
  Edit3,
  Trash2,
  Search,
  CheckCircle2,
  RotateCw,
} from "lucide-react";
import { useAppSelector } from "@/features/auth/authSlice";
import {
  useTicketDetailQuery,
  useTicketHistoryQuery,
  useTicketTimeEntriesQuery,
  useTicketTimeSummaryQuery,
  useTeamStatusesQuery,
  useGlobalStatusesQuery,
  usePrioritiesQuery,
  useActiveTeamsQuery,
  useSelectedTeamDetailQuery,
  useChangeStatusMutation,
  useChangePriorityMutation,
  useReassignTicketMutation,
  useCloseTicketMutation,
  useAddRemarkMutation,
  useUploadAttachmentMutation,
  useLogTimeMutation,
  useAddCollaboratingTeamMutation,
  useRemoveCollaboratingTeamMutation,
  useCreateSubTicketMutation,
  useUpdateTicketMutation,
  useDeleteTicketMutation,
} from "../api";
import { formatDistanceToNow, format } from "date-fns";
import { TicketStatusItem, PriorityItem, TicketHistoryItem, SubTicketItem } from "../types";
import { TeamItem } from "@/features/team-management/types";
import { PriorityBadge, StatusBadge } from "@/shared/components";
import {
  getPriorityColor,
  getStatusColor,
  getPriorityBadgeClasses,
  getStatusBadgeClasses,
} from "@/features/priority-status-management/colorRegistry";
import {
  DynamicCustomFieldsRenderer,
  AddFieldModal,
  useTicketFieldsQuery,
  TicketFieldDefinition,
} from "@/features/ticket-fields";

interface TicketDetailsOverlayProps {
  ticketId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onSubTicketCreate?: (parentTicketId: number) => void;
  onSelectTicket?: (ticketId: number) => void;
}

const safeFormatDate = (dateVal: any, formatStr = "MMM d, yyyy, h:mm a") => {
  if (!dateVal) return "—";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "—";
    return format(d, formatStr);
  } catch {
    return "—";
  }
};

const safeDistanceToNow = (dateStr?: string | null) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return "just now";
  }
};

const renderCustomFieldValue = (cf: any) => {
  const def = cf.fieldDefinition;
  if (!def) return cf.value || cf.textValue || "—";

  if (def.fieldType === "BOOLEAN") {
    const isTrue = cf.booleanValue === true || cf.value === true || cf.value === "true";
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
          isTrue
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
            : "bg-gray-100 text-gray-700 border border-gray-200"
        }`}
      >
        <span className="material-symbols-outlined text-[13px]">
          {isTrue ? "check" : "close"}
        </span>
        <span>{isTrue ? "Yes" : "No"}</span>
      </span>
    );
  }

  if (def.fieldType === "SELECT") {
    const val = cf.textValue || cf.value;
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
        {val || "—"}
      </span>
    );
  }

  if (def.fieldType === "MULTI_SELECT") {
    const opts = Array.isArray(cf.selectedOptions)
      ? cf.selectedOptions
      : Array.isArray(cf.value)
      ? cf.value
      : [];
    if (opts.length === 0) return "—";
    return (
      <div className="flex flex-wrap gap-1">
        {opts.map((opt: string, i: number) => (
          <span
            key={i}
            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200"
          >
            {opt}
          </span>
        ))}
      </div>
    );
  }

  if (def.fieldType === "DATE" || def.fieldType === "DATETIME") {
    const dateVal = cf.dateValue || cf.value;
    if (!dateVal) return "—";
    try {
      return format(new Date(dateVal), def.fieldType === "DATETIME" ? "PPp" : "PP");
    } catch {
      return String(dateVal);
    }
  }

  if (def.fieldType === "URL") {
    const url = cf.textValue || cf.value;
    if (!url) return "—";
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="text-blue-600 hover:underline flex items-center gap-1 font-mono text-xs"
      >
        <span className="truncate max-w-[200px]">{url}</span>
        <span className="material-symbols-outlined text-[13px]">open_in_new</span>
      </a>
    );
  }

  return String(cf.textValue ?? cf.numberValue ?? cf.decimalValue ?? cf.value ?? "—");
};

const WORK_TYPES = [
  "INVESTIGATION",
  "DEVELOPMENT",
  "BUG_FIX",
  "TESTING",
  "CODE_REVIEW",
  "DEPLOYMENT",
  "COMMUNICATION",
  "DOCUMENTATION",
  "OTHER",
];

export const TicketDetailsOverlay: React.FC<TicketDetailsOverlayProps> = ({
  ticketId,
  isOpen,
  onClose,
  onSubTicketCreate,
  onSelectTicket,
}) => {
  const { user: currentUser, permissions } = useAppSelector((state) => state.auth);

  // Modal states
  const [activeModal, setActiveModal] = useState<
    | "status"
    | "priority"
    | "reassign"
    | "close"
    | "logTime"
    | "addTeam"
    | "createSubTicket"
    | "editTicket"
    | "deleteTicket"
    | "editSubTicket"
    | "deleteSubTicket"
    | null
  >(null);

  // Form states for Edit Ticket Modal
  const [editSummary, setEditSummary] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editRemarks, setEditRemarks] = useState("");

  // Dropdown open states inside modals
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);
  const [isReassignTeamDropdownOpen, setIsReassignTeamDropdownOpen] = useState(false);
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  const [isWorkTypeDropdownOpen, setIsWorkTypeDropdownOpen] = useState(false);
  const [isAddTeamDropdownOpen, setIsAddTeamDropdownOpen] = useState(false);
  const [isSubTicketTeamDropdownOpen, setIsSubTicketTeamDropdownOpen] = useState(false);
  const [isSubTicketPriorityDropdownOpen, setIsSubTicketPriorityDropdownOpen] = useState(false);

  // Search queries in dropdowns
  const [statusSearch, setStatusSearch] = useState("");
  const [prioritySearch, setPrioritySearch] = useState("");
  const [teamSearch, setTeamSearch] = useState("");
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const [addTeamSearch, setAddTeamSearch] = useState("");
  const [subTicketTeamSearch, setSubTicketTeamSearch] = useState("");
  const [subTicketPrioritySearch, setSubTicketPrioritySearch] = useState("");

  // Form states for modals
  const [selectedStatusId, setSelectedStatusId] = useState<number | "">("");
  const [selectedPriorityId, setSelectedPriorityId] = useState<number | "">("");
  const [reassignTeamId, setReassignTeamId] = useState<number | "">("");
  const [reassignAssigneeIds, setReassignAssigneeIds] = useState<number[]>([]);
  const [modalRemarks, setModalRemarks] = useState("");
  const [remarkInput, setRemarkInput] = useState("");
  const [timeMinutes, setTimeMinutes] = useState<number | "">("");
  const [timeWorkType, setTimeWorkType] = useState<string>("INVESTIGATION");
  const [timeNote, setTimeNote] = useState("");
  const [newTeamId, setNewTeamId] = useState<number | "">("");
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  // Real-time sync for priority & status colors
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

  // Form states for Sub-Ticket Modal (Create)
  const [subTicketTeamId, setSubTicketTeamId] = useState<number | "">("");
  const [subTicketSummary, setSubTicketSummary] = useState("");
  const [subTicketDescription, setSubTicketDescription] = useState("");
  const [subTicketPriorityId, setSubTicketPriorityId] = useState<number | "">("");
  const [subTicketAssigneeIds, setSubTicketAssigneeIds] = useState<number[]>([]);
  const [subTicketCustomFields, setSubTicketCustomFields] = useState<Record<number, any>>({});
  const [subTicketCustomFieldErrors, setSubTicketCustomFieldErrors] = useState<Record<number, string>>({});
  const [isSubTicketAddFieldOpen, setIsSubTicketAddFieldOpen] = useState(false);

  // Dynamic custom fields for selected sub-ticket team
  const { data: subTicketAvailableFields = [] } = useTicketFieldsQuery({
    teamId: subTicketTeamId ? Number(subTicketTeamId) : undefined,
    includeInactive: false,
  });

  const handleSubTicketCustomFieldChange = (fieldId: number, val: any) => {
    setSubTicketCustomFields((prev) => ({ ...prev, [fieldId]: val }));
    if (subTicketCustomFieldErrors[fieldId]) {
      setSubTicketCustomFieldErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  const handleSubTicketCustomFieldCreated = (newField: TicketFieldDefinition) => {
    setSubTicketCustomFields((prev) => ({
      ...prev,
      [newField.id]: newField.fieldType === "BOOLEAN" ? false : "",
    }));
    setActionSuccessMsg(`Custom field "${newField.name}" added to sub-ticket!`);
  };

  // Form states for Sub-Ticket Edit / Delete
  const [editingSubTicket, setEditingSubTicket] = useState<SubTicketItem | null>(null);
  const [editSubSummary, setEditSubSummary] = useState("");
  const [editSubDescription, setEditSubDescription] = useState("");
  const [editSubPriorityId, setEditSubPriorityId] = useState<number | "">("");
  const [editSubRemarks, setEditSubRemarks] = useState("");
  const [deletingSubTicket, setDeletingSubTicket] = useState<SubTicketItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Queries
  const {
    data: ticket,
    isLoading: isTicketLoading,
    isFetching: isTicketFetching,
    error: ticketError,
    refetch: refetchTicket,
  } = useTicketDetailQuery(ticketId);

  const { data: historyList = [], refetch: refetchHistory } = useTicketHistoryQuery(ticketId);
  const { data: timeEntries = [], refetch: refetchTimeEntries } = useTicketTimeEntriesQuery(ticketId);
  const { data: timeSummary, refetch: refetchTimeSummary } = useTicketTimeSummaryQuery(ticketId);

  const handleRefresh = async () => {
    await Promise.all([
      refetchTicket(),
      refetchHistory(),
      refetchTimeEntries(),
      refetchTimeSummary(),
    ]);
  };

  const { data: teamStatuses = [] } = useTeamStatusesQuery(ticket?.teamId);
  const { data: globalStatuses = [] } = useGlobalStatusesQuery();
  const { data: priorities = [], refetch: refetchPriorities } = usePrioritiesQuery();
  const { data: allTeams = [] } = useActiveTeamsQuery();
  const { data: selectedTeamDetail } = useSelectedTeamDetailQuery(
    typeof reassignTeamId === "number" ? reassignTeamId : null
  );
  const { data: subTicketTeamDetail } = useSelectedTeamDetailQuery(
    typeof subTicketTeamId === "number" ? subTicketTeamId : null
  );

  // Resolved list of available statuses for ticket, sorted by sortOrder
  const availableStatuses = useMemo(() => {
    const raw =
      teamStatuses && teamStatuses.length > 0
        ? teamStatuses
        : globalStatuses && globalStatuses.length > 0
        ? globalStatuses
        : [];
    return [...raw].sort(
      (a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id - b.id
    );
  }, [teamStatuses, globalStatuses]);

  // Explicitly sort priorities by configured sortOrder
  const sortedPriorities = useMemo(() => {
    return [...priorities].sort(
      (a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id - b.id
    );
  }, [priorities]);

  // Mutations
  const changeStatusMutation = useChangeStatusMutation(ticketId || 0);
  const changePriorityMutation = useChangePriorityMutation(ticketId || 0);
  const reassignMutation = useReassignTicketMutation(ticketId || 0);
  const closeMutation = useCloseTicketMutation(ticketId || 0);
  const addRemarkMutation = useAddRemarkMutation(ticketId || 0);
  const uploadAttachmentMutation = useUploadAttachmentMutation(ticketId || 0);
  const logTimeMutation = useLogTimeMutation(ticketId || 0);
  const addTeamMutation = useAddCollaboratingTeamMutation(ticketId || 0);
  const removeTeamMutation = useRemoveCollaboratingTeamMutation(ticketId || 0);
  const createSubTicketMutation = useCreateSubTicketMutation(ticketId || 0);
  const updateTicketMutation = useUpdateTicketMutation(ticketId || 0);
  const deleteTicketMutation = useDeleteTicketMutation();

  // Capability flags derived from backend computed ticket.actions + RBAC fallback
  const isGlobalUpdate = Boolean(permissions?.["TICKET_UPDATE"]?.includes("GLOBAL"));
  const isCreator = Boolean(
    currentUser?.id &&
      (Number(ticket?.createdById) === Number(currentUser.id) ||
        Number(ticket?.createdBy?.id) === Number(currentUser.id) ||
        (ticket?.parentTicket && Number((ticket.parentTicket as any).createdById) === Number(currentUser.id)))
  );
  const isClosed = ticket?.status?.behavior === "CLOSED";
  const canUpdateTicket = Boolean(!isClosed && (ticket?.actions?.update || isGlobalUpdate || isCreator));

  const canChangeStatus = Boolean(ticket?.actions?.changeStatus);
  const canChangePriority = Boolean(ticket?.actions?.changePriority);
  const canReassign = Boolean(ticket?.actions?.reassign);
  const canClose = Boolean(ticket?.actions?.close);
  const canAddRemark = Boolean(ticket?.actions?.addRemark);
  const canLogTime = Boolean(ticket?.actions?.logTime);
  const canCreateSubTicket = Boolean(ticket?.actions?.createSubticket);
  const canManageAttachments = Boolean(ticket?.actions?.addAttachment);
  const canManageTeams = Boolean(ticket?.actions?.manageTeams);

  // Time logging calculations with fallback to sum of time entries
  const totalMinutesSpent = useMemo(() => {
    if (typeof timeSummary?.totalMinutes === "number" && timeSummary.totalMinutes > 0) {
      return timeSummary.totalMinutes;
    }
    return timeEntries.reduce((acc, te) => acc + (Number(te.minutesSpent) || 0), 0);
  }, [timeSummary?.totalMinutes, timeEntries]);

  const formattedTotalTime = useMemo(() => {
    if (timeSummary?.totalHoursFormatted && timeSummary.totalHoursFormatted !== "0h 0m") {
      return timeSummary.totalHoursFormatted;
    }
    const h = Math.floor(totalMinutesSpent / 60);
    const m = totalMinutesSpent % 60;
    return `${h}h ${m}m`;
  }, [timeSummary?.totalHoursFormatted, totalMinutesSpent]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (activeModal) {
          setActiveModal(null);
        } else if (isOpen) {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, activeModal, onClose]);

  // Clear messages on ticket change
  useEffect(() => {
    setActionSuccessMsg(null);
    setActionErrorMsg(null);
    setActiveModal(null);
  }, [ticketId]);

  // Listen for master data updates across components
  useEffect(() => {
    const handleMasterDataUpdate = () => {
      handleRefresh();
      refetchPriorities();
    };
    window.addEventListener("rts_masterdata_updated", handleMasterDataUpdate);
    return () => {
      window.removeEventListener("rts_masterdata_updated", handleMasterDataUpdate);
    };
  }, []);

  if (!isOpen) return null;

  const handleOpenStatusModal = () => {
    if (ticket) {
      setSelectedStatusId(ticket.statusId);
      setStatusSearch("");
      setIsStatusDropdownOpen(false);
      setModalRemarks("");
      setActionErrorMsg(null);
      setActiveModal("status");
    }
  };

  const handleOpenPriorityModal = () => {
    if (ticket) {
      setSelectedPriorityId(ticket.priorityId);
      setPrioritySearch("");
      setIsPriorityDropdownOpen(false);
      setModalRemarks("");
      setActionErrorMsg(null);
      setActiveModal("priority");
    }
  };

  const handleOpenReassignModal = () => {
    if (ticket) {
      setReassignTeamId(ticket.teamId);
      setReassignAssigneeIds(ticket.assignees.map((a) => a.userId));
      setTeamSearch("");
      setAssigneeSearch("");
      setIsReassignTeamDropdownOpen(false);
      setIsAssigneeDropdownOpen(false);
      setModalRemarks("");
      setActionErrorMsg(null);
      setActiveModal("reassign");
    }
  };

  const handleOpenCloseModal = () => {
    setModalRemarks("");
    setActionErrorMsg(null);
    setActiveModal("close");
  };

  const handleOpenLogTimeModal = () => {
    setTimeMinutes("");
    setTimeWorkType("INVESTIGATION");
    setTimeNote("");
    setIsWorkTypeDropdownOpen(false);
    setActionErrorMsg(null);
    setActiveModal("logTime");
  };

  const handleOpenAddTeamModal = () => {
    setNewTeamId("");
    setAddTeamSearch("");
    setIsAddTeamDropdownOpen(false);
    setActionErrorMsg(null);
    setActiveModal("addTeam");
  };

  const handleOpenCreateSubTicketModal = () => {
    if (ticket) {
      setSubTicketTeamId(ticket.teamId || (allTeams[0]?.id ?? ""));
      setSubTicketSummary("");
      setSubTicketDescription("");
      setSubTicketPriorityId(ticket.priorityId || (priorities[0]?.id ?? ""));
      setSubTicketAssigneeIds([]);
      setSubTicketTeamSearch("");
      setSubTicketPrioritySearch("");
      setIsSubTicketTeamDropdownOpen(false);
      setIsSubTicketPriorityDropdownOpen(false);
      setActionErrorMsg(null);
      setActiveModal("createSubTicket");
    }
  };

  // Submit handlers
  const handleSubmitCreateSubTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketId || !ticket) return;
    if (!subTicketSummary.trim()) {
      setActionErrorMsg("Sub-ticket summary is required.");
      return;
    }
    if (!subTicketTeamId) {
      setActionErrorMsg("Target team is required.");
      return;
    }
    if (!subTicketPriorityId) {
      setActionErrorMsg("Priority level is required.");
      return;
    }

    // Validate required custom fields for sub-ticket
    const missingField = subTicketAvailableFields.find(
      (f) =>
        f.isRequired &&
        f.status === "ACTIVE" &&
        (subTicketCustomFields[f.id] === undefined ||
          subTicketCustomFields[f.id] === null ||
          subTicketCustomFields[f.id] === "" ||
          (Array.isArray(subTicketCustomFields[f.id]) &&
            subTicketCustomFields[f.id].length === 0))
    );
    if (missingField) {
      setActionErrorMsg(`Custom field "${missingField.name}" is required.`);
      setSubTicketCustomFieldErrors((prev) => ({
        ...prev,
        [missingField.id]: "This field is required",
      }));
      return;
    }

    const formattedCustomFields = Object.entries(subTicketCustomFields)
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

    try {
      await createSubTicketMutation.mutateAsync({
        projectId: ticket.projectId,
        teamId: Number(subTicketTeamId),
        summary: subTicketSummary.trim(),
        description: subTicketDescription.trim(),
        priorityId: Number(subTicketPriorityId),
        assigneeIds: subTicketAssigneeIds,
        customFields:
          formattedCustomFields.length > 0 ? formattedCustomFields : undefined,
      });

      setActionSuccessMsg("Sub-ticket created successfully!");
      setSubTicketCustomFields({});
      setActiveModal(null);
      await handleRefresh();
    } catch (err: any) {
      setActionErrorMsg(err?.response?.data?.message || "Failed to create sub-ticket.");
    }
  };

  const handleSubmitStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStatusId) return;
    try {
      await changeStatusMutation.mutateAsync({
        statusId: Number(selectedStatusId),
        remarks: modalRemarks.trim() || undefined,
      });
      setActionSuccessMsg("Status updated successfully");
      setActiveModal(null);
    } catch (err: any) {
      setActionErrorMsg(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleSubmitPriority = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPriorityId) return;
    try {
      await changePriorityMutation.mutateAsync({
        priorityId: Number(selectedPriorityId),
        remarks: modalRemarks.trim() || undefined,
      });
      setActionSuccessMsg("Priority updated successfully");
      setActiveModal(null);
    } catch (err: any) {
      setActionErrorMsg(err.response?.data?.message || "Failed to update priority");
    }
  };

  const handleSubmitReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reassignAssigneeIds.length === 0) {
      setActionErrorMsg("Please select at least one assignee");
      return;
    }
    try {
      await reassignMutation.mutateAsync({
        teamId: reassignTeamId ? Number(reassignTeamId) : undefined,
        assigneeIds: reassignAssigneeIds,
        remarks: modalRemarks.trim() || undefined,
      });
      setActionSuccessMsg("Ticket reassigned successfully");
      setActiveModal(null);
    } catch (err: any) {
      setActionErrorMsg(err.response?.data?.message || "Failed to reassign ticket");
    }
  };

  const handleSubmitClose = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await closeMutation.mutateAsync({
        remarks: modalRemarks.trim() || undefined,
      });
      setActionSuccessMsg("Ticket closed successfully");
      setActiveModal(null);
    } catch (err: any) {
      setActionErrorMsg(err.response?.data?.message || "Failed to close ticket");
    }
  };

  const handleSubmitLogTime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!timeMinutes || Number(timeMinutes) <= 0) {
      setActionErrorMsg("Please enter a valid number of minutes");
      return;
    }
    try {
      await logTimeMutation.mutateAsync({
        minutesSpent: Number(timeMinutes),
        workType: timeWorkType,
        workDate: new Date().toISOString(),
        note: timeNote.trim() || undefined,
      });
      setActionSuccessMsg("Time logged successfully");
      setActiveModal(null);
    } catch (err: any) {
      setActionErrorMsg(err.response?.data?.message || "Failed to log time");
    }
  };

  const handleAddRemark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remarkInput.trim()) return;
    try {
      await addRemarkMutation.mutateAsync({
        remarks: remarkInput.trim(),
      });
      setRemarkInput("");
      setActionSuccessMsg("Remark added");
    } catch (err: any) {
      setActionErrorMsg(err.response?.data?.message || "Failed to add remark");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      await uploadAttachmentMutation.mutateAsync(formData);
      setActionSuccessMsg(`File "${file.name}" uploaded`);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setActionErrorMsg(err.response?.data?.message || "Failed to upload file");
    }
  };

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamId) return;
    try {
      await addTeamMutation.mutateAsync({ teamId: Number(newTeamId) });
      setActionSuccessMsg("Collaborating team added");
      setActiveModal(null);
    } catch (err: any) {
      setActionErrorMsg(err.response?.data?.message || "Failed to add team");
    }
  };

  const handleRemoveTeam = async (teamIdToRemove: number) => {
    try {
      await removeTeamMutation.mutateAsync({ teamId: teamIdToRemove });
      setActionSuccessMsg("Collaborating team removed");
    } catch (err: any) {
      setActionErrorMsg(err.response?.data?.message || "Failed to remove team");
    }
  };

  const handleOpenEditModal = () => {
    if (ticket) {
      setEditSummary(ticket.summary || "");
      setEditDescription(ticket.description || "");
      setEditRemarks("");
      setActionErrorMsg(null);
      setActiveModal("editTicket");
    }
  };

  const handleOpenDeleteModal = () => {
    if (ticket) {
      setActionErrorMsg(null);
      setActiveModal("deleteTicket");
    }
  };

  const handleSubmitEditTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSummary.trim()) {
      setActionErrorMsg("Ticket summary is required.");
      return;
    }
    try {
      await updateTicketMutation.mutateAsync({
        summary: editSummary.trim(),
        description: editDescription.trim(),
        version: ticket?.version,
        remarks: editRemarks.trim() || undefined,
      });
      setActionSuccessMsg("Ticket updated successfully!");
      setActiveModal(null);
      await handleRefresh();
    } catch (err: any) {
      setActionErrorMsg(err?.response?.data?.message || "Failed to update ticket.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!ticketId) return;
    try {
      await deleteTicketMutation.mutateAsync(ticketId);
      setActionSuccessMsg("Ticket deleted successfully!");
      setActiveModal(null);
      onClose();
    } catch (err: any) {
      setActionErrorMsg(err?.response?.data?.message || "Failed to delete ticket.");
    }
  };

  const handleOpenEditSubTicketModal = (st: SubTicketItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingSubTicket(st);
    setEditSubSummary(st.summary || "");
    setEditSubDescription(st.description || "");
    setEditSubPriorityId(st.priorityId || st.priority?.id || "");
    setEditSubRemarks("");
    setActionErrorMsg(null);
    setActiveModal("editSubTicket");
  };

  const handleSubmitEditSubTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubTicket) return;
    if (!editSubSummary.trim()) {
      setActionErrorMsg("Sub-ticket summary is required.");
      return;
    }
    try {
      await updateTicketMutation.mutateAsync({
        ticketId: editingSubTicket.id,
        payload: {
          summary: editSubSummary.trim(),
          description: editSubDescription.trim(),
          priorityId: editSubPriorityId ? Number(editSubPriorityId) : undefined,
          version: editingSubTicket.version,
          remarks: editSubRemarks.trim() || undefined,
        },
      });
      setActionSuccessMsg(`Sub-ticket #${editingSubTicket.ticketNumber} updated successfully!`);
      setActiveModal(null);
      setEditingSubTicket(null);
      await handleRefresh();
    } catch (err: any) {
      setActionErrorMsg(err?.response?.data?.message || "Failed to update sub-ticket.");
    }
  };

  const handleOpenDeleteSubTicketModal = (st: SubTicketItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeletingSubTicket(st);
    setActionErrorMsg(null);
    setActiveModal("deleteSubTicket");
  };

  const handleConfirmDeleteSubTicket = async () => {
    if (!deletingSubTicket) return;
    try {
      await deleteTicketMutation.mutateAsync(deletingSubTicket.id);
      setActionSuccessMsg(`Sub-ticket #${deletingSubTicket.ticketNumber} deleted successfully!`);
      setActiveModal(null);
      setDeletingSubTicket(null);
      await handleRefresh();
    } catch (err: any) {
      setActionErrorMsg(err?.response?.data?.message || "Failed to delete sub-ticket.");
    }
  };

  // Status color styling
  const getStatusBadge = (statusName?: string, behavior?: string, statusId?: number | null) => {
    return getStatusBadgeClasses(statusId, behavior, statusName);
  };

  // Priority color styling
  const getPriorityBadge = (priorityName?: string, priorityId?: number | null) => {
    return getPriorityBadgeClasses(priorityId, priorityName);
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const resolvedSubTicketsCount =
    ticket?.subTickets?.filter(
      (st) =>
        (st.status?.behavior || st.status?.name || "").toUpperCase() === "RESOLVED" ||
        (st.status?.behavior || st.status?.name || "").toUpperCase() === "CLOSED"
    ).length || 0;

  const totalSubTicketsCount = ticket?.subTickets?.length || 0;
  const subTicketProgress =
    totalSubTicketsCount > 0
      ? Math.round((resolvedSubTicketsCount / totalSubTicketsCount) * 100)
      : 0;

  // Selected Status Object
  const currentStatusObj = availableStatuses.find((s) => s.id === selectedStatusId);
  const filteredStatuses = availableStatuses.filter((s) =>
    (s.label || s.name || s.behavior || "").toLowerCase().includes(statusSearch.toLowerCase())
  );

  // Selected Priority Object
  const currentPriorityObj = sortedPriorities.find((p) => p.id === selectedPriorityId);
  const filteredPriorities = sortedPriorities.filter((p) =>
    (p.label || p.name || "").toLowerCase().includes(prioritySearch.toLowerCase())
  );

  // Selected Reassign Team Object
  const currentReassignTeamObj = allTeams.find((t) => t.id === reassignTeamId);
  const filteredReassignTeams = allTeams.filter((t) =>
    t.name.toLowerCase().includes(teamSearch.toLowerCase())
  );

  // Filtered Assignees
  const availableMembers = selectedTeamDetail?.members || [];
  const filteredMembers = availableMembers.filter((m) => {
    const text = `${m.user?.name || ""} ${m.user?.email || ""}`.toLowerCase();
    return text.includes(assigneeSearch.toLowerCase());
  });

  // Toggle Assignee in Reassign Modal
  const handleToggleAssignee = (userId: number) => {
    setReassignAssigneeIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  // Helper to safely parse JSON strings in history values
  const parseJsonSafe = (val?: string | null) => {
    if (!val || typeof val !== "string") return null;
    const trimmed = val.trim();
    if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return null;
    try {
      return JSON.parse(trimmed);
    } catch {
      return null;
    }
  };

  // Audit description formatter helper
  const renderAuditDescription = (h: TicketHistoryItem) => {
    switch (h.action) {
      case "STATUS_CHANGED": {
        const prevLabel =
          h.previousStatus?.label ||
          h.previousBehavior ||
          (h.previousStatusId ? `Status #${h.previousStatusId}` : "Initial");
        const newLabel =
          h.newStatus?.label ||
          h.newBehavior ||
          (h.newStatusId ? `Status #${h.newStatusId}` : "Updated");
        return (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-gray-700">Changed status from</span>
              <StatusBadge
                status={prevLabel}
                statusId={h.previousStatusId || h.previousStatus?.id}
                behavior={h.previousBehavior || h.previousStatus?.behavior}
                size="sm"
              />
              <span className="text-gray-700">to</span>
              <StatusBadge
                status={newLabel}
                statusId={h.newStatusId || h.newStatus?.id}
                behavior={h.newBehavior || h.newStatus?.behavior}
                size="sm"
              />
            </div>
            {h.remarks && (
              <div className="mt-1 text-xs text-gray-700 bg-white border border-slate-200 rounded-md px-3 py-1.5 italic font-medium">
                "{h.remarks}"
              </div>
            )}
          </div>
        );
      }

      case "PRIORITY_CHANGED": {
        const prevLabel =
          h.previousPriority?.label ||
          (h.previousPriorityId ? `Priority #${h.previousPriorityId}` : "None");
        const newLabel =
          h.newPriority?.label ||
          (h.newPriorityId ? `Priority #${h.newPriorityId}` : "Updated");
        return (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-gray-700">Changed priority from</span>
              <PriorityBadge
                priority={prevLabel}
                priorityId={h.previousPriorityId || h.previousPriority?.id}
                size="sm"
              />
              <span className="text-gray-700">to</span>
              <PriorityBadge
                priority={newLabel}
                priorityId={h.newPriorityId || h.newPriority?.id}
                size="sm"
              />
            </div>
            {h.remarks && (
              <div className="mt-1 text-xs text-gray-700 bg-white border border-slate-200 rounded-md px-3 py-1.5 italic font-medium">
                "{h.remarks}"
              </div>
            )}
          </div>
        );
      }

      case "REASSIGNED":
      case "TICKET_REASSIGNED": {
        const parsed = parseJsonSafe(h.newValue);
        return (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-gray-700">Reassigned ticket</span>
              {h.newTeam?.name && (
                <>
                  <span className="text-gray-700">to team</span>
                  <span className="font-extrabold text-[#1F3864] bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                    {h.newTeam.name}
                  </span>
                </>
              )}
              {h.newValue && !h.newTeam?.name && !parsed && (
                <span className="font-bold text-gray-900">{h.newValue}</span>
              )}
            </div>
            {h.remarks && (
              <div className="mt-1 text-xs text-gray-700 bg-white border border-slate-200 rounded-md px-3 py-1.5 italic font-medium">
                "{h.remarks}"
              </div>
            )}
          </div>
        );
      }

      case "TIME_LOGGED": {
        const parsed = parseJsonSafe(h.newValue);
        const minutes =
          parsed?.minutesSpent ??
          (typeof h.newValue === "number" ? h.newValue : null);
        const hours = minutes != null ? Math.floor(minutes / 60) : 0;
        const mins = minutes != null ? minutes % 60 : 0;
        const timeFormatted =
          minutes != null
            ? hours > 0
              ? `${hours}h ${mins}m`
              : `${mins}m`
            : null;
        const workType = parsed?.workType
          ? parsed.workType.replace(/_/g, " ").toLowerCase()
          : null;
        const note = parsed?.note || h.remarks;

        return (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-gray-700 font-semibold">Logged work:</span>
              {timeFormatted ? (
                <span className="font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 text-xs inline-flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-emerald-700" />
                  <span>
                    {timeFormatted}
                    {workType ? ` (${workType})` : ""}
                  </span>
                </span>
              ) : (
                <span className="font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                  Time logged
                </span>
              )}
            </div>
            {note && (
              <div className="mt-1 text-xs text-gray-700 bg-white border border-slate-200 rounded-md px-3 py-1.5 font-medium">
                "{note}"
              </div>
            )}
          </div>
        );
      }

      case "REMARK_ADDED": {
        return (
          <div className="flex flex-col gap-1.5">
            <span className="text-gray-700 font-semibold">Added remark:</span>
            {h.remarks && (
              <div className="mt-0.5 text-xs text-gray-800 bg-white border border-slate-200 rounded-md p-3 italic font-medium whitespace-pre-wrap leading-relaxed">
                "{h.remarks}"
              </div>
            )}
          </div>
        );
      }

      case "ATTACHMENT_UPLOADED":
      case "ATTACHMENT_ADDED": {
        const parsed = parseJsonSafe(h.newValue);
        const fileName = parsed?.originalFileName || parsed?.fileName || (!parsed && h.newValue) || h.remarks || "File uploaded";
        return (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-gray-700">Uploaded attachment:</span>
            <span className="font-bold text-[#1F3864] bg-white px-2.5 py-0.5 rounded border border-slate-200">
              {fileName}
            </span>
          </div>
        );
      }

      case "ATTACHMENT_DELETED":
      case "ATTACHMENT_REMOVED": {
        const parsed = parseJsonSafe(h.previousValue || h.newValue);
        const fileName = parsed?.originalFileName || parsed?.fileName || (!parsed && (h.previousValue || h.newValue)) || h.remarks || "File removed";
        return (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-gray-700">Deleted attachment:</span>
            <span className="font-bold text-red-900 bg-red-50 px-2.5 py-0.5 rounded border border-red-200">
              {fileName}
            </span>
          </div>
        );
      }

      case "COLLABORATING_TEAM_ADDED": {
        return (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-gray-700">Added collaborating team:</span>
            <span className="font-bold text-[#1F3864] bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
              {h.newTeam?.name || h.newValue || "Team"}
            </span>
          </div>
        );
      }

      case "COLLABORATING_TEAM_REMOVED": {
        return (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-gray-700">Removed collaborating team:</span>
            <span className="font-bold text-gray-800 bg-gray-100 px-2.5 py-0.5 rounded border border-gray-200">
              {h.previousTeam?.name || h.previousValue || "Team"}
            </span>
          </div>
        );
      }

      case "TICKET_CREATED":
      case "CREATED": {
        return (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-gray-900">Ticket created</span>
            {h.remarks && <span className="text-gray-600 font-medium">({h.remarks})</span>}
          </div>
        );
      }

      case "TICKET_CLOSED":
      case "CLOSED": {
        return (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-extrabold text-red-900 bg-red-50 px-2.5 py-0.5 rounded border border-red-200">
                Closed ticket
              </span>
            </div>
            {h.remarks && (
              <div className="mt-1 text-xs text-gray-700 bg-white border border-slate-200 rounded-md px-3 py-1.5 italic font-medium">
                "{h.remarks}"
              </div>
            )}
          </div>
        );
      }

      case "SUB_TICKET_CREATED": {
        return (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-gray-700">Created sub-ticket:</span>
            <span className="font-bold text-[#1F3864] bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
              {h.newValue || h.remarks || "Sub-ticket"}
            </span>
          </div>
        );
      }

      default: {
        if (h.fieldName) {
          return (
            <span>
              Updated <strong className="text-gray-900">{h.fieldName}</strong> from{" "}
              <span className="text-gray-700 font-semibold">{h.oldValue || "none"}</span> to{" "}
              <span className="text-gray-900 font-bold">{h.newValue || "none"}</span>
            </span>
          );
        }
        const parsed = parseJsonSafe(h.newValue);
        const displayVal = parsed ? (parsed.note || parsed.name || parsed.label || "") : h.newValue;
        return (
          <div className="flex flex-col gap-1">
            <span className="font-bold text-gray-900">
              {h.action.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
            </span>
            {displayVal && <span className="text-gray-700 text-xs">{displayVal}</span>}
            {h.remarks && (
              <div className="mt-1 text-xs text-gray-700 bg-white border border-slate-200 rounded-md px-3 py-1.5 italic font-medium">
                "{h.remarks}"
              </div>
            )}
          </div>
        );
      }
    }
  };

  return createPortal(
    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[9999] m-0 p-0 flex justify-end overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 top-0 left-0 right-0 bottom-0 bg-[#0c1626]/50 backdrop-blur-sm transition-opacity duration-200 cursor-pointer"
        onClick={onClose}
        aria-label="Close Ticket Details"
      />

      {/* Slide-in Drawer */}
      <aside
        className="relative z-50 w-full max-w-[840px] bg-white shadow-2xl flex flex-col h-full top-0 right-0 bottom-0 m-0 transform transition-transform duration-200 ease-out"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ticket-drawer-title"
      >
        {/* TOP HEADER */}
        <header className="border-b border-gray-200 bg-white px-6 pt-5 pb-4 flex-shrink-0">
          <div className="flex items-center justify-between gap-4 mb-2.5">
            {/* Ticket ID & Display Badges (Static) */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center px-3 py-1 rounded text-xs font-mono font-bold bg-blue-50 text-[#1F3864] border border-blue-200 shadow-xs">
                {ticket?.ticketNumber || `#${ticketId}`}
              </span>

              {/* Status Badge */}
              {ticket?.status && (
                <StatusBadge
                  status={(ticket.status as any).label || ticket.status.name || ticket.status.behavior}
                  statusId={ticket.status.id}
                  behavior={ticket.status.behavior}
                  size="md"
                />
              )}

              {/* Priority Badge */}
              {ticket?.priority && (
                <PriorityBadge
                  priority={(ticket.priority as any).label || ticket.priority.name}
                  priorityId={ticket.priority.id}
                  size="md"
                />
              )}
            </div>

            {/* Utility buttons */}
            <div className="flex items-center gap-1.5 text-gray-700">
              {/* Refresh Button */}
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isTicketFetching}
                className="p-1.5 rounded-md hover:bg-gray-100 hover:text-[#1F3864] transition text-gray-700 hover:text-gray-900 disabled:opacity-50 cursor-pointer"
                title="Refresh Ticket Details"
              >
                <RotateCw className={`w-4 h-4 ${isTicketFetching ? "animate-spin text-[#1F3864]" : ""}`} />
              </button>

              <div className="h-4 w-[1px] bg-gray-300 mx-1" />

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-md hover:bg-red-50 hover:text-red-700 text-gray-700 transition cursor-pointer"
                title="Close Drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Parent Ticket Reference Banner (if viewing a sub-ticket) */}
          {ticket?.parentTicket && (
            <div
              onClick={() => onSelectTicket ? onSelectTicket(ticket.parentTicket!.id) : undefined}
              className={`mt-1.5 inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-md text-xs font-bold text-[#1F3864] transition ${
                onSelectTicket ? "hover:bg-blue-100 cursor-pointer" : ""
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#1F3864]" />
              <span>Parent Ticket: <strong>{ticket.parentTicket.ticketNumber}</strong> — {ticket.parentTicket.summary}</span>
            </div>
          )}

          {/* Ticket Title / Summary (Bold & Prominent) */}
          <div className="flex items-center justify-between gap-3 mt-1">
            <h2
              id="ticket-drawer-title"
              className="text-xl font-extrabold text-gray-900 tracking-tight leading-snug line-clamp-2"
            >
              {ticket?.summary || (isTicketLoading ? "Loading ticket..." : "Ticket Details")}
            </h2>
            {canUpdateTicket && (
              <button
                type="button"
                onClick={handleOpenEditModal}
                className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-[#1F3864] bg-blue-50/80 hover:bg-blue-100 border border-blue-200/80 rounded-md transition shadow-2xs cursor-pointer"
                title="Edit Ticket Details"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            )}
          </div>

          {/* Action Success / Error Notifications */}
          {actionSuccessMsg && (
            <div className="mt-3 py-2 px-3.5 bg-emerald-50 border border-emerald-200 rounded-md flex items-center justify-between text-xs font-medium text-emerald-800">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{actionSuccessMsg}</span>
              </div>
              <button
                onClick={() => setActionSuccessMsg(null)}
                className="text-emerald-600 hover:text-emerald-900 text-sm leading-none font-bold"
              >
                ×
              </button>
            </div>
          )}

          {actionErrorMsg && (
            <div className="mt-3 py-2 px-3.5 bg-red-50 border border-red-200 rounded-md flex items-center justify-between text-xs font-medium text-red-800">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{actionErrorMsg}</span>
              </div>
              <button
                onClick={() => setActionErrorMsg(null)}
                className="text-red-600 hover:text-red-900 text-sm leading-none font-bold"
              >
                ×
              </button>
            </div>
          )}

          {/* PROMINENT ACTION TOOLBAR */}
          <div className="mt-3.5 pt-3 border-t border-gray-100 flex items-center justify-between gap-2 overflow-x-auto pb-1">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Edit Ticket Action */}
              {canUpdateTicket && (
                <button
                  type="button"
                  onClick={handleOpenEditModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-900 bg-sky-50/90 border border-sky-200 rounded-md hover:bg-sky-100 hover:border-sky-300 transition shadow-xs cursor-pointer"
                  title="Edit Ticket Details"
                >
                  <Edit3 className="w-3.5 h-3.5 text-sky-700" />
                  <span>Edit Ticket</span>
                </button>
              )}

              {/* Change Status Action */}
              {canChangeStatus && (
                <button
                  type="button"
                  onClick={handleOpenStatusModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1F3864] bg-blue-50/80 border border-blue-200 rounded-md hover:bg-blue-100 hover:border-blue-300 transition shadow-xs cursor-pointer"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-[#1F3864]" />
                  <span>Change Status</span>
                </button>
              )}

              {/* Change Priority Action */}
              {canChangePriority && (
                <button
                  type="button"
                  onClick={handleOpenPriorityModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-50/80 border border-amber-200 rounded-md hover:bg-amber-100 hover:border-amber-300 transition shadow-xs cursor-pointer"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                  <span>Change Priority</span>
                </button>
              )}

              {/* Reassign Action (Admin or Creator with TICKET_REASSIGN) */}
              {canReassign && (
                <button
                  type="button"
                  onClick={handleOpenReassignModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-900 bg-purple-50/80 border border-purple-200 rounded-md hover:bg-purple-100 hover:border-purple-300 transition shadow-xs cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5 text-purple-700" />
                  <span>Reassign</span>
                </button>
              )}

              {/* + Sub-Ticket */}
              {canCreateSubTicket && (
                <button
                  type="button"
                  onClick={handleOpenCreateSubTicketModal}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#1F3864] bg-blue-50/80 border border-blue-200 rounded-md hover:bg-blue-100 transition shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#1F3864]" />
                  <span>Sub-Ticket</span>
                </button>
              )}

              {/* Log Time */}
              {canLogTime && (
                <button
                  type="button"
                  onClick={handleOpenLogTimeModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-emerald-50/80 border border-emerald-200 rounded-md hover:bg-emerald-100 hover:border-emerald-300 transition shadow-xs cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Log Time</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {/* Close Ticket (Danger Action) */}
              {canClose && (
                <button
                  type="button"
                  onClick={handleOpenCloseModal}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#D32F2F] hover:bg-[#b71c1c] rounded-md shadow-xs transition cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Close Ticket</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* SCROLLABLE BODY */}
        <main className="flex-1 overflow-y-auto px-6 py-5 space-y-5 bg-slate-50/70">
          {isTicketLoading ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-600 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#1F3864]" />
              <p className="text-xs font-bold text-gray-700">Loading ticket details...</p>
            </div>
          ) : ticketError ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-xs flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>Failed to load ticket details. Please try again.</span>
            </div>
          ) : ticket ? (
            <>
              {/* SECTION 1: Basic Information */}
              <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F3864] flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#1F3864]" />
                    <span>Basic Information</span>
                  </h3>
                  <span className="text-xs font-semibold text-gray-600">
                    Created {safeDistanceToNow(ticket.createdAt)}
                  </span>
                </div>

                {/* Key Fields Grid (Bigger & Bolder Dark Text) */}
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 mt-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-700 block mb-1">
                      Project
                    </span>
                    <span className="font-extrabold text-sm text-[#1F3864]">
                      {ticket.project?.name || "—"}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-700 block mb-1">
                      Team
                    </span>
                    <span className="font-extrabold text-sm text-gray-900">
                      {ticket.team?.name || "—"}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-700 block mb-1">
                      Created By
                    </span>
                    <div className="flex items-center gap-2.5 mt-1">
                      <div className="w-7 h-7 rounded-full bg-slate-800 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                        {getInitials(ticket.createdBy?.name || ticket.createdBy?.username)}
                      </div>
                      <div>
                        <span className="font-bold text-sm text-gray-900 block leading-tight">
                          {ticket.createdBy?.name || ticket.createdBy?.username || "—"}
                        </span>
                        <span className="text-gray-600 font-medium text-xs block mt-0.5">
                          {ticket.createdBy?.email} • {safeFormatDate(ticket.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-700 block mb-1">
                      Last Updated
                    </span>
                    <div className="font-bold text-sm text-gray-900 mt-1">
                      {safeDistanceToNow(ticket.updatedAt)}
                    </div>
                  </div>
                </div>

                {/* Description (Bold & High Contrast) */}
                <div className="mt-4 pt-3.5 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-gray-700 block">
                      Description
                    </label>
                    {canUpdateTicket && (
                      <button
                        type="button"
                        onClick={handleOpenEditModal}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1F3864] hover:text-blue-800 hover:underline cursor-pointer"
                        title="Edit Description"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4 text-sm font-bold text-gray-900 leading-relaxed border border-slate-200 whitespace-pre-wrap font-sans">
                    {ticket.description || "No description provided."}
                  </div>
                </div>
              </section>

              {/* SECTION 2: Assignees & Collaborators */}
              <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F3864] pb-3 border-b border-gray-100 flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#1F3864]" />
                  <span>Assignees &amp; Collaborators</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {/* Primary Assignee Card */}
                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#1F3864] text-white text-xs font-bold flex items-center justify-center ring-2 ring-blue-100 flex-shrink-0">
                        {getInitials(
                          ticket.assignees?.[0]?.user?.name ||
                            ticket.assignees?.[0]?.user?.username
                        )}
                      </div>
                      <div>
                        <span className="text-[11px] uppercase font-extrabold text-gray-700 block tracking-wider">
                          Primary Assignee
                        </span>
                        <span className="font-bold text-sm text-[#1F3864] block">
                          {ticket.assignees?.[0]?.user?.name ||
                            ticket.assignees?.[0]?.user?.username ||
                            "Unassigned"}
                        </span>
                        <span className="text-xs text-gray-600 font-medium block">
                          {ticket.assignees?.[0]?.user?.email || "No assignee"}
                        </span>
                      </div>
                    </div>
                    {canReassign && (
                      <button
                        type="button"
                        onClick={handleOpenReassignModal}
                        className="text-xs font-bold text-[#2E74B5] hover:underline px-2 py-1 cursor-pointer"
                      >
                        Reassign
                      </button>
                    )}
                  </div>

                  {/* Collaborating Teams Card */}
                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] uppercase font-extrabold text-gray-700 tracking-wider">
                        Collaborating Teams
                      </span>
                      {canManageTeams && (
                        <span className="text-[10px] text-blue-700 bg-blue-100 px-2 py-0.5 rounded font-mono font-bold">
                          Admin
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {ticket.collaboratingTeams && ticket.collaboratingTeams.length > 0 ? (
                        ticket.collaboratingTeams.map((ct) => (
                          <span
                            key={ct.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold bg-white border border-gray-300 text-gray-800 shadow-2xs"
                          >
                            <span>{ct.team.name}</span>
                            {canManageTeams && (
                              <button
                                type="button"
                                onClick={() => handleRemoveTeam(ct.teamId)}
                                className="text-gray-500 hover:text-red-700 font-bold ml-0.5 cursor-pointer"
                                title="Remove team"
                              >
                                ×
                              </button>
                            )}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-600 font-medium italic">No collaborating teams</span>
                      )}

                      {canManageTeams && (
                        <button
                          type="button"
                          onClick={handleOpenAddTeamModal}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold border border-dashed border-gray-400 text-[#1F3864] hover:border-[#1F3864] hover:bg-white transition cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Team</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* SECTION 3: Custom Fields (if any) */}
              {ticket.customFieldValues && ticket.customFieldValues.length > 0 && (
                <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F3864] pb-3 border-b border-gray-100 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#1F3864]" />
                    <span>Custom Fields</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-4">
                    {ticket.customFieldValues.map((cf) => (
                      <div
                        key={cf.id}
                        className="p-3 bg-slate-50 rounded-lg border border-slate-200"
                      >
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-700 block mb-1">
                          {cf.fieldDefinition?.name || `Field #${cf.fieldDefinitionId}`}
                        </span>
                        <div className="text-xs font-bold text-gray-900">
                          {renderCustomFieldValue(cf)}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* SECTION 4: Sub-Tickets (Dedicated Standalone Card) */}
              <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 flex-wrap gap-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F3864] flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#1F3864]" />
                      <span>Sub-Tickets ({totalSubTicketsCount})</span>
                    </h3>
                    {totalSubTicketsCount > 0 && (
                      <span className="text-xs font-bold text-gray-800 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded">
                        {resolvedSubTicketsCount} of {totalSubTicketsCount} Resolved ({subTicketProgress}%)
                      </span>
                    )}
                  </div>

                  {canCreateSubTicket && (
                    <button
                      type="button"
                      onClick={handleOpenCreateSubTicketModal}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1F3864] bg-blue-50/90 border border-blue-200 px-3 py-1.5 rounded-md hover:bg-blue-100 hover:border-blue-300 transition shadow-2xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create Sub-Ticket</span>
                    </button>
                  )}
                </div>

                {totalSubTicketsCount > 0 ? (
                  <>
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-4 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${subTicketProgress}%` }}
                      />
                    </div>

                    {/* Sub-Tickets List */}
                    <div className="mt-4 space-y-3">
                      {ticket.subTickets.map((st: any) => {
                        const assigneeNames =
                          st.assignees && st.assignees.length > 0
                            ? st.assignees
                                .map((a: any) => a.user?.name || a.user?.username)
                                .filter(Boolean)
                                .join(", ")
                            : null;

                        const priorityLabel =
                          st.priority?.label || st.priority?.name || null;
                        const statusLabel =
                          st.status?.label || st.status?.name || st.status?.behavior || "Open";

                        return (
                          <div
                            key={st.id}
                            onClick={() => (onSelectTicket ? onSelectTicket(st.id) : undefined)}
                            className={`p-3.5 bg-slate-50/90 hover:bg-blue-50/40 rounded-xl border border-slate-200 hover:border-blue-300 transition-all duration-150 flex flex-col gap-2.5 group shadow-2xs ${
                              onSelectTicket ? "cursor-pointer" : ""
                            }`}
                          >
                            {/* Card Header: Number, Summary, Badges */}
                            <div className="flex items-start justify-between gap-2.5 flex-wrap">
                              <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
                                <span className="font-mono font-bold text-[#1F3864] text-xs bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200 shrink-0">
                                  {st.ticketNumber}
                                </span>
                                <span className="text-gray-900 font-bold text-xs group-hover:text-[#1F3864] transition-colors line-clamp-1">
                                  {st.summary}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {priorityLabel && (
                                  <PriorityBadge
                                    priority={priorityLabel}
                                    priorityId={st.priority?.id}
                                    size="sm"
                                  />
                                )}
                                <StatusBadge
                                  status={statusLabel}
                                  statusId={st.status?.id}
                                  behavior={st.status?.behavior}
                                  size="sm"
                                />
                              </div>
                            </div>

                            {/* Card Body: Description snippet (if available) */}
                            {st.description && (
                              <p className="text-[11.5px] text-gray-600 line-clamp-2 leading-relaxed bg-white/80 p-2.5 rounded-lg border border-slate-200/80 font-medium">
                                {st.description}
                              </p>
                            )}

                            {/* Card Footer: Team, Assignees, Created Date, Actions */}
                            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/70 text-[11px] text-gray-500 flex-wrap">
                              <div className="flex items-center gap-3 flex-wrap">
                                {st.team?.name && (
                                  <span className="flex items-center gap-1 font-semibold text-gray-700">
                                    <span className="material-symbols-outlined text-[14px] text-[#1F3864]">
                                      corporate_fare
                                    </span>
                                    <span>{st.team.name}</span>
                                  </span>
                                )}

                                {assigneeNames ? (
                                  <span className="flex items-center gap-1 font-medium text-gray-700">
                                    <span className="material-symbols-outlined text-[14px] text-blue-600">
                                      person
                                    </span>
                                    <span>{assigneeNames}</span>
                                  </span>
                                ) : (
                                  <span className="text-gray-400 italic font-medium">Unassigned</span>
                                )}

                                {st.createdAt && (
                                  <span className="flex items-center gap-1 text-gray-400 font-medium">
                                    <span className="material-symbols-outlined text-[14px]">
                                      schedule
                                    </span>
                                    <span>{safeDistanceToNow(st.createdAt)}</span>
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {(st.actions?.update || canUpdateTicket) && (
                                  <button
                                    type="button"
                                    onClick={(e) => handleOpenEditSubTicketModal(st, e)}
                                    className="p-1 rounded hover:bg-slate-200 text-gray-500 hover:text-[#1F3864] transition cursor-pointer"
                                    title="Edit Sub-Ticket"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {onSelectTicket && (
                                  <span className="text-[11px] font-bold text-[#1F3864] group-hover:text-blue-700 flex items-center gap-0.5 ml-1">
                                    <span>View Details</span>
                                    <span className="material-symbols-outlined text-[14px] group-hover:translate-x-0.5 transition-transform">
                                      arrow_forward
                                    </span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="py-6 text-center text-xs">
                    <p className="font-bold text-gray-800 text-sm">No sub-tickets created yet.</p>
                    <p className="text-gray-600 font-medium mt-1">
                      Break down complex deliverables into smaller, focused sub-tasks across teams.
                    </p>
                  </div>
                )}
              </section>

              {/* SECTION 5: Attachments */}
              <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F3864] flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-[#1F3864]" />
                    <span>Attachments ({ticket.attachments?.length || 0})</span>
                  </h3>
                  {canManageAttachments && (
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#1F3864] hover:text-[#2E74B5] cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Upload File</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-xs">
                  {ticket.attachments && ticket.attachments.length > 0 ? (
                    ticket.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-slate-50 hover:bg-slate-100 transition"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-8 h-8 rounded bg-blue-100 text-[#1F3864] flex items-center justify-center font-mono text-[10px] font-bold">
                            {(att.fileExtension || "FILE").toUpperCase().replace(".", "")}
                          </div>
                          <div className="truncate">
                            <span className="font-bold text-gray-900 block truncate">
                              {att.originalFileName}
                            </span>
                            <span className="text-xs text-gray-600 font-medium">
                              {Math.round(att.fileSizeBytes / 1024)} KB •{" "}
                              {att.uploadedBy?.name || "User"}
                            </span>
                          </div>
                        </div>
                        <a
                          href={`/api/tickets/${ticket.id}/attachments/${att.id}/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-gray-600 hover:text-[#1F3864] transition"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 text-xs text-gray-600 font-medium italic py-2">
                      No attachments uploaded.
                    </div>
                  )}
                </div>
              </section>

              {/* SECTION 6: Time Logged */}
              <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F3864] flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#1F3864]" />
                      <span>Time Logged</span>
                    </h3>
                    <span className="text-xs font-extrabold text-gray-900 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded">
                      Total: {formattedTotalTime}
                    </span>
                  </div>
                  {canLogTime && (
                    <button
                      type="button"
                      onClick={handleOpenLogTimeModal}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#1F3864] hover:text-[#2E74B5] cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Log Time</span>
                    </button>
                  )}
                </div>

                <div className="mt-3 divide-y divide-gray-100 text-xs">
                  {timeEntries.length > 0 ? (
                    timeEntries.map((te) => (
                      <div key={te.id} className="py-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1F3864]" />
                          <span className="font-bold text-gray-900">
                            {te.user?.name || te.user?.username || "Assignee"}
                          </span>
                          <span className="text-gray-700 font-medium">
                            — {te.workType} {te.note ? `: ${te.note}` : ""}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-gray-900">
                          {Math.floor(te.minutesSpent / 60)}h {te.minutesSpent % 60}m
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-gray-600 font-medium italic py-2">No time entries logged yet.</div>
                  )}
                </div>
              </section>

              {/* SECTION 7: Remarks & Discussion */}
              <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F3864] pb-3 border-b border-gray-100 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#1F3864]" />
                  <span>Remarks &amp; Discussion</span>
                </h3>

                {canAddRemark && (
                  <form onSubmit={handleAddRemark} className="mt-4">
                    <textarea
                      value={remarkInput}
                      onChange={(e) => setRemarkInput(e.target.value)}
                      placeholder="Add an internal remark, technical note, or update..."
                      rows={3}
                      className="w-full text-xs font-medium rounded-lg border-gray-300 focus:border-[#1F3864] focus:ring-[#1F3864] placeholder:text-gray-500 shadow-xs p-3 text-gray-900"
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs font-semibold text-gray-600">Enter technical remark</span>
                      <button
                        type="submit"
                        disabled={!remarkInput.trim() || addRemarkMutation.isPending}
                        className="px-4 py-1.5 bg-[#1F3864] hover:bg-[#162847] text-white text-xs font-bold rounded-md shadow-xs transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                      >
                        {addRemarkMutation.isPending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        <span>Add Remark</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* Remarks feed */}
                <div className="mt-4 space-y-3 pt-3 border-t border-gray-100">
                  {historyList.filter((h) => h.remarks).length > 0 ? (
                    historyList
                      .filter((h) => h.remarks)
                      .map((h) => {
                        const userName =
                          h.updatedBy?.name ||
                          h.updatedBy?.username ||
                          h.user?.name ||
                          h.user?.username ||
                          "System";
                        return (
                          <div key={h.id} className="flex gap-3 text-xs">
                            <div className="w-7 h-7 rounded-full bg-[#1F3864] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                              {getInitials(userName)}
                            </div>
                            <div className="flex-1 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="font-bold text-[#1F3864]">{userName}</span>
                                <span className="text-xs font-semibold text-gray-600">
                                  {safeDistanceToNow(h.updatedAt || h.createdAt)}
                                </span>
                              </div>
                              <p className="text-gray-900 font-medium leading-relaxed whitespace-pre-wrap">
                                {h.remarks}
                              </p>
                            </div>
                          </div>
                        );
                      })
                  ) : (
                    <div className="text-xs text-gray-600 font-medium italic py-2">No remarks posted yet.</div>
                  )}
                </div>
              </section>

              {/* SECTION 8: Audit Trail / History */}
              <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F3864] pb-3 border-b border-gray-100 flex items-center gap-2">
                  <History className="w-4 h-4 text-[#1F3864]" />
                  <span>Audit Trail &amp; History</span>
                </h3>

                <ol className="relative border-l-2 border-slate-200 ml-3.5 mt-5 space-y-4 text-xs">
                  {historyList.map((h, idx) => {
                    const userName =
                      h.updatedBy?.name ||
                      h.updatedBy?.username ||
                      h.user?.name ||
                      h.user?.username ||
                      "System Admin";
                    return (
                      <li key={h.id || idx} className="relative pl-6">
                        <div className="absolute -left-[7px] top-3 w-3 h-3 bg-[#1F3864] ring-4 ring-slate-100 rounded-full" />
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2 shadow-2xs">
                          <div className="text-gray-900 leading-snug">
                            {renderAuditDescription(h)}
                          </div>
                          <div className="text-[11px] font-semibold text-gray-500 flex items-center gap-1.5 pt-1.5 border-t border-slate-200">
                            <span>by <strong className="text-gray-800 font-bold">{userName}</strong></span>
                            <span>•</span>
                            <span>{safeFormatDate(h.updatedAt || h.createdAt)}</span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                  {historyList.length === 0 && (
                    <li className="pl-6 text-xs text-gray-500 font-medium italic">No history records found.</li>
                  )}
                </ol>
              </section>
            </>
          ) : null}
        </main>

        {/* DRAWER FOOTER */}
        <footer className="border-t border-gray-200 bg-white px-6 py-3 flex items-center justify-between flex-shrink-0 text-xs">
          <div className="text-gray-600 text-xs font-mono font-bold">
            {ticket?.ticketNumber} • RTS Help Desk
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 border border-gray-300 hover:bg-gray-50 text-gray-900 font-bold rounded-md transition cursor-pointer"
          >
            Close Drawer
          </button>
        </footer>

        {/* ========================================================================= */}
        {/* MODALS / DIALOGS WITH CUSTOM TEAM-STYLE DROPDOWNS                        */}
        {/* ========================================================================= */}

        {/* 1. Change Status Modal */}
        {activeModal === "status" && (
          <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-[#1F3864]" />
                  <span>Change Status</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitStatus} className="mt-4 space-y-4">
                {/* Custom Status Dropdown */}
                <div className="relative">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Select New Status <span className="text-red-500">*</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setIsStatusDropdownOpen((prev) => !prev)}
                    className="w-full min-h-[42px] px-3 py-2 bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg text-xs text-left flex items-center justify-between gap-2 focus:outline-none focus:border-[#1F3864] focus:ring-1 focus:ring-[#1F3864] transition cursor-pointer"
                  >
                    {currentStatusObj ? (
                      <StatusBadge
                        status={currentStatusObj.label || currentStatusObj.name || currentStatusObj.behavior}
                        statusId={currentStatusObj.id}
                        behavior={currentStatusObj.behavior}
                        size="sm"
                      />
                    ) : (
                      <span className="text-gray-400 font-medium">Select status...</span>
                    )}
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>

                  {isStatusDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white border border-gray-200 rounded-xl shadow-2xl p-2.5 space-y-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={statusSearch}
                          onChange={(e) => setStatusSearch(e.target.value)}
                          placeholder="Search status..."
                          className="w-full h-8 pl-8 pr-3 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-900 focus:outline-none focus:border-[#1F3864]"
                        />
                      </div>

                      <div className="max-h-52 overflow-y-auto space-y-1 divide-y divide-gray-50">
                        {filteredStatuses.length === 0 ? (
                          <div className="p-3 text-xs text-gray-400 text-center">
                            No status options found
                          </div>
                        ) : (
                          filteredStatuses.map((s) => {
                            const isSelected = selectedStatusId === s.id;
                            const label = s.label || s.name || s.behavior || `Status #${s.id}`;
                            return (
                              <div
                                key={s.id}
                                onClick={() => {
                                  setSelectedStatusId(s.id);
                                  setIsStatusDropdownOpen(false);
                                }}
                                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                                  isSelected
                                    ? "bg-blue-50 text-[#1F3864] font-bold"
                                    : "hover:bg-gray-50 text-gray-800"
                                }`}
                              >
                                <StatusBadge
                                  status={label}
                                  statusId={s.id}
                                  behavior={s.behavior}
                                  size="sm"
                                />

                                {isSelected && (
                                  <Check className="w-4 h-4 text-[#1F3864]" />
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Remarks (Optional)
                  </label>
                  <textarea
                    value={modalRemarks}
                    onChange={(e) => setModalRemarks(e.target.value)}
                    placeholder="Provide context for status change..."
                    rows={2}
                    className="w-full text-xs rounded-lg border-gray-300 focus:border-[#1F3864] focus:ring-[#1F3864] p-2.5"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedStatusId || changeStatusMutation.isPending}
                    className="px-4 py-1.5 bg-[#1F3864] hover:bg-[#162847] text-white text-xs font-bold rounded shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {changeStatusMutation.isPending && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    )}
                    <span>Update Status</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 2. Change Priority Modal */}
        {activeModal === "priority" && (
          <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-700" />
                  <span>Change Priority</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitPriority} className="mt-4 space-y-4">
                {/* Custom Priority Dropdown */}
                <div className="relative">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Select New Priority <span className="text-red-500">*</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setIsPriorityDropdownOpen((prev) => !prev)}
                    className="w-full min-h-[42px] px-3 py-2 bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg text-xs text-left flex items-center justify-between gap-2 focus:outline-none focus:border-[#1F3864] focus:ring-1 focus:ring-[#1F3864] transition cursor-pointer"
                  >
                    {currentPriorityObj ? (
                      <PriorityBadge
                        priority={currentPriorityObj.label || currentPriorityObj.name}
                        priorityId={currentPriorityObj.id}
                        size="sm"
                      />
                    ) : (
                      <span className="text-gray-400 font-medium">Select priority...</span>
                    )}
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>

                  {isPriorityDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white border border-gray-200 rounded-xl shadow-2xl p-2.5 space-y-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={prioritySearch}
                          onChange={(e) => setPrioritySearch(e.target.value)}
                          placeholder="Search priority..."
                          className="w-full h-8 pl-8 pr-3 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-900 focus:outline-none focus:border-[#1F3864]"
                        />
                      </div>

                      <div className="max-h-52 overflow-y-auto space-y-1 divide-y divide-gray-50">
                        {filteredPriorities.length === 0 ? (
                          <div className="p-3 text-xs text-gray-400 text-center">
                            No priority options found
                          </div>
                        ) : (
                          filteredPriorities.map((p) => {
                            const isSelected = selectedPriorityId === p.id;
                            const label = p.label || p.name || `Priority #${p.id}`;
                            return (
                              <div
                                key={p.id}
                                onClick={() => {
                                  setSelectedPriorityId(p.id);
                                  setIsPriorityDropdownOpen(false);
                                }}
                                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                                  isSelected
                                    ? "bg-blue-50/70 text-[#1F3864] font-bold"
                                    : "hover:bg-gray-50 text-gray-800"
                                }`}
                              >
                                <PriorityBadge
                                  priority={label}
                                  priorityId={p.id}
                                  size="sm"
                                />

                                {isSelected && (
                                  <Check className="w-4 h-4 text-[#1F3864]" />
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Remarks (Optional)
                  </label>
                  <textarea
                    value={modalRemarks}
                    onChange={(e) => setModalRemarks(e.target.value)}
                    placeholder="Reason for priority adjustment..."
                    rows={2}
                    className="w-full text-xs rounded-lg border-gray-300 focus:border-[#1F3864] focus:ring-[#1F3864] p-2.5"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedPriorityId || changePriorityMutation.isPending}
                    className="px-4 py-1.5 bg-[#1F3864] hover:bg-[#162847] text-white text-xs font-bold rounded shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {changePriorityMutation.isPending && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    )}
                    <span>Update Priority</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 3. Reassign Modal (Admin) with Custom Team & Assignee Dropdowns */}
        {activeModal === "reassign" && (
          <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-700" />
                  <span>Reassign Ticket</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitReassign} className="mt-4 space-y-4">
                {/* Custom Team Dropdown */}
                <div className="relative">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Primary Team <span className="text-red-500">*</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setIsReassignTeamDropdownOpen((prev) => !prev)}
                    className="w-full min-h-[42px] px-3 py-2 bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg text-xs text-left flex items-center justify-between gap-2 focus:outline-none focus:border-[#1F3864] focus:ring-1 focus:ring-[#1F3864] transition cursor-pointer"
                  >
                    <span className="font-bold text-gray-900">
                      {currentReassignTeamObj?.name || "Select team..."}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>

                  {isReassignTeamDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white border border-gray-200 rounded-xl shadow-2xl p-2.5 space-y-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={teamSearch}
                          onChange={(e) => setTeamSearch(e.target.value)}
                          placeholder="Search teams..."
                          className="w-full h-8 pl-8 pr-3 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-900 focus:outline-none focus:border-[#1F3864]"
                        />
                      </div>

                      <div className="max-h-48 overflow-y-auto space-y-1 divide-y divide-gray-50">
                        {filteredReassignTeams.map((t) => {
                          const isSelected = reassignTeamId === t.id;
                          return (
                            <div
                              key={t.id}
                              onClick={() => {
                                setReassignTeamId(t.id);
                                setReassignAssigneeIds([]);
                                setIsReassignTeamDropdownOpen(false);
                              }}
                              className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                                isSelected
                                  ? "bg-purple-50 text-purple-900 font-bold"
                                  : "hover:bg-gray-50 text-gray-800"
                              }`}
                            >
                              <span>{t.name}</span>
                              {isSelected && <Check className="w-4 h-4 text-purple-700" />}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Custom Multi-Select Assignee Dropdown */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-gray-700">
                      Assignees <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] text-gray-400">
                      {reassignAssigneeIds.length} selected
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAssigneeDropdownOpen((prev) => !prev)}
                    className="w-full min-h-[42px] px-3 py-2 bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg text-xs text-left flex items-center justify-between gap-2 focus:outline-none focus:border-[#1F3864] focus:ring-1 focus:ring-[#1F3864] transition cursor-pointer"
                  >
                    <div className="flex flex-wrap gap-1.5 items-center flex-1">
                      {reassignAssigneeIds.length === 0 ? (
                        <span className="text-gray-400 font-medium">Select assignee(s)...</span>
                      ) : (
                        reassignAssigneeIds.map((uid) => {
                          const m = availableMembers.find((item) => item.userId === uid);
                          const name = m?.user?.name || m?.user?.email || `User #${uid}`;
                          return (
                            <span
                              key={uid}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-blue-50 border border-blue-200 text-[#1F3864]"
                            >
                              <span>{name}</span>
                            </span>
                          );
                        })
                      )}
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </button>

                  {isAssigneeDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white border border-gray-200 rounded-xl shadow-2xl p-2.5 space-y-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={assigneeSearch}
                          onChange={(e) => setAssigneeSearch(e.target.value)}
                          placeholder="Search members..."
                          className="w-full h-8 pl-8 pr-3 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-900 focus:outline-none focus:border-[#1F3864]"
                        />
                      </div>

                      <div className="max-h-48 overflow-y-auto space-y-1 divide-y divide-gray-50">
                        {filteredMembers.length === 0 ? (
                          <div className="p-3 text-xs text-gray-400 text-center">
                            No members found in this team
                          </div>
                        ) : (
                          filteredMembers.map((m) => {
                            const isChecked = reassignAssigneeIds.includes(m.userId);
                            const name = m.user?.name || m.user?.email || `User #${m.userId}`;
                            const roleName = m.user?.userRole?.name;

                            return (
                              <div
                                key={m.userId}
                                onClick={() => handleToggleAssignee(m.userId)}
                                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition"
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className="w-6 h-6 rounded-full bg-[#1F3864] text-white text-[10px] font-bold flex items-center justify-center">
                                    {getInitials(name)}
                                  </div>
                                  <div>
                                    <span className="font-bold text-xs text-gray-900 block leading-tight">
                                      {name}
                                    </span>
                                    <span className="text-[10px] text-gray-400">
                                      {m.user?.email} {roleName ? `• ${roleName}` : ""}
                                    </span>
                                  </div>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}}
                                  className="rounded text-[#1F3864] focus:ring-[#1F3864] h-4 w-4 pointer-events-none"
                                />
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Remarks (Optional)
                  </label>
                  <textarea
                    value={modalRemarks}
                    onChange={(e) => setModalRemarks(e.target.value)}
                    placeholder="Reason for reassignment..."
                    rows={2}
                    className="w-full text-xs rounded-lg border-gray-300 focus:border-[#1F3864] focus:ring-[#1F3864] p-2.5"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reassignAssigneeIds.length === 0 || reassignMutation.isPending}
                    className="px-4 py-1.5 bg-[#1F3864] hover:bg-[#162847] text-white text-xs font-bold rounded shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {reassignMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Confirm Reassignment</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 4. Close Ticket Confirmation Modal */}
        {activeModal === "close" && (
          <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="font-bold text-sm text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>Close Ticket</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitClose} className="mt-4 space-y-4">
                <p className="text-xs text-gray-600">
                  Are you sure you want to mark this ticket as Closed?
                </p>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Closing Remarks (Optional)
                  </label>
                  <textarea
                    value={modalRemarks}
                    onChange={(e) => setModalRemarks(e.target.value)}
                    placeholder="Summary of resolution or closing notes..."
                    rows={2}
                    className="w-full text-xs rounded-lg border-gray-300 focus:border-[#1F3864] focus:ring-[#1F3864] p-2.5"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={closeMutation.isPending}
                    className="px-4 py-1.5 bg-[#D32F2F] hover:bg-[#b71c1c] text-white text-xs font-bold rounded shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {closeMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Confirm Close</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 5. Log Time Modal with Custom Work Type Dropdown */}
        {activeModal === "logTime" && (
          <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-700" />
                  <span>Log Time</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitLogTime} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Minutes Spent <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={timeMinutes}
                    onChange={(e) => setTimeMinutes(Number(e.target.value))}
                    placeholder="e.g. 60"
                    required
                    className="w-full text-xs font-bold rounded-lg border-gray-300 focus:border-[#1F3864] focus:ring-[#1F3864] p-2.5"
                  />
                </div>

                {/* Custom Work Type Dropdown */}
                <div className="relative">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Work Type <span className="text-red-500">*</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setIsWorkTypeDropdownOpen((prev) => !prev)}
                    className="w-full min-h-[42px] px-3 py-2 bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg text-xs text-left flex items-center justify-between gap-2 focus:outline-none focus:border-[#1F3864] focus:ring-1 focus:ring-[#1F3864] transition cursor-pointer"
                  >
                    <span className="font-bold text-gray-900">{timeWorkType}</span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>

                  {isWorkTypeDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white border border-gray-200 rounded-xl shadow-2xl p-2 max-h-48 overflow-y-auto space-y-1 divide-y divide-gray-50">
                      {WORK_TYPES.map((wt) => {
                        const isSelected = timeWorkType === wt;
                        return (
                          <div
                            key={wt}
                            onClick={() => {
                              setTimeWorkType(wt);
                              setIsWorkTypeDropdownOpen(false);
                            }}
                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                              isSelected
                                ? "bg-emerald-50 text-emerald-900 font-bold"
                                : "hover:bg-gray-50 text-gray-800"
                            }`}
                          >
                            <span>{wt}</span>
                            {isSelected && <Check className="w-4 h-4 text-emerald-700" />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Note (Optional)
                  </label>
                  <textarea
                    value={timeNote}
                    onChange={(e) => setTimeNote(e.target.value)}
                    placeholder="Work details..."
                    rows={2}
                    className="w-full text-xs rounded-lg border-gray-300 focus:border-[#1F3864] focus:ring-[#1F3864] p-2.5"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!timeMinutes || logTimeMutation.isPending}
                    className="px-4 py-1.5 bg-[#1F3864] hover:bg-[#162847] text-white text-xs font-bold rounded shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {logTimeMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Save Entry</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 6. Add Collaborating Team Modal (Admin) */}
        {activeModal === "addTeam" && (
          <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#1F3864]" />
                  <span>Add Collaborating Team</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddTeam} className="mt-4 space-y-4">
                <div className="relative">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Select Team <span className="text-red-500">*</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setIsAddTeamDropdownOpen((prev) => !prev)}
                    className="w-full min-h-[42px] px-3 py-2 bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg text-xs text-left flex items-center justify-between gap-2 focus:outline-none focus:border-[#1F3864] focus:ring-1 focus:ring-[#1F3864] transition cursor-pointer"
                  >
                    <span className="font-bold text-gray-900">
                      {allTeams.find((t) => t.id === newTeamId)?.name || "Select team..."}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>

                  {isAddTeamDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white border border-gray-200 rounded-xl shadow-2xl p-2.5 space-y-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={addTeamSearch}
                          onChange={(e) => setAddTeamSearch(e.target.value)}
                          placeholder="Search teams..."
                          className="w-full h-8 pl-8 pr-3 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-900 focus:outline-none focus:border-[#1F3864]"
                        />
                      </div>

                      <div className="max-h-48 overflow-y-auto space-y-1 divide-y divide-gray-50">
                        {allTeams
                          .filter(
                            (t) =>
                              t.id !== ticket?.teamId &&
                              !ticket?.collaboratingTeams?.some((ct) => ct.teamId === t.id) &&
                              t.name.toLowerCase().includes(addTeamSearch.toLowerCase())
                          )
                          .map((t) => {
                            const isSelected = newTeamId === t.id;
                            return (
                              <div
                                key={t.id}
                                onClick={() => {
                                  setNewTeamId(t.id);
                                  setIsAddTeamDropdownOpen(false);
                                }}
                                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                                  isSelected
                                    ? "bg-blue-50 text-[#1F3864] font-bold"
                                    : "hover:bg-gray-50 text-gray-800"
                                }`}
                              >
                                <span>{t.name}</span>
                                {isSelected && <Check className="w-4 h-4 text-[#1F3864]" />}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newTeamId || addTeamMutation.isPending}
                    className="px-4 py-1.5 bg-[#1F3864] hover:bg-[#162847] text-white text-xs font-bold rounded shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {addTeamMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Add Team</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 7. Create Sub-Ticket Modal (In-Overlay Dedicated Dialog) */}
        {activeModal === "createSubTicket" && (
          <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#1F3864]" />
                  <h3 className="font-bold text-sm text-gray-900">Create Sub-Ticket</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Linked Parent Banner */}
              <div className="mt-3.5 p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs flex items-center gap-2 text-[#1F3864]">
                <Layers className="w-4 h-4 flex-shrink-0" />
                <div>
                  <span className="font-extrabold">Parent Ticket:</span> {ticket?.ticketNumber} • {ticket?.summary}
                </div>
              </div>

              <form onSubmit={handleSubmitCreateSubTicket} className="mt-4 space-y-4">
                {/* Summary */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Sub-Ticket Summary <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={subTicketSummary}
                    onChange={(e) => setSubTicketSummary(e.target.value)}
                    placeholder="e.g. Purchase display replacement panel"
                    required
                    className="w-full h-9 px-3 bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg text-xs text-gray-900 focus:outline-none focus:border-[#1F3864]"
                  />
                </div>

                {/* Target Team Dropdown */}
                <div className="relative">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Assign to Team <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsSubTicketTeamDropdownOpen((prev) => !prev)}
                    className="w-full min-h-[38px] px-3 py-2 bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg text-xs text-left flex items-center justify-between gap-2 focus:outline-none focus:border-[#1F3864] cursor-pointer"
                  >
                    <span className="font-bold text-gray-900">
                      {allTeams.find((t) => t.id === subTicketTeamId)?.name || "Select team..."}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>

                  {isSubTicketTeamDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white border border-gray-200 rounded-xl shadow-2xl p-2.5 space-y-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={subTicketTeamSearch}
                          onChange={(e) => setSubTicketTeamSearch(e.target.value)}
                          placeholder="Search teams..."
                          className="w-full h-8 pl-8 pr-3 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-900 focus:outline-none focus:border-[#1F3864]"
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-1 divide-y divide-gray-50">
                        {allTeams
                          .filter((t) => t.name.toLowerCase().includes(subTicketTeamSearch.toLowerCase()))
                          .map((t) => {
                            const isSelected = subTicketTeamId === t.id;
                            return (
                              <div
                                key={t.id}
                                onClick={() => {
                                  setSubTicketTeamId(t.id);
                                  setSubTicketAssigneeIds([]);
                                  setIsSubTicketTeamDropdownOpen(false);
                                }}
                                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                                  isSelected ? "bg-blue-50 text-[#1F3864] font-bold" : "hover:bg-gray-50 text-gray-800"
                                }`}
                              >
                                <div>
                                  <span className="font-bold text-xs">{t.name}</span>
                                  {t.department?.name && (
                                    <span className="text-[10px] text-gray-500 block">{t.department.name}</span>
                                  )}
                                </div>
                                {isSelected && <Check className="w-4 h-4 text-[#1F3864]" />}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Priority Dropdown */}
                <div className="relative">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Priority <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsSubTicketPriorityDropdownOpen((prev) => !prev)}
                    className="w-full min-h-[38px] px-3 py-2 bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg text-xs text-left flex items-center justify-between gap-2 focus:outline-none focus:border-[#1F3864] cursor-pointer"
                  >
                    {sortedPriorities.find((p) => p.id === subTicketPriorityId) ? (
                      <PriorityBadge
                        priority={sortedPriorities.find((p) => p.id === subTicketPriorityId)?.label}
                        priorityId={subTicketPriorityId ? Number(subTicketPriorityId) : undefined}
                        size="sm"
                      />
                    ) : (
                      <span className="text-gray-400 font-medium">Select priority...</span>
                    )}
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>

                  {isSubTicketPriorityDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white border border-gray-200 rounded-xl shadow-2xl p-2.5 space-y-1">
                      {sortedPriorities.map((p) => {
                        const isSelected = subTicketPriorityId === p.id;
                        return (
                          <div
                            key={p.id}
                            onClick={() => {
                              setSubTicketPriorityId(p.id);
                              setIsSubTicketPriorityDropdownOpen(false);
                            }}
                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                              isSelected ? "bg-blue-50 text-[#1F3864] font-bold" : "hover:bg-gray-50 text-gray-800"
                            }`}
                          >
                            <PriorityBadge
                              priority={p.label || p.name}
                              priorityId={p.id}
                              size="sm"
                            />
                            {isSelected && <Check className="w-4 h-4 text-[#1F3864]" />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Assignees Selection */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Assignees (Team Members)
                  </label>
                  <div className="border border-gray-200 rounded-lg p-2.5 max-h-36 overflow-y-auto space-y-1.5 bg-[#F9FAFB]">
                    {(subTicketTeamDetail?.members || []).length > 0 ? (
                      (subTicketTeamDetail?.members || []).map((m: any) => {
                        const userId = m.user?.id || m.userId;
                        const isChecked = subTicketAssigneeIds.includes(userId);
                        return (
                          <label
                            key={userId}
                            className="flex items-center gap-2 p-1.5 hover:bg-white rounded cursor-pointer transition text-xs"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() =>
                                setSubTicketAssigneeIds((prev) =>
                                  prev.includes(userId)
                                    ? prev.filter((id) => id !== userId)
                                    : [...prev, userId]
                                )
                              }
                              className="w-3.5 h-3.5 rounded text-[#1F3864] focus:ring-[#1F3864]"
                            />
                            <span className="font-bold text-gray-900">{m.user?.name || m.user?.username}</span>
                            <span className="text-gray-500 font-medium">({m.user?.email})</span>
                          </label>
                        );
                      })
                    ) : (
                      <div className="text-xs text-gray-500 italic p-1">No active members found in this team.</div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Description / Scope
                  </label>
                  <textarea
                    value={subTicketDescription}
                    onChange={(e) => setSubTicketDescription(e.target.value)}
                    placeholder="Specify requirements for this sub-task..."
                    rows={3}
                    className="w-full p-2.5 bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg text-xs text-gray-900 focus:outline-none focus:border-[#1F3864]"
                  />
                </div>

                {/* Dynamic Custom Fields for Sub-Ticket */}
                {subTicketTeamId && (
                  <div className="pt-1">
                    <DynamicCustomFieldsRenderer
                      fields={subTicketAvailableFields}
                      values={subTicketCustomFields}
                      onChange={handleSubTicketCustomFieldChange}
                      onOpenAddFieldModal={() => setIsSubTicketAddFieldOpen(true)}
                      teamName={allTeams.find((t) => t.id === subTicketTeamId)?.name}
                      errors={subTicketCustomFieldErrors}
                      compact={true}
                      sectionNumber=""
                    />
                  </div>
                )}

                {/* Form Actions */}
                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-md transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!subTicketSummary.trim() || !subTicketTeamId || !subTicketPriorityId || createSubTicketMutation.isPending}
                    className="px-4 py-1.5 bg-[#1F3864] hover:bg-[#162847] text-white text-xs font-bold rounded-md shadow-xs transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    {createSubTicketMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Create Sub-Ticket</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Inline Add Custom Field Modal for Sub-Ticket */}
        <AddFieldModal
          isOpen={isSubTicketAddFieldOpen}
          onClose={() => setIsSubTicketAddFieldOpen(false)}
          onFieldCreated={handleSubTicketCustomFieldCreated}
          currentTeamId={subTicketTeamId ? Number(subTicketTeamId) : null}
          currentTeamName={allTeams.find((t) => t.id === subTicketTeamId)?.name}
        />

        {/* ================= MODAL: EDIT TICKET ================= */}
        {activeModal === "editTicket" && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={(e) => {
              if (e.target === e.currentTarget) setActiveModal(null);
            }}
          >
            <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-sky-100 rounded-lg text-sky-800">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Edit Ticket Details</h3>
                    <p className="text-[11px] text-gray-500 font-mono">#{ticket?.ticketNumber}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {actionErrorMsg && (
                <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-800 font-medium">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{actionErrorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmitEditTicket} className="p-4 space-y-4">
                {/* Summary */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Summary <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editSummary}
                    onChange={(e) => setEditSummary(e.target.value)}
                    placeholder="Ticket summary..."
                    required
                    className="w-full h-9 px-3 bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg text-xs font-medium text-gray-900 focus:outline-none focus:border-[#1F3864]"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Full description of the issue or request..."
                    rows={4}
                    className="w-full p-2.5 bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg text-xs font-medium text-gray-900 focus:outline-none focus:border-[#1F3864]"
                  />
                </div>

                {/* Optional Update Remarks */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Update Remarks <span className="text-gray-400 font-normal">(Optional audit note)</span>
                  </label>
                  <input
                    type="text"
                    value={editRemarks}
                    onChange={(e) => setEditRemarks(e.target.value)}
                    placeholder="Reason for changes..."
                    className="w-full h-9 px-3 bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg text-xs text-gray-900 focus:outline-none focus:border-[#1F3864]"
                  />
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-md transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!editSummary.trim() || updateTicketMutation.isPending}
                    className="px-4 py-1.5 bg-[#1F3864] hover:bg-[#162847] text-white text-xs font-bold rounded-md shadow-xs transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    {updateTicketMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================= MODAL: DELETE TICKET CONFIRMATION ================= */}
        {activeModal === "deleteTicket" && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={(e) => {
              if (e.target === e.currentTarget) setActiveModal(null);
            }}
          >
            <div className="bg-white rounded-xl shadow-2xl border border-red-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
              <div className="p-4 border-b border-red-100 flex items-center justify-between bg-red-50/70">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-red-100 rounded-lg text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-red-900">Delete Ticket</h3>
                    <p className="text-[11px] text-red-700 font-mono">#{ticket?.ticketNumber}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-3">
                <p className="text-xs text-gray-800 font-medium leading-relaxed">
                  Are you sure you want to permanently delete ticket{" "}
                  <span className="font-bold text-gray-900">
                    #{ticket?.ticketNumber} — "{ticket?.summary}"
                  </span>
                  ?
                </p>

                <div className="p-3 bg-red-50/60 border border-red-200/80 rounded-lg text-[11.5px] text-red-800 leading-relaxed space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    <span>Warning: Irreversible Action</span>
                  </div>
                  <p className="text-red-700 font-medium">
                    This will permanently delete this ticket along with all its attachments, time entries, history logs, and custom fields.
                  </p>
                </div>

                {actionErrorMsg && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-800 font-medium">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{actionErrorMsg}</span>
                  </div>
                )}

                {/* Modal Actions */}
                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 mt-4">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    disabled={deleteTicketMutation.isPending}
                    className="px-3.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-md transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    disabled={deleteTicketMutation.isPending}
                    className="px-4 py-1.5 bg-[#D32F2F] hover:bg-[#b71c1c] text-white text-xs font-bold rounded-md shadow-xs transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    {deleteTicketMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Delete Permanently</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= MODAL: EDIT SUB-TICKET ================= */}
        {activeModal === "editSubTicket" && editingSubTicket && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setActiveModal(null);
                setEditingSubTicket(null);
              }
            }}
          >
            <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-sky-100 rounded-lg text-sky-800">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Edit Sub-Ticket</h3>
                    <p className="text-[11px] text-gray-500 font-mono">#{editingSubTicket.ticketNumber} (Parent: #{ticket?.ticketNumber})</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveModal(null);
                    setEditingSubTicket(null);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {actionErrorMsg && (
                <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-800 font-medium">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{actionErrorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmitEditSubTicket} className="p-4 space-y-4">
                {/* Summary */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Summary <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editSubSummary}
                    onChange={(e) => setEditSubSummary(e.target.value)}
                    placeholder="Sub-ticket summary..."
                    required
                    className="w-full h-9 px-3 bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg text-xs font-medium text-gray-900 focus:outline-none focus:border-[#1F3864]"
                  />
                </div>

                {/* Priority Level */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Priority</label>
                  <select
                    value={editSubPriorityId}
                    onChange={(e) => setEditSubPriorityId(e.target.value ? Number(e.target.value) : "")}
                    className="w-full h-9 px-3 bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg text-xs font-medium text-gray-900 focus:outline-none focus:border-[#1F3864]"
                  >
                    {sortedPriorities.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label || p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                  <textarea
                    value={editSubDescription}
                    onChange={(e) => setEditSubDescription(e.target.value)}
                    placeholder="Sub-ticket description..."
                    rows={3}
                    className="w-full p-2.5 bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg text-xs font-medium text-gray-900 focus:outline-none focus:border-[#1F3864]"
                  />
                </div>

                {/* Optional Update Remarks */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Update Remarks <span className="text-gray-400 font-normal">(Optional audit note)</span>
                  </label>
                  <input
                    type="text"
                    value={editSubRemarks}
                    onChange={(e) => setEditSubRemarks(e.target.value)}
                    placeholder="Reason for changes..."
                    className="w-full h-9 px-3 bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg text-xs text-gray-900 focus:outline-none focus:border-[#1F3864]"
                  />
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveModal(null);
                      setEditingSubTicket(null);
                    }}
                    className="px-3.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-md transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!editSubSummary.trim() || updateTicketMutation.isPending}
                    className="px-4 py-1.5 bg-[#1F3864] hover:bg-[#162847] text-white text-xs font-bold rounded-md shadow-xs transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    {updateTicketMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Save Sub-Ticket</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================= MODAL: DELETE SUB-TICKET CONFIRMATION ================= */}
        {activeModal === "deleteSubTicket" && deletingSubTicket && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setActiveModal(null);
                setDeletingSubTicket(null);
              }
            }}
          >
            <div className="bg-white rounded-xl shadow-2xl border border-red-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
              <div className="p-4 border-b border-red-100 flex items-center justify-between bg-red-50/70">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-red-100 rounded-lg text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-red-900">Delete Sub-Ticket</h3>
                    <p className="text-[11px] text-red-700 font-mono">#{deletingSubTicket.ticketNumber}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveModal(null);
                    setDeletingSubTicket(null);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-3">
                <p className="text-xs text-gray-800 font-medium leading-relaxed">
                  Are you sure you want to permanently delete sub-ticket{" "}
                  <span className="font-bold text-gray-900">
                    #{deletingSubTicket.ticketNumber} — "{deletingSubTicket.summary}"
                  </span>
                  ?
                </p>

                <div className="p-3 bg-red-50/60 border border-red-200/80 rounded-lg text-[11.5px] text-red-800 leading-relaxed space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    <span>Warning: Irreversible Action</span>
                  </div>
                  <p className="text-red-700 font-medium">
                    This will permanently delete this sub-ticket and update parent resolution progress.
                  </p>
                </div>

                {actionErrorMsg && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-800 font-medium">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{actionErrorMsg}</span>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveModal(null);
                      setDeletingSubTicket(null);
                    }}
                    disabled={deleteTicketMutation.isPending}
                    className="px-3.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-md transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDeleteSubTicket}
                    disabled={deleteTicketMutation.isPending}
                    className="px-4 py-1.5 bg-[#D32F2F] hover:bg-[#b71c1c] text-white text-xs font-bold rounded-md shadow-xs transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    {deleteTicketMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Delete Sub-Ticket</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>,
    document.body
  );
};

export default TicketDetailsOverlay;
