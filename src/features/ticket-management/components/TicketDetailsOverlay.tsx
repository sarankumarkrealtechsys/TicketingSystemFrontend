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
} from "../api";
import { formatDistanceToNow, format } from "date-fns";
import { TicketStatusItem, PriorityItem, TicketHistoryItem } from "../types";
import { TeamItem } from "@/features/team-management/types";

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

const safeDistanceToNow = (dateVal: any) => {
  if (!dateVal) return "just now";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "just now";
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return "just now";
  }
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
  const currentUser = useAppSelector((state) => state.auth.user);

  // Modal states
  const [activeModal, setActiveModal] = useState<
    "status" | "priority" | "reassign" | "close" | "logTime" | "addTeam" | "createSubTicket" | null
  >(null);

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

  // Form states for Sub-Ticket Modal
  const [subTicketTeamId, setSubTicketTeamId] = useState<number | "">("");
  const [subTicketSummary, setSubTicketSummary] = useState("");
  const [subTicketDescription, setSubTicketDescription] = useState("");
  const [subTicketPriorityId, setSubTicketPriorityId] = useState<number | "">("");
  const [subTicketAssigneeIds, setSubTicketAssigneeIds] = useState<number[]>([]);

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
  const { data: priorities = [] } = usePrioritiesQuery();
  const { data: allTeams = [] } = useActiveTeamsQuery();
  const { data: selectedTeamDetail } = useSelectedTeamDetailQuery(
    typeof reassignTeamId === "number" ? reassignTeamId : null
  );
  const { data: subTicketTeamDetail } = useSelectedTeamDetailQuery(
    typeof subTicketTeamId === "number" ? subTicketTeamId : null
  );

  // Resolved list of available statuses for ticket
  const availableStatuses = useMemo(() => {
    if (teamStatuses && teamStatuses.length > 0) return teamStatuses;
    if (globalStatuses && globalStatuses.length > 0) return globalStatuses;
    return [];
  }, [teamStatuses, globalStatuses]);

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

  // Permission evaluation (Admin, Creator, or Assignee)
  const isUserAdmin = (currentUser?.role?.name || "").toUpperCase() === "ADMIN";
  const isUserCreator = Number(currentUser?.id) === Number(ticket?.createdById);
  const isUserAssignee = ticket?.assignees?.some(
    (a) => Number(a.userId) === Number(currentUser?.id)
  );

  // Status changes on any ticket/sub-ticket strictly locked to its assigned workers & Admins
  const canChangeStatus =
    isUserAdmin || isUserAssignee || Boolean(ticket?.actions?.canChangeStatus && isUserAssignee);
  const canChangePriority = isUserAdmin;
  const canReassign = isUserAdmin || isUserCreator || Boolean(ticket?.actions?.canReassign);
  const canClose =
    (isUserAdmin && ticket?.status?.behavior !== "CLOSED") ||
    (isUserAssignee && ticket?.status?.behavior === "RESOLVED") ||
    Boolean(ticket?.actions?.canClose);
  const canAddRemark =
    isUserAdmin || isUserCreator || isUserAssignee || Boolean(ticket?.actions?.canAddRemark);
  const canLogTime =
    isUserAdmin || isUserAssignee || Boolean(ticket?.actions?.canLogTime);
  const canCreateSubTicket =
    isUserAdmin || isUserCreator || isUserAssignee || Boolean(ticket?.actions?.canCreateSubTicket);
  const canManageAttachments =
    isUserAdmin || isUserCreator || isUserAssignee || Boolean(ticket?.actions?.canManageAttachments);
  const canManageTeams = isUserAdmin || Boolean(ticket?.actions?.canManageTeams);

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

    try {
      await createSubTicketMutation.mutateAsync({
        projectId: ticket.projectId,
        teamId: Number(subTicketTeamId),
        summary: subTicketSummary.trim(),
        description: subTicketDescription.trim(),
        priorityId: Number(subTicketPriorityId),
        assigneeIds: subTicketAssigneeIds,
      });

      setActionSuccessMsg("Sub-ticket created successfully!");
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

  // Status color styling
  const getStatusBadge = (statusName?: string, behavior?: string) => {
    const b = (behavior || statusName || "").toUpperCase();
    if (b.includes("OPEN")) {
      return "bg-blue-100 text-blue-900 border-blue-300";
    }
    if (b.includes("IN_PROGRESS") || b.includes("PROGRESS")) {
      return "bg-amber-100 text-amber-900 border-amber-300";
    }
    if (b.includes("ON_HOLD") || b.includes("HOLD")) {
      return "bg-purple-100 text-purple-900 border-purple-300";
    }
    if (b.includes("RESOLVED")) {
      return "bg-emerald-100 text-emerald-900 border-emerald-300";
    }
    if (b.includes("CLOSED")) {
      return "bg-gray-200 text-gray-900 border-gray-400";
    }
    return "bg-slate-100 text-slate-900 border-slate-300";
  };

  // Priority color styling
  const getPriorityBadge = (priorityName?: string) => {
    const p = (priorityName || "").toUpperCase();
    if (p.includes("URGENT") || p.includes("CRITICAL") || p.includes("HIGH")) {
      return "bg-red-100 text-red-900 border-red-300";
    }
    if (p.includes("MEDIUM")) {
      return "bg-amber-100 text-amber-900 border-amber-300";
    }
    if (p.includes("LOW")) {
      return "bg-slate-100 text-slate-900 border-slate-300";
    }
    return "bg-blue-100 text-blue-900 border-blue-300";
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
  const currentPriorityObj = priorities.find((p) => p.id === selectedPriorityId);
  const filteredPriorities = priorities.filter((p) =>
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
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${getStatusBadge(
                  h.previousStatus?.label,
                  h.previousBehavior || h.previousStatus?.behavior
                )}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                <span>{prevLabel}</span>
              </span>
              <span className="text-gray-700">to</span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${getStatusBadge(
                  h.newStatus?.label,
                  h.newBehavior || h.newStatus?.behavior
                )}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                <span>{newLabel}</span>
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
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${getPriorityBadge(
                  h.previousPriority?.label
                )}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                <span>{prevLabel}</span>
              </span>
              <span className="text-gray-700">to</span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${getPriorityBadge(
                  h.newPriority?.label
                )}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                <span>{newLabel}</span>
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

              {/* Status Badge (Static display pill with full name and matching color) */}
              {ticket?.status && (
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border shadow-2xs ${getStatusBadge(
                    (ticket.status as any).label || ticket.status.name,
                    ticket.status.behavior
                  )}`}
                >
                  <span className="w-2 h-2 rounded-full bg-current" />
                  <span>{(ticket.status as any).label || ticket.status.name || ticket.status.behavior}</span>
                </span>
              )}

              {/* Priority Badge (Static display pill with full name and matching color) */}
              {ticket?.priority && (
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border shadow-2xs ${getPriorityBadge(
                    (ticket.priority as any).label || ticket.priority.name
                  )}`}
                >
                  <span className="w-2 h-2 rounded-full bg-current" />
                  <span>{(ticket.priority as any).label || ticket.priority.name}</span>
                </span>
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
          <h2
            id="ticket-drawer-title"
            className="text-xl font-extrabold text-gray-900 tracking-tight leading-snug line-clamp-2 mt-1"
          >
            {ticket?.summary || (isTicketLoading ? "Loading ticket..." : "Ticket Details")}
          </h2>

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
              {/* Change Status Action */}
              {canChangeStatus && (
                <button
                  type="button"
                  onClick={handleOpenStatusModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1F3864] bg-blue-50/80 border border-blue-200 rounded-md hover:bg-blue-100 hover:border-blue-300 transition shadow-xs"
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-50/80 border border-amber-200 rounded-md hover:bg-amber-100 hover:border-amber-300 transition shadow-xs"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                  <span>Change Priority</span>
                </button>
              )}

              {/* Reassign Action (Admin) */}
              {canReassign && (
                <button
                  type="button"
                  onClick={handleOpenReassignModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-900 bg-purple-50/80 border border-purple-200 rounded-md hover:bg-purple-100 hover:border-purple-300 transition shadow-xs"
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-emerald-50/80 border border-emerald-200 rounded-md hover:bg-emerald-100 hover:border-emerald-300 transition shadow-xs"
                >
                  <Clock className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Log Time</span>
                </button>
              )}
            </div>

            {/* Close Ticket (Danger Action) */}
            {canClose && (
              <button
                type="button"
                onClick={handleOpenCloseModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#D32F2F] hover:bg-[#b71c1c] rounded-md shadow-xs transition ml-auto"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Close Ticket</span>
              </button>
            )}
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
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-gray-700 block mb-1.5">
                    Description
                  </label>
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
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                    {ticket.customFieldValues.map((cf) => (
                      <div
                        key={cf.id}
                        className="p-3 bg-slate-50 rounded-lg border border-slate-200"
                      >
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-700 block">
                          {cf.fieldDefinition.name}
                        </span>
                        <span className="text-xs font-bold text-gray-900 block mt-1">
                          {String(cf.value)}
                        </span>
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
                    <ul className="mt-4 divide-y divide-gray-100 text-xs">
                      {ticket.subTickets.map((st: any) => (
                        <li
                          key={st.id}
                          onClick={() => onSelectTicket ? onSelectTicket(st.id) : undefined}
                          className={`py-3 flex items-center justify-between hover:bg-slate-50 px-3 rounded-lg transition border border-transparent hover:border-slate-200 ${
                            onSelectTicket ? "cursor-pointer" : ""
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-[#1F3864] text-xs bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                              {st.ticketNumber}
                            </span>
                            <span className="text-gray-900 font-bold text-xs">{st.summary}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {st.status && (
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${getStatusBadge(
                                  (st.status as any).label || st.status.name,
                                  st.status.behavior
                                )}`}
                              >
                                {(st.status as any).label || st.status.name || st.status.behavior}
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
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
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(
                          currentStatusObj.label || currentStatusObj.name,
                          currentStatusObj.behavior
                        )}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        <span>{currentStatusObj.label || currentStatusObj.name || currentStatusObj.behavior}</span>
                      </span>
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
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(
                                    s.label || s.name,
                                    s.behavior
                                  )}`}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                  <span>{label}</span>
                                </span>

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
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${getPriorityBadge(
                          currentPriorityObj.label || currentPriorityObj.name
                        )}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        <span>{currentPriorityObj.label || currentPriorityObj.name}</span>
                      </span>
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
                                    ? "bg-amber-50 text-amber-900 font-bold"
                                    : "hover:bg-gray-50 text-gray-800"
                                }`}
                              >
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getPriorityBadge(
                                    p.label || p.name
                                  )}`}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                  <span>{label}</span>
                                </span>

                                {isSelected && (
                                  <Check className="w-4 h-4 text-amber-700" />
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
                    {priorities.find((p) => p.id === subTicketPriorityId) ? (
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${getPriorityBadge(
                          priorities.find((p) => p.id === subTicketPriorityId)?.label
                        )}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        <span>{priorities.find((p) => p.id === subTicketPriorityId)?.label}</span>
                      </span>
                    ) : (
                      <span className="text-gray-400 font-medium">Select priority...</span>
                    )}
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>

                  {isSubTicketPriorityDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white border border-gray-200 rounded-xl shadow-2xl p-2.5 space-y-1">
                      {priorities.map((p) => {
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
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${getPriorityBadge(
                                p.label || p.name
                              )}`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              <span>{p.label || p.name}</span>
                            </span>
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
      </aside>
    </div>,
    document.body
  );
};

export default TicketDetailsOverlay;
