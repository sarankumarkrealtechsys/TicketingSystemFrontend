import axios from "axios";

// Normalize base URL so it reliably points to the /api endpoint without duplicating it
const rawBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
const normalizedBaseUrl = rawBaseUrl.replace(/\/api\/?$/, "") + "/api";

export const apiClient = axios.create({
  baseURL: normalizedBaseUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Guard against duplicate /api prefix if a caller specifies '/api/...'
apiClient.interceptors.request.use((config) => {
  if (config.url?.startsWith("/api/")) {
    config.url = config.url.replace(/^\/api/, "");
  }
  return config;
});

// Response interceptor for unified response/error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  },
);
