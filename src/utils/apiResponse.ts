export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: unknown;
}

export function success<T>(
  message: string,
  data: T,
  meta?: Record<string, unknown>,
): ApiSuccessResponse<T> {
  return { success: true, message, data, ...(meta ? { meta } : {}) };
}

export function failure(message: string, errors?: unknown): ApiErrorResponse {
  return { success: false, message, ...(errors ? { errors } : {}) };
}
