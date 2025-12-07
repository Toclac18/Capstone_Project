// src/lib/apiClient.ts
import type { ErrorDialogPayload } from "@/server/withErrorBoundary";

// Kiểu error body đặc biệt khi API route bị withErrorBoundary bắt lỗi
export type ApiErrorWrapper = {
  error?: string;
  dialog?: ErrorDialogPayload;
};

// Kiểu ApiResponse<T> mà BE Java trả cho các API "thành công" hoặc "business error"
export type ApiResponse<T> = {
  success: boolean;
  message?: string | null;
  data?: T;
  timestamp: string;
};

// Lớp lỗi dùng cho FE
export class ApiError extends Error {
  status: number;
  dialog?: ErrorDialogPayload;
  body?: unknown;

  constructor(
    status: number,
    message: string,
    dialog?: ErrorDialogPayload,
    body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.dialog = dialog;
    this.body = body;
  }
}

// Global handler để AlertDialogProvider đăng ký
type GlobalErrorHandler = (err: ApiError) => void;
let globalHandler: GlobalErrorHandler | null = null;

export function setApiClientErrorHandler(handler: GlobalErrorHandler | null) {
  globalHandler = handler;
}

/**
 * Hàm gọi API dùng chung:
 * - Luôn parse JSON
 * - Nếu HTTP error (status !2xx):
 *     - Expect body dạng { error, dialog } từ withErrorBoundary
 *     - Tạo ApiError + gọi globalHandler
 *     - throw
 * - Nếu HTTP ok:
 *     - Expect body dạng ApiResponse<T> (BE Java)
 *     - Nếu success=false → coi là lỗi business, cũng ném ApiError
 *     - Ngược lại trả đúng ApiResponse<T>
 */
export async function fetchJsonWithBoundary<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<ApiResponse<T>> {
  const res = await fetch(input, init);

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  // HTTP error (500, 404, 400...)
  if (!res.ok) {
    const wrapped = (body ?? {}) as ApiErrorWrapper;
    const message = wrapped.error || `Request failed with status ${res.status}`;
    const dialog = wrapped.dialog;

    const error = new ApiError(res.status, message, dialog, body);

    if (globalHandler && dialog) {
      try {
        globalHandler(error);
      } catch (handlerErr) {
        console.error("[apiClient] error in globalHandler:", handlerErr);
      }
    }

    throw error;
  }

  // HTTP ok → BE Java trả ApiResponse<T>
  const api = body as ApiResponse<T>;

  if (api && api.success === false) {
    const message = api.message || "Request failed";
    const error = new ApiError(res.status, message, undefined, body);

    if (globalHandler) {
      try {
        globalHandler(error);
      } catch (handlerErr) {
        console.error("[apiClient] error in globalHandler:", handlerErr);
      }
    }

    throw error;
  }

  return api;
}
