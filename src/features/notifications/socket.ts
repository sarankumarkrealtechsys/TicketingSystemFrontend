import { io, Socket } from "socket.io-client";

// Normalize base URL identically to shared/api/axios.ts to ensure single source of truth
const rawBaseUrl =
  (import.meta.env.VITE_API_URL as string | undefined) ||
  "http://localhost:5000";
const socketServerUrl = rawBaseUrl.replace(/\/api\/?$/, "");

let socketInstance: Socket | null = null;

/**
 * Retrieves the singleton Socket.IO client instance, lazily instantiating if needed.
 * autoConnect is false by default so connection is only established after authentication.
 */
export const getNotificationSocket = (): Socket => {
  if (!socketInstance) {
    socketInstance = io(socketServerUrl, {
      withCredentials: true,
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  }
  return socketInstance;
};

/**
 * Connects the socket if not already connected.
 */
export const connectNotificationSocket = (): Socket => {
  const socket = getNotificationSocket();
  if (!socket.connected) {
    socket.connect();
  }
  return socket;
};

/**
 * Disconnects the socket when the user logs out or session is terminated.
 */
export const disconnectNotificationSocket = (): void => {
  if (socketInstance && socketInstance.connected) {
    socketInstance.disconnect();
  }
};
