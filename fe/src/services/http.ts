// src/services/http.ts
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestHeaders,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import type { ErrorDialogPayload } from "@/server/withErrorBoundary";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL?.trim() || "/api"
).replace(/\/+$/, "");

const API_TIMEOUT = parseInt(
  process.env.NEXT_PUBLIC_API_TIMEOUT || "10000",
  10,
);

// ───────────── ApiError ─────────────

export interface ApiErrorPayload {
  status: number | null;
  message: string;
  data?: unknown;
  dialog?: ErrorDialogPayload;
}

export class ApiError extends Error implements ApiErrorPayload {
  status: number | null;
  data?: unknown;
  dialog?: ErrorDialogPayload;
  isHandledGlobally: boolean = false;

  constructor(payload: ApiErrorPayload) {
    super(payload.message);
    this.name = "ApiError";
    this.status = payload.status;
    this.data = payload.data;
    this.dialog = payload.dialog;
  }
}

// ───────────── Global error handler ─────────────

export type ApiClientErrorHandler = ((error: ApiError) => void) | null;

let apiClientErrorHandler: ApiClientErrorHandler = null;

export function setApiClientErrorHandler(handler: ApiClientErrorHandler) {
  apiClientErrorHandler = handler;
}

// ───────────── Axios instance ─────────────

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const isFormData =
      typeof FormData !== "undefined" && config.data instanceof FormData;
    const headers = (config.headers ?? {}) as AxiosRequestHeaders;

    if (isFormData) {
      delete headers["Content-Type"];
      delete headers["content-type"];
    } else if (!headers["Content-Type"] && !headers["content-type"]) {
      headers["Content-Type"] = "application/json";
    }
    config.headers = headers;
    return config;
  },
  (error) => Promise.reject(error),
);

const getErrorMessage = (error: AxiosError): string => {
  const status = error.response?.status ?? null;
  const payload = error.response?.data as any;

  if (payload?.message) return String(payload.message);

  if (error.code === "ECONNABORTED") return "REQUEST TIMEOUT.";
  if (!error.response) return "CANNOT CONNECT TO SERVER.";

  if (status === 401) return error.message || "SESSION EXPIRED.";
  if (status === 403) return error.message || "PERMISSION DENIED.";
  if (status === 404) return error.message || "RESOURCE NOT FOUND.";
  if (status === 500) return error.message || "SERVER ERROR";

  return error.message || "REQUEST ERROR.";
};

apiClient.interceptors.response.use(
  (res: AxiosResponse) => {
    if (res.status === 204 && (res.data == null || res.data === "")) {
      return { ...res, data: { message: "Success" } };
    }
    return res;
  },
  (error: AxiosError) => {
    const data = error.response?.data as any;
    const dialog = data?.dialog as ErrorDialogPayload | undefined;

    const apiError = new ApiError({
      status: error.response?.status ?? null,
      message: getErrorMessage(error),
      data,
      dialog,
    });

    if (apiClientErrorHandler) {
      try {
        apiClientErrorHandler(apiError);
        apiError.isHandledGlobally = true;
      } catch (e) {
        console.error("[apiClient] error handler failed:", e);
      }
    }

    return Promise.reject(apiError);
  },
);

export default apiClient;
