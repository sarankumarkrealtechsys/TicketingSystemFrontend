import axios from "axios";

// Normalize base URL so it reliably points to the /api endpoint without duplicating it
const rawBaseUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
const normalizedBaseUrl = rawBaseUrl
  ? rawBaseUrl.replace(/\/api\/?$/, "") + "/api"
  : "/api";

export const apiClient = axios.create({
  baseURL: normalizedBaseUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Guard against duplicate /api prefix
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
