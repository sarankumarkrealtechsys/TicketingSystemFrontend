import React, { useMemo } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { TicketListItem } from "../types";
import { PriorityBadge, StatusBadge, UserAvatar } from "@/shared/components";

export interface TicketsTableProps {
  tickets: TicketListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onViewTicket: (ticketId: number) => void;
  isLoading?: boolean;
  isFetching?: boolean;
}

const columnHelper = createColumnHelper<TicketListItem>();

export const TicketsTable: React.FC<TicketsTableProps> = ({
  tickets = [],
  total = 0,
  page = 1,
  pageSize = 10,
  totalPages = 1,
  onPageChange,
  onViewTicket,
  isLoading = false,
  isFetching = false,
}) => {
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  const columns = useMemo(
    () => [
      columnHelper.accessor("ticketNumber", {
        header: () => (
          <div className="flex items-center gap-1">
            <span>Ticket ID</span>
            <span className="material-symbols-outlined text-[14px]">
              arrow_drop_down
            </span>
          </div>
        ),
        cell: (info) => {
          const row = info.row.original;
          const isSubTicket = Boolean(row.parentTicketId || row.parentTicket);
          const hasSubs = Boolean(
            row.subTicketsCount && row.subTicketsCount > 0,
          );

          return (
            <div className="flex flex-col items-start gap-0.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className="font-mono font-semibold text-[#1E88E5] hover:underline cursor-pointer"
                  onClick={() => onViewTicket(row.id)}
                >
                  #{info.getValue()}
                </span>
                {isSubTicket && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold font-sans bg-indigo-50 text-indigo-700 border border-indigo-200/70 rounded shadow-2xs">
                    <span className="material-symbols-outlined text-[11px]">
                      subdirectory_arrow_right
                    </span>
                    Sub
                  </span>
                )}
                {hasSubs && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold font-sans bg-slate-100 text-slate-600 border border-slate-200 rounded">
                    <span className="material-symbols-outlined text-[11px]">
                      account_tree
                    </span>
                    {row.subTicketsCount} sub
                    {row.subTicketsCount! > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              {isSubTicket && row.parentTicket && (
                <span
                  className="text-[11px] text-gray-400 hover:text-indigo-600 hover:underline cursor-pointer flex items-center gap-0.5 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewTicket(row.parentTicket!.id);
                  }}
                  title={`Parent: #${row.parentTicket.ticketNumber} - ${row.parentTicket.summary}`}
                >
                  <span>↳</span>
                  <span className="font-mono">
                    #{row.parentTicket.ticketNumber}
                  </span>
                </span>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor("summary", {
        header: () => (
          <div className="flex items-center gap-1">
            <span>Summary</span>
            <span className="material-symbols-outlined text-[14px] opacity-40">
              sort
            </span>
          </div>
        ),
        cell: (info) => (
          <span
            className="font-medium text-[#1A1A1A] group-hover:text-[#1F3864] transition-colors cursor-pointer"
            onClick={() => onViewTicket(info.row.original.id)}
          >
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor((row) => row.project?.name, {
        id: "project",
        header: "Project",
        cell: (info) => (
          <span className="text-[#5F6368] font-medium">
            {info.getValue() || "-"}
          </span>
        ),
      }),
      columnHelper.accessor((row) => row.team?.name, {
        id: "team",
        header: "Team",
        cell: (info) => (
          <span className="text-[#5F6368]">{info.getValue() || "-"}</span>
        ),
      }),
      columnHelper.accessor((row) => row.assignees?.[0]?.user, {
        id: "assignee",
        header: "Assignee",
        cell: (info) => {
          const user = info.getValue();
          if (!user) {
            return (
              <span className="text-[#9E9E9E] italic text-xs">Unassigned</span>
            );
          }
          return (
            <div className="flex items-center gap-2">
              <UserAvatar name={user.name} size="sm" />
              <span className="font-medium text-[#1A1A1A] truncate max-w-[120px]">
                {user.name}
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor((row) => row.priority?.label, {
        id: "priority",
        header: "Priority",
        cell: (info) => {
          const row = info.row.original;
          return (
            <PriorityBadge
              priority={row.priority?.label || "Normal"}
              priorityId={row.priority?.id}
            />
          );
        },
      }),
      columnHelper.accessor((row) => row.status?.label || row.status?.behavior, {
        id: "status",
        header: "Status",
        cell: (info) => {
          const row = info.row.original;
          return (
            <StatusBadge
              status={row.status?.label || row.status?.behavior || "Open"}
              statusId={row.status?.id}
              behavior={row.status?.behavior}
            />
          );
        },
      }),
      columnHelper.accessor(
        (row) => row.createdBy?.email || row.createdBy?.name,
        {
          id: "createdBy",
          header: "Created By",
          cell: (info) => (
            <span
              className="font-mono text-[12px] text-[#5F6368] truncate max-w-[150px] block"
              title={info.getValue()}
            >
              {info.getValue() || "-"}
            </span>
          ),
        },
      ),
      columnHelper.accessor("createdAt", {
        header: "Created On",
        cell: (info) => {
          const val = info.getValue();
          return (
            <span className="text-[12px] text-[#5F6368] whitespace-nowrap">
              {val ? format(new Date(val), "MMM dd, yyyy, hh:mm a") : "-"}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: "actions",
        header: () => <span className="block text-right">Actions</span>,
        cell: (info) => (
          <div className="text-right">
            <button
              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#1E88E5]/10 hover:bg-[#1E88E5]/20 text-[#1E88E5] text-[11px] font-semibold transition-colors active:scale-[0.98]"
              onClick={() => onViewTicket(info.row.original.id)}
              title="View Ticket Details"
              type="button"
            >
              <span className="material-symbols-outlined text-[15px]">
                visibility
              </span>
              <span>View</span>
            </button>
          </div>
        ),
      }),
    ],
    [onViewTicket],
  );

  const isInitialLoading = isLoading && tickets.length === 0;

  const table = useReactTable({
    data: tickets,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.id),
    manualPagination: true,
    pageCount: totalPages,
  });

  return (
    <div className="bg-white rounded-[10px] shadow-sm border border-[#EEEEEE] overflow-hidden relative">
      {/* Background Fetching Indicator Bar */}
      {isFetching && (
        <div className="h-0.5 w-full bg-[#E3F2FD] overflow-hidden">
          <div className="h-full bg-[#1E88E5] animate-pulse w-full" />
        </div>
      )}

      {/* ── Desktop View: Enterprise Data Table (>= md) ── */}
      <div className="hidden md:block overflow-x-auto w-full">
        <table className="w-full text-left border-collapse min-w-[1050px]">
          {/* Sticky Header Row */}
          <thead className="sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="bg-[#F6F3F2]/80 text-[#5F6368] text-[11px] font-semibold uppercase tracking-wider border-b border-[#EEEEEE]"
              >
                {headerGroup.headers.map((header) => {
                  let widthClass = "";
                  if (header.id === "ticketNumber") widthClass = "w-28";
                  else if (header.id === "summary")
                    widthClass = "min-w-[260px]";
                  else if (header.id === "project") widthClass = "w-40";
                  else if (header.id === "team") widthClass = "w-32";
                  else if (header.id === "assignee") widthClass = "w-44";
                  else if (header.id === "priority") widthClass = "w-28";
                  else if (header.id === "status") widthClass = "w-32";
                  else if (header.id === "createdBy") widthClass = "w-44";
                  else if (header.id === "createdAt") widthClass = "w-40";
                  else if (header.id === "actions")
                    widthClass = "w-24 text-right";

                  return (
                    <th
                      key={header.id}
                      className={`py-3 px-4 select-none ${widthClass}`}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          {/* Zebra-free rows with 1px #EEEEEE dividers & #F0F4F8 subtle hover */}
          <tbody
            className={`divide-y divide-[#EEEEEE] text-[13px] text-[#1A1A1A] transition-opacity duration-150 ${
              isFetching ? "opacity-75" : "opacity-100"
            }`}
          >
            {isInitialLoading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-12 text-center text-[#5F6368]"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="material-symbols-outlined animate-spin text-[24px] text-[#1E88E5]">
                      progress_activity
                    </span>
                    <span className="text-xs font-medium">
                      Loading tickets...
                    </span>
                  </div>
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-12 text-center text-[#5F6368]"
                >
                  <div className="flex flex-col items-center justify-center gap-1">
                    <span className="material-symbols-outlined text-[32px] text-[#C4C6D0]">
                      inbox
                    </span>
                    <p className="font-semibold text-sm text-[#1A1A1A]">
                      No tickets found
                    </p>
                    <p className="text-xs">
                      Try adjusting your filters or search query.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-[#F0F4F8] transition-colors group"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="py-3.5 px-4">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Mobile View: Spacious & Modern Ticket Cards (< md) ── */}
      <div
        className={`block md:hidden p-3 sm:p-4 space-y-3.5 bg-[#F9FAFB]/60 dark:bg-slate-900/40 transition-opacity duration-150 ${
          isFetching ? "opacity-75" : "opacity-100"
        }`}
      >
        {isInitialLoading ? (
          <div className="py-16 text-center text-[#5F6368] bg-white dark:bg-[#152033] rounded-xl border border-[#E5E7EB] dark:border-[#1E2D45] p-6 shadow-xs">
            <div className="flex flex-col items-center justify-center gap-2">
              <span className="material-symbols-outlined animate-spin text-[26px] text-[#1E88E5]">
                progress_activity
              </span>
              <span className="text-xs font-medium">Loading tickets...</span>
            </div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-16 text-center text-[#5F6368] px-4 bg-white dark:bg-[#152033] rounded-xl border border-[#E5E7EB] dark:border-[#1E2D45] shadow-xs">
            <div className="flex flex-col items-center justify-center gap-1.5">
              <span className="material-symbols-outlined text-[36px] text-[#C4C6D0]">
                inbox
              </span>
              <p className="font-semibold text-sm text-[#1A1A1A] dark:text-white">
                No tickets found
              </p>
              <p className="text-xs text-gray-500">
                Try adjusting your filters or search query.
              </p>
            </div>
          </div>
        ) : (
          tickets.map((ticket) => {
            const priorityName = ticket.priority?.label || "Normal";
            const priorityId = ticket.priority?.id;
            const statusName =
              ticket.status?.label || ticket.status?.behavior || "Open";
            const statusId = ticket.status?.id;
            const statusBehavior = ticket.status?.behavior;
            const primaryAssignee = ticket.assignees?.[0]?.user;
            const extraAssigneesCount = (ticket.assignees?.length || 0) - 1;
            const formattedDate = ticket.createdAt
              ? format(new Date(ticket.createdAt), "dd MMM yyyy")
              : "—";
            const isSubTicket = Boolean(ticket.parentTicketId || ticket.parentTicket);
            const hasSubs = Boolean(
              ticket.subTicketsCount && ticket.subTicketsCount > 0,
            );

            return (
              <div
                key={ticket.id}
                onClick={() => onViewTicket(ticket.id)}
                className="bg-white dark:bg-[#152033] rounded-xl p-3.5 sm:p-4 border border-[#E5E7EB] dark:border-[#1E2D45] shadow-xs hover:shadow-md hover:border-[#1F3864]/30 dark:hover:border-blue-500/40 active:scale-[0.99] transition-all flex flex-col space-y-3 cursor-pointer group"
              >
                {/* 1. Header: Ticket ID & Badges on Left, Status Badge on Right */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-[#1F3864] dark:text-blue-300 font-mono font-bold text-xs border border-blue-100 dark:border-blue-900/60 shadow-2xs">
                      #{ticket.ticketNumber}
                    </span>
                    <PriorityBadge priority={priorityName} priorityId={priorityId} />
                    {isSubTicket && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800 rounded shadow-2xs">
                        <span className="material-symbols-outlined text-[11px]">
                          subdirectory_arrow_right
                        </span>
                        Sub
                      </span>
                    )}
                    {hasSubs && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded">
                        <span className="material-symbols-outlined text-[11px]">
                          account_tree
                        </span>
                        {ticket.subTicketsCount} sub
                        {ticket.subTicketsCount! > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  <div className="shrink-0">
                    <StatusBadge
                      status={statusName}
                      statusId={statusId}
                      behavior={statusBehavior}
                    />
                  </div>
                </div>

                {/* Parent Link if Sub-ticket */}
                {isSubTicket && ticket.parentTicket && (
                  <div
                    className="text-[11px] text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer flex items-center gap-1 transition-colors -mt-1 font-medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewTicket(ticket.parentTicket!.id);
                    }}
                    title={`Parent: #${ticket.parentTicket.ticketNumber} - ${ticket.parentTicket.summary}`}
                  >
                    <span>↳ Parent:</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold underline">
                      #{ticket.parentTicket.ticketNumber}
                    </span>
                    <span className="truncate text-gray-500 max-w-[180px]">
                      {ticket.parentTicket.summary}
                    </span>
                  </div>
                )}

                {/* 2. Ticket Summary */}
                <h3 className="font-semibold text-sm text-[#1A1A1A] dark:text-white leading-snug line-clamp-2 group-hover:text-[#1F3864] dark:group-hover:text-blue-400 transition-colors">
                  {ticket.summary}
                </h3>

                {/* 3. Spacious 2-Column Metadata Grid (Matches Team & Department mobile cards) */}
                <div className="grid grid-cols-2 gap-2.5 text-xs pt-2.5 border-t border-gray-100 dark:border-gray-800">
                  <div>
                    <span className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                      Project
                    </span>
                    <div className="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-300 truncate mt-0.5">
                      <span className="material-symbols-outlined text-[14px] text-gray-400 shrink-0">
                        folder
                      </span>
                      <span className="truncate">{ticket.project?.name || "—"}</span>
                    </div>
                  </div>

                  <div>
                    <span className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                      Team
                    </span>
                    <div className="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-300 truncate mt-0.5">
                      <span className="material-symbols-outlined text-[14px] text-gray-400 shrink-0">
                        group
                      </span>
                      <span className="truncate">{ticket.team?.name || "—"}</span>
                    </div>
                  </div>

                  <div>
                    <span className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                      Assignee
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                      {primaryAssignee ? (
                        <>
                          <UserAvatar
                            name={
                              primaryAssignee.name ||
                              primaryAssignee.email ||
                              "User"
                            }
                            size="sm"
                          />
                          <span className="truncate text-gray-700 dark:text-gray-300 font-medium">
                            {primaryAssignee.name || primaryAssignee.email}
                          </span>
                          {extraAssigneesCount > 0 && (
                            <span className="text-[10px] px-1 py-0.2 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-semibold shrink-0">
                              +{extraAssigneesCount}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="italic text-gray-400">Unassigned</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                      Created Date
                    </span>
                    <span className="inline-flex items-center gap-1 text-gray-700 dark:text-gray-300 font-medium mt-0.5">
                      <span className="material-symbols-outlined text-[14px] text-gray-400 shrink-0">
                        calendar_today
                      </span>
                      <span>{formattedDate}</span>
                    </span>
                  </div>
                </div>

                {/* 4. Action & Creator Footer */}
                <div
                  className="flex items-center justify-between pt-2.5 border-t border-gray-100 dark:border-gray-800"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 truncate max-w-[55%]">
                    <span className="material-symbols-outlined text-[15px] text-gray-400 shrink-0">
                      person_outline
                    </span>
                    <span className="truncate">
                      {ticket.createdBy?.name || ticket.createdBy?.email || "Unknown"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onViewTicket(ticket.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#1F3864] dark:text-blue-300 bg-blue-50/80 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 transition-colors cursor-pointer shrink-0 active:scale-[0.98]"
                  >
                    <span>View Details</span>
                    <span className="material-symbols-outlined text-[15px]">
                      arrow_forward
                    </span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Footer */}
      <div className="p-3 sm:p-4 border-t border-[#EEEEEE] flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] sm:text-[13px] text-[#5F6368]">
        <div>
          Showing{" "}
          <strong className="font-semibold text-[#1A1A1A]">{startItem}</strong>{" "}
          to <strong className="font-semibold text-[#1A1A1A]">{endItem}</strong>{" "}
          of <strong className="font-semibold text-[#1A1A1A]">{total}</strong>{" "}
          tickets
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-end">
          <button
            className="px-3 py-1 rounded border border-[#E0E0E0] text-[12px] font-medium text-[#5F6368] hover:bg-[#F0EDED] transition-colors disabled:opacity-40 active:scale-[0.98]"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            type="button"
          >
            Prev
          </button>

          {/* Desktop page buttons */}
          <div className="hidden sm:flex items-center gap-1.5">
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
              const pageNum = i + 1;
              const isActive = pageNum === page;
              return (
                <button
                  key={pageNum}
                  className={`px-3 py-1 rounded text-[12px] font-semibold transition-all active:scale-[0.98] ${
                    isActive
                      ? "bg-[#1F3864] text-white shadow-sm"
                      : "border border-[#E0E0E0] text-[#1A1A1A] hover:bg-[#F0EDED]"
                  }`}
                  onClick={() => onPageChange(pageNum)}
                  type="button"
                >
                  {pageNum}
                </button>
              );
            })}
            {totalPages > 5 && <span className="px-1 text-[#5F6368]">...</span>}
          </div>

          {/* Mobile compact page indicator */}
          <span className="sm:hidden text-xs font-semibold text-[#1A1A1A]">
            Page {page} of {Math.max(totalPages, 1)}
          </span>

          <button
            className="px-3 py-1 rounded border border-[#E0E0E0] text-[12px] font-medium text-[#1A1A1A] hover:bg-[#F0EDED] transition-colors disabled:opacity-40 active:scale-[0.98]"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            type="button"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default TicketsTable;
