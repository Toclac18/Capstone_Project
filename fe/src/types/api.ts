// types/api.ts
// Hợp đồng response của API — khớp với com.capstone.be.dto.common.ApiResponse.
//
// Trước Phase 1, backend trả ba hình dạng khác nhau cho cùng một loại API
// (ApiResponse, PagedResponse, và Page<T> thô của Spring Data), nên frontend
// phải đoán. Giờ chỉ còn một hình dạng, mô tả ở đây.
//
// Khi Phase 5 nối OpenAPI vào CI, file này được sinh tự động thay vì viết tay.

/** Thông tin trang — chỉ có khi response phân trang. */
export interface PageInfo {
  /** 0-based */
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
}

/** Hình dạng response duy nhất của API. */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  /** Chỉ có khi phân trang. */
  pageInfo?: PageInfo;
  /** Chỉ có khi success=false. Mã ổn định — so khớp cái này, đừng so chuỗi message. */
  errorCode?: string;
  /** Chỉ có khi lỗi validation: tên field -> thông báo. */
  fieldErrors?: Record<string, string>;
  timestamp: string;
}

/** Response phân trang: data là mảng và pageInfo luôn có. */
export interface PagedApiResponse<T> extends ApiResponse<T[]> {
  data: T[];
  pageInfo: PageInfo;
}

/** true khi response là một trang dữ liệu. */
export function isPaged<T>(res: ApiResponse<T[]>): res is PagedApiResponse<T> {
  return Array.isArray(res.data) && res.pageInfo != null;
}
