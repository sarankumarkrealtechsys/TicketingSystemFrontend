import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAppSelector } from "@/features/auth/authSlice";
import {
  connectNotificationSocket,
  disconnectNotificationSocket,
  getNotificationSocket,
} from "./socket";
import { notificationKeys } from "./api";
import {
  initColorRegistry,
  fetchAndSyncColorRegistry,
} from "@/features/priority-status-management/colorRegistry";

/**
 * Hook to manage Socket.IO lifecycle and real-time notification synchronization.
 * - Automatically connects when Redux auth status is 'authenticated'.
 * - Disconnects on logout / unauthenticated.
 * - On 'connect' event (initial connect + all reconnects), invalidates notification queries to recover missed items and fetches latest color registry.
 * - On 'notification:new' event, invalidates notification queries to instantly update UI state and unread count.
 * - On 'colors:update' event, synchronizes global status and priority colors across all active sessions.
 */
export const useNotificationSocket = () => {
  const queryClient = useQueryClient();
  const { status, user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (status !== "authenticated" || !user) {
      disconnectNotificationSocket();
      return;
    }

    // Hydrate color registry for the active user session on app load
    fetchAndSyncColorRegistry();

    const socket = connectNotificationSocket();

    const handleConnect = () => {
      // Reconnection catch-up: recover any notifications created while offline/disconnected
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      fetchAndSyncColorRegistry();
    };

    const handleNewNotification = (data?: any) => {
      // Invalidate to trigger instant refetch with full relational data and updated unread count
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      // Notify active UI listeners (e.g. Navbar notification bell animation)
      window.dispatchEvent(
        new CustomEvent("rts_notification_arrived", { detail: data }),
      );
    };

    const handleColorsUpdate = (remoteRegistry: any) => {
      initColorRegistry(remoteRegistry);
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      queryClient.invalidateQueries({ queryKey: ["user-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    };

    socket.on("connect", handleConnect);
    socket.on("notification:new", handleNewNotification);
    socket.on("colors:update", handleColorsUpdate);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("notification:new", handleNewNotification);
      socket.off("colors:update", handleColorsUpdate);
    };
  }, [status, user, queryClient]);
};
