import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  useNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} from "../api";
import { NotificationItem } from "../types";

export interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatRelativeTime = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return dateStr;
  }
};

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  // Query unread-only notifications for the active bell popup
  const { data, isLoading } = useNotificationsQuery(true, 15);
  const markAsReadMutation = useMarkAsReadMutation();
  const markAllAsReadMutation = useMarkAllAsReadMutation();

  if (!isOpen) return null;

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  const handleNotificationClick = (item: NotificationItem) => {
    // When opened/viewed, mark as read so it moves from the active bell to history
    if (!item.isRead) {
      markAsReadMutation.mutate(item.id);
    }
    if (item.ticketId) {
      navigate(`/tickets?ticketId=${item.ticketId}`);
    }
    onClose();
  };

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (unreadCount > 0 && !markAllAsReadMutation.isPending) {
      markAllAsReadMutation.mutate();
    }
  };

  return (
    <div
      className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-[#EEEEEE] py-0 z-50 overflow-hidden animate-fade-in"
      role="dialog"
      aria-label="Notifications Dropdown"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#EEEEEE] flex items-center justify-between bg-white">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[14px] text-[#1A1A1A]">
            Notifications
          </span>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-[#E3F2FD] text-[#1E88E5] text-[11px] font-semibold rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={markAllAsReadMutation.isPending}
            className="text-[12px] font-medium text-[#1E88E5] hover:text-[#1565C0] hover:underline disabled:opacity-50 transition-colors cursor-pointer"
          >
            {markAllAsReadMutation.isPending ? "Updating..." : "Mark all as read"}
          </button>
        )}
      </div>

      {/* Body: Notifications List */}
      <div className="max-h-[360px] overflow-y-auto divide-y divide-[#F5F5F5]">
        {isLoading ? (
          <div className="py-8 text-center text-[#5F6368] text-xs">
            <span className="material-symbols-outlined text-[24px] animate-spin text-[#1E88E5] mb-2">
              progress_activity
            </span>
            <p>Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-10 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-[#F0EDED] flex items-center justify-center mx-auto mb-3 text-[#5F6368]">
              <span className="material-symbols-outlined text-[24px]">
                notifications_off
              </span>
            </div>
            <p className="text-[13px] font-semibold text-[#1A1A1A]">
              All caught up!
            </p>
            <p className="text-[11px] text-[#5F6368] mt-1">
              You have no unread notifications.
            </p>
          </div>
        ) : (
          notifications.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNotificationClick(item)}
              className="w-full text-left p-3.5 flex items-start gap-3 hover:bg-[#F8F9FA] transition-colors cursor-pointer group bg-[#F4F9FD]/60"
            >
              {/* Type Indicator Icon */}
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 bg-[#1E88E5]/10 text-[#1E88E5]">
                <span className="material-symbols-outlined text-[18px]">
                  confirmation_number
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="text-[12px] truncate font-semibold text-[#1A1A1A]">
                    {item.title}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-[#1E88E5] flex-shrink-0" />
                </div>
                <p className="text-[11px] text-[#5F6368] line-clamp-2 leading-relaxed">
                  {item.message}
                </p>
                <div className="flex items-center gap-2 mt-1.5 text-[10px] text-[#80868B]">
                  <span>{formatRelativeTime(item.createdAt)}</span>
                  {item.actor && (
                    <>
                      <span>•</span>
                      <span>By {item.actor.name}</span>
                    </>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Footer: Link to Notification History inside the bell itself */}
      <div className="p-2.5 border-t border-[#EEEEEE] bg-[#FAFAFA] flex items-center justify-center">
        <Link
          to="/notifications/history"
          onClick={onClose}
          className="w-full text-center py-1.5 px-3 rounded-lg text-xs font-semibold text-[#1F3864] hover:bg-blue-50/70 hover:text-[#0E61A1] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">history</span>
          <span>View Notification History</span>
          <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
        </Link>
      </div>
    </div>
  );
};

export default NotificationDropdown;
