// Shared global TypeScript interfaces and types

export interface ApiResponse<T = unknown> {
  status: string;
  data?: T;
  message?: string;
  error?: string;
}
