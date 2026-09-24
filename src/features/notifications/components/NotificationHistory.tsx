import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { formatDistanceToNow, format } from "date-fns";
import { AppLayout } from "@/layout/AppLayout";
import {
  useNotificationHistoryQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} from "../api";
import { NotificationItem } from "../types";

const formatRelativeTime = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return dateStr;
  }
};

const formatExactDate = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return format(d, "MMM d, yyyy 'at' h:mm a");
  } catch {
    return dateStr;
  }
};

export const NotificationHistory: React.FC = () => {
  const navigate = useNavigate();

  // Filter & Search State
  const [activeFilter, setActiveFilter] = useState<"all" | "unread" | "read">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Query
  const { data, isLoading, isFetching, refetch } = useNotificationHistoryQuery({
    filter: activeFilter,
    search: searchQuery,
    page: currentPage,
    limit: pageSize,
  });

  const markAsReadMutation = useMarkAsReadMutation();
  const markAllAsReadMutation = useMarkAllAsReadMutation();

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;
  const totalCount = data?.totalCount || 0;
  const totalPages = data?.totalPages || 1;

  const handleFilterChange = (filter: "all" | "unread" | "read") => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setCurrentPage(1);
  };

  const handleNotificationClick = (item: NotificationItem) => {
    if (!item.isRead) {
      markAsReadMutation.mutate(item.id);
    }
    if (item.ticketId) {
      navigate(`/tickets?ticketId=${item.ticketId}`);
    }
  };

  const handleMarkItemAsRead = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    markAsReadMutation.mutate(id);
  };

  const handleMarkAllRead = () => {
    if (unreadCount > 0 && !markAllAsReadMutation.isPending) {
      markAllAsReadMutation.mutate();
    }
  };

  return (
    <AppLayout>
      <div className="relative w-full pb-32 bg-[#F7F8FA] min-h-screen">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-5 space-y-5">
          {/* Breadcrumbs & Page Header */}
          <header className="flex flex-col gap-1.5">
            <nav
              aria-label="Breadcrumbs"
              className="flex items-center gap-1.5 text-gray-500 text-xs font-medium"
            >
              <Link
                to="/"
                className="hover:text-[#1F3864] transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[15px]">home</span>
                <span>Home</span>
              </Link>
              <span className="text-gray-400">/</span>
              <span className="text-gray-400">Notifications</span>
              <span className="text-gray-400">/</span>
              <span className="text-[#1F3864] font-semibold">Notification History</span>
            </nav>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-1">
              <div>
                <h1 className="text-2xl font-bold text-[#1A1A1A] tracking-tight flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[28px] text-[#1F3864]">
                    history
                  </span>
                  <span>Notification History</span>
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  Audit and browse your historical alerts, ticket assignments, and team communications.
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    disabled={markAllAsReadMutation.isPending}
                    className="h-8.5 px-3 bg-white hover:bg-gray-50 border border-[#D1D5DB] text-[#1E88E5] hover:text-[#1565C0] rounded-lg text-xs font-semibold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      done_all
                    </span>
                    <span>
                      {markAllAsReadMutation.isPending
                        ? "Marking read..."
                        : `Mark all as read (${unreadCount})`}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => refetch()}
                  disabled={isFetching}
                  className="h-8.5 px-3 bg-white hover:bg-gray-50 border border-[#D1D5DB] text-[#1F3864] rounded-lg text-xs font-semibold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  title="Refresh notifications"
                >
                  <span
                    className={`material-symbols-outlined text-[16px] ${
                      isFetching ? "animate-spin text-[#1E88E5]" : "text-gray-500"
                    }`}
                  >
                    refresh
                  </span>
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </header>

          {/* Controls Card: Filter Tabs & Search Bar */}
          <div className="bg-white rounded-xl shadow-xs border border-[#E5E7EB] p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="inline-flex p-1 bg-gray-100 rounded-lg shrink-0">
              <button
                type="button"
                onClick={() => handleFilterChange("all")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeFilter === "all"
                    ? "bg-white text-[#1F3864] shadow-2xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <span>All</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-gray-200 text-gray-700 font-bold">
                  {totalCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleFilterChange("unread")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeFilter === "unread"
                    ? "bg-white text-[#1E88E5] shadow-2xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <span>Unread</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 text-[#1E88E5] font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleFilterChange("read")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  activeFilter === "read"
                    ? "bg-white text-[#1F3864] shadow-2xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <span>Viewed / Read</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px] pointer-events-none">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search ticket, summary, title, or actor..."
                className="w-full h-9 pl-9 pr-8 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-[#1A1A1A] placeholder:text-gray-400 focus:outline-none focus:border-[#1F3864] focus:bg-white transition-all shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  title="Clear search"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>
          </div>

          {/* Notifications List Container */}
          <div className="bg-white rounded-xl shadow-xs border border-[#E5E7EB] overflow-hidden divide-y divide-[#F1F3F5]">
            {isLoading ? (
              <div className="py-16 text-center text-gray-500 text-xs">
                <span className="material-symbols-outlined text-[28px] animate-spin text-[#1E88E5] mb-2">
                  progress_activity
                </span>
                <p className="font-semibold text-gray-700">Loading notification history...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-16 px-4 text-center">
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3 text-gray-400">
                  <span className="material-symbols-outlined text-[28px]">
                    notifications_off
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[#1A1A1A]">
                  No notifications found
                </h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  {searchQuery
                    ? `No notifications matched "${searchQuery}". Try a different keyword.`
                    : activeFilter === "unread"
                    ? "You have no unread notifications. All caught up!"
                    : "Your notification history is empty right now."}
                </p>
                {(searchQuery || activeFilter !== "all") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setActiveFilter("all");
                      setCurrentPage(1);
                    }}
                    className="mt-3.5 px-3 py-1.5 rounded-lg bg-[#1F3864] text-white text-xs font-semibold hover:bg-[#152747] transition-all cursor-pointer shadow-2xs"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            ) : (
              notifications.map((item) => {
                const isUnread = !item.isRead;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`p-4 sm:p-5 flex flex-col sm:flex-row items-start justify-between gap-4 transition-all cursor-pointer group hover:bg-[#F8F9FA] ${
                      isUnread
                        ? "bg-[#F4F9FD]/70 border-l-4 border-l-[#1E88E5]"
                        : "bg-white border-l-4 border-l-transparent"
                    }`}
                  >
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      {/* Category Icon */}
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-2xs ${
                          isUnread
                            ? "bg-[#1E88E5]/15 text-[#1E88E5]"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          confirmation_number
                        </span>
                      </div>

                      {/* Content Body */}
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span
                            className={`text-sm font-semibold truncate ${
                              isUnread ? "text-[#1A1A1A]" : "text-gray-700"
                            }`}
                          >
                            {item.title}
                          </span>

                          {/* Status Badge */}
                          {isUnread ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E3F2FD] text-[#1E88E5] border border-blue-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#1E88E5]" />
                              <span>Unread</span>
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600"
                              title={
                                item.readAt
                                  ? `Viewed on ${formatExactDate(item.readAt)}`
                                  : undefined
                              }
                            >
                              <span className="material-symbols-outlined text-[12px] text-gray-400">
                                check
                              </span>
                              <span>Viewed</span>
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-gray-600 leading-relaxed mb-2.5">
                          {item.message}
                        </p>

                        {/* Associated Metadata Chips */}
                        <div className="flex items-center gap-2 flex-wrap text-xs text-gray-500">
                          {/* Related Ticket Chip */}
                          {item.ticket && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50/70 border border-blue-100 text-[#1F3864] font-medium text-[11px]">
                              <span className="font-mono font-bold">
                                #{item.ticket.ticketNumber}
                              </span>
                              <span className="text-gray-400">•</span>
                              <span className="truncate max-w-[200px]">
                                {item.ticket.summary}
                              </span>
                            </span>
                          )}

                          {/* Actor Info */}
                          {item.actor && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                              <span className="material-symbols-outlined text-[14px] text-gray-400">
                                person
                              </span>
                              <span>By {item.actor.name}</span>
                            </span>
                          )}

                          <span className="text-gray-300">•</span>

                          {/* Timestamp */}
                          <span
                            className="text-[11px] text-gray-400"
                            title={formatExactDate(item.createdAt)}
                          >
                            {formatRelativeTime(item.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Action Column */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleNotificationClick(item)}
                        className="px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-[#1F3864] text-gray-700 hover:text-white border border-gray-200 hover:border-[#1F3864] text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs group-hover:bg-[#1F3864] group-hover:text-white group-hover:border-[#1F3864]"
                      >
                        <span>View Ticket</span>
                        <span className="material-symbols-outlined text-[15px]">
                          arrow_forward
                        </span>
                      </button>

                      {isUnread && (
                        <button
                          type="button"
                          onClick={(e) => handleMarkItemAsRead(e, item.id)}
                          disabled={markAsReadMutation.isPending}
                          className="text-[11px] font-medium text-gray-400 hover:text-[#1E88E5] hover:underline cursor-pointer transition-colors"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="bg-white rounded-xl shadow-xs border border-[#E5E7EB] px-4 py-3 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">
                Showing{" "}
                <span className="font-semibold text-gray-900">
                  {(currentPage - 1) * pageSize + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-gray-900">
                  {Math.min(currentPage * pageSize, totalCount)}
                </span>{" "}
                of <span className="font-semibold text-gray-900">{totalCount}</span>{" "}
                notifications
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage <= 1}
                  className="h-8 px-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  Previous
                </button>
                <span className="text-xs font-medium text-gray-600 px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage >= totalPages}
                  className="h-8 px-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default NotificationHistory;
