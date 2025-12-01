import axios from "axios";

/**
 * HTTP client dùng chung:
 * - baseURL: "/api" (đi qua middleware + API Route)
 * - withCredentials: true (tự gửi cookie httpOnly: access_token)
 * - interceptor: chuẩn hoá message lỗi cho UI
 */
const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL?.trim() || "/api"
).replace(/\/+$/, "");
const API_TIMEOUT = parseInt(
  process.env.NEXT_PUBLIC_API_TIMEOUT || "10000",
  10,
);

export const apiClient = axios.create({
  baseURL: API_BASE_URL, // -> /api
  timeout: API_TIMEOUT,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // gửi cookie access_token
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
    const msg =
      err?.response?.data?.error ||
      err?.response?.data?.message ||
      err?.message ||
      "Request error";
    return Promise.reject(new Error(msg));
  },
);
