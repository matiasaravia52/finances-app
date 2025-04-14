export interface ApiError {
  message: string;
  status?: number;
  statusText?: string;
  details?: unknown;
  stack?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface ApiErrorContext {
  message: string;
  url: string;
  timestamp: string;
  stack?: string;
}
