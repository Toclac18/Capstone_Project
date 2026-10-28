// server/route-types.ts
// Kiểu dữ liệu cho bảng route BFF. Tách riêng khỏi route-map.ts để file bảng
// (được sinh tự động) chỉ chứa dữ liệu.

export const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
export type HttpMethod = (typeof HTTP_METHODS)[number];

export type RouteSpec = {
  /** Đường dẫn FE dưới /api — dùng `:param` cho segment động, ví dụ "save-lists/:id/documents" */
  fe: string;
  /** Đường dẫn BE dưới /api — cùng tên `:param` với fe */
  be: string;
  /** Method được phép. Method khác → 405. */
  methods: readonly HttpMethod[];
  /**
   * true = KHÔNG gắn Authorization.
   * Chỉ đặt cho endpoint nằm trong permitAll() của SecurityConfig phía BE.
   */
  public?: boolean;
};
