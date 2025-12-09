// src/services/http.ts
import axios from "axios";

/**
 * HTTP client dùng chung:
 * - baseURL: "/api" (đi qua middleware + API Route)
 * - withCredentials: true (tự gửi cookie httpOnly: access_token)
 * - interceptor:
 *   + Request: nếu là FormData thì KHÔNG set Content-Type
 *   + Response: chuẩn hoá message lỗi
 */
const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL?.trim() || "/api"
).replace(/\/+$/, "");
const API_TIMEOUT = parseInt(
  process.env.NEXT_PUBLIC_API_TIMEOUT || "10000",
  10,
);

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const isFormData =
    typeof FormData !== "undefined" && config.data instanceof FormData;

  config.headers = config.headers ?? {};

  if (isFormData) {
    delete (config.headers as any)["Content-Type"];
    delete (config.headers as any)["content-type"];
  } else {
    if (
      !(config.headers as any)["Content-Type"] &&
      !(config.headers as any)["content-type"]
    ) {
      (config.headers as any)["Content-Type"] = "application/json";
    }
  }

  return config;
});

apiClient.interceptors.response.use(
  (res) => {
    // Handle 204 NO_CONTENT responses (no body)
    if (res.status === 204) {
      // Return response with empty data object for consistency
      res.data = res.data || { message: "Success" };
    }
    return res;
  },
  (err) => {
    // If error is 204, treat it as success (some servers return 204 differently)
    if (err?.response?.status === 204) {
      return { status: 204, data: { message: "Success" } };
    }
    
    // Try to extract error message from various response formats
    let msg = "Request error";
    
    if (err?.response?.data) {
      const data = err.response.data;
      // Backend format: { success: false, message: "...", data: {...} }
      msg = data.message || data.error || msg;
      
      // If message is still default, try to get from nested data
      if (msg === "Request error" && data.data) {
        if (typeof data.data === "string") {
          msg = data.data;
        } else if (data.data.message) {
          msg = data.data.message;
        } else if (data.data.error) {
          msg = data.data.error;
        }
      }
    }
    
    // Fallback to axios error message if available
    if (msg === "Request error" && err?.message) {
      msg = err.message;
    }
    
    return Promise.reject(new Error(msg));
  },
);
