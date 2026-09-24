export type NotificationType = "TICKET_ASSIGNED";

export interface NotificationActor {
  id: number;
  name: string;
  email?: string;
}

export interface NotificationTicket {
  id: number;
  ticketNumber: string;
  summary: string;
}

export interface NotificationItem {
  id: number;
  userId: number;
  actorId: number | null;
  ticketId: number | null;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  actor?: NotificationActor | null;
  ticket?: NotificationTicket | null;
}

export interface NotificationsResponseData {
  notifications: NotificationItem[];
  unreadCount: number;
  totalCount?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface NotificationHistoryQueryParams {
  page?: number;
  limit?: number;
  filter?: "all" | "unread" | "read";
  search?: string;
}

export interface NotificationsApiResponse {
  status: "success";
  data: NotificationsResponseData;
}

export interface MarkReadApiResponse {
  status: "success";
  message: string;
  data?: {
    count?: number;
  };
}
