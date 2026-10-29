// server/config.ts
// Cấu hình backend dùng cho các API route (chỉ chạy phía server).

// BE chạy ở 8080 — xem server.port trong be/src/main/resources/application.yml.
export const DEFAULT_BE_BASE = "http://localhost:8080";

/**
 * Base URL của backend, theo thứ tự ưu tiên:
 *  1. API_BASE_URL              — biến server-only, nên dùng cái này
 *  2. NEXT_PUBLIC_API_BASE_URL  — tên cũ, giữ để không vỡ env đang có
 *  3. DEFAULT_BE_BASE
 *
 * Giá trị này chỉ được đọc từ code server (API route, next.config.ts). Tiền tố
 * NEXT_PUBLIC_ khiến Next nhúng biến vào bất kỳ bundle nào tham chiếu nó, nên
 * một client component vô tình import file này là địa chỉ backend lọt xuống
 * trình duyệt. Tên API_BASE_URL loại bỏ khả năng đó.
 */
export const BE_BASE: string = (
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  DEFAULT_BE_BASE
).replace(/\/+$/, "");

/**
 * Tên cookie chứa JWT.
 *
 * Backend KHÔNG đặt cookie — nó trả token trong response body, rồi
 * app/api/auth/login/route.ts set cookie và server/auth.ts đọc lại,
 * cả hai đều qua hằng số này. Nên set và get luôn khớp nhau.
 * Mặc định để khớp với giá trị đang dùng ở .env.local và render.yaml.
 */
export const COOKIE_NAME = process.env.COOKIE_NAME || "access_token";

// Global mock toggle (used by some routes)
export const USE_MOCK = process.env.USE_MOCK === "true";
