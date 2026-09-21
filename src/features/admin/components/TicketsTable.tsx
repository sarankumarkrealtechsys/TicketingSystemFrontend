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
          const hasSubs = Boolean(row.subTicketsCount && row.subTicketsCount > 0);

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
                    <span className="material-symbols-outlined text-[11px]">subdirectory_arrow_right</span>
                    Sub
                  </span>
                )}
                {hasSubs && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold font-sans bg-slate-100 text-slate-600 border border-slate-200 rounded">
                    <span className="material-symbols-outlined text-[11px]">account_tree</span>
                    {row.subTicketsCount} sub{row.subTicketsCount! > 1 ? "s" : ""}
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
                  <span className="font-mono">#{row.parentTicket.ticketNumber}</span>
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
        cell: (info) => (
          <PriorityBadge priority={info.getValue() || "LOW"} />
        ),
      }),
      columnHelper.accessor((row) => row.status?.behavior, {
        id: "status",
        header: "Status",
        cell: (info) => (
          <StatusBadge status={info.getValue() || "OPEN"} />
        ),
      }),
      columnHelper.accessor((row) => row.createdBy?.email || row.createdBy?.name, {
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
      }),
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
                  else if (header.id === "summary") widthClass = "min-w-[260px]";
                  else if (header.id === "project") widthClass = "w-40";
                  else if (header.id === "team") widthClass = "w-32";
                  else if (header.id === "assignee") widthClass = "w-44";
                  else if (header.id === "priority") widthClass = "w-28";
                  else if (header.id === "status") widthClass = "w-32";
                  else if (header.id === "createdBy") widthClass = "w-44";
                  else if (header.id === "createdAt") widthClass = "w-40";
                  else if (header.id === "actions") widthClass = "w-24 text-right";

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
                <td colSpan={columns.length} className="py-12 text-center text-[#5F6368]">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="material-symbols-outlined animate-spin text-[24px] text-[#1E88E5]">
                      progress_activity
                    </span>
                    <span className="text-xs font-medium">Loading tickets...</span>
                  </div>
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-[#5F6368]">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <span className="material-symbols-outlined text-[32px] text-[#C4C6D0]">
                      inbox
                    </span>
                    <p className="font-semibold text-sm text-[#1A1A1A]">No tickets found</p>
                    <p className="text-xs">Try adjusting your filters or search query.</p>
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

      {/* ── Mobile View: Neat Ticket Cards (< md) ── */}
      <div
        className={`block md:hidden divide-y divide-[#EEEEEE] transition-opacity duration-150 ${
          isFetching ? "opacity-75" : "opacity-100"
        }`}
      >
        {isInitialLoading ? (
          <div className="py-12 text-center text-[#5F6368]">
            <div className="flex flex-col items-center justify-center gap-2">
              <span className="material-symbols-outlined animate-spin text-[24px] text-[#1E88E5]">
                progress_activity
              </span>
              <span className="text-xs font-medium">Loading tickets...</span>
            </div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-12 text-center text-[#5F6368] px-4">
            <div className="flex flex-col items-center justify-center gap-1">
              <span className="material-symbols-outlined text-[32px] text-[#C4C6D0]">
                inbox
              </span>
              <p className="font-semibold text-sm text-[#1A1A1A]">No tickets found</p>
              <p className="text-xs">Try adjusting your filters or search query.</p>
            </div>
          </div>
        ) : (
          tickets.map((ticket) => {
            const priorityName = ticket.priority?.label || "MEDIUM";
            const statusName =
              ticket.status?.behavior || ticket.status?.label || "OPEN";
            const primaryAssignee = ticket.assignees?.[0]?.user;
            const extraAssigneesCount = (ticket.assignees?.length || 0) - 1;
            const formattedDate = ticket.createdAt
              ? format(new Date(ticket.createdAt), "dd MMM yyyy")
              : "—";

            return (
              <div
                key={ticket.id}
                onClick={() => onViewTicket(ticket.id)}
                className="p-3.5 hover:bg-[#F0F4F8] transition-colors cursor-pointer space-y-2 active:bg-[#E3EDF7]"
              >
                {/* Top: Ticket ID + Priority on left, Status on right */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono font-bold text-[13px] text-[#1E88E5]">
                      #{ticket.ticketNumber}
                    </span>
                    <PriorityBadge priority={priorityName} />
                  </div>
                  <StatusBadge status={statusName} />
                </div>

                {/* Summary */}
                <h3 className="font-semibold text-[13px] text-[#1A1A1A] leading-snug line-clamp-2">
                  {ticket.summary}
                </h3>

                {/* Project & Team Chips */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#5F6368]">
                  {ticket.project?.name && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#F6F3F2] rounded font-medium text-[#1A1A1A]">
                      <span className="material-symbols-outlined text-[13px] text-[#5F6368]">
                        folder
                      </span>
                      <span className="truncate max-w-[120px]">
                        {ticket.project.name}
                      </span>
                    </span>
                  )}
                  {ticket.team?.name && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#F6F3F2] rounded font-medium text-[#1A1A1A]">
                      <span className="material-symbols-outlined text-[13px] text-[#5F6368]">
                        group
                      </span>
                      <span className="truncate max-w-[120px]">
                        {ticket.team.name}
                      </span>
                    </span>
                  )}
                </div>

                {/* Bottom: Assignee & Date */}
                <div className="flex items-center justify-between pt-1.5 text-[11px] text-[#5F6368] border-t border-[#F0EDED]">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {primaryAssignee ? (
                      <>
                        <UserAvatar
                          name={primaryAssignee.name || primaryAssignee.email || "User"}
                          size="sm"
                        />
                        <span className="truncate max-w-[120px] font-medium text-[#1A1A1A]">
                          {primaryAssignee.name || primaryAssignee.email}
                        </span>
                        {extraAssigneesCount > 0 && (
                          <span className="text-[10px] px-1 py-0.2 rounded bg-[#EEEEEE] text-[#5F6368] font-semibold">
                            +{extraAssigneesCount}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="italic text-[#9E9E9E]">Unassigned</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-[#5F6368] flex-shrink-0">
                    <span className="material-symbols-outlined text-[13px]">
                      calendar_today
                    </span>
                    <span>{formattedDate}</span>
                  </div>
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
          <strong className="font-semibold text-[#1A1A1A]">
            {startItem}
          </strong>{" "}
          to{" "}
          <strong className="font-semibold text-[#1A1A1A]">
            {endItem}
          </strong>{" "}
          of{" "}
          <strong className="font-semibold text-[#1A1A1A]">
            {total}
          </strong>{" "}
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
