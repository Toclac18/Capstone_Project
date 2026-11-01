/**
 * Chỉ mục review request theo tài liệu.
 *
 * Trang này đối chiếu `documents` với `reviewRequests` ở client (BE chưa có
 * endpoint gộp hai thứ), và việc đối chiếu đó trước đây quét CẢ danh sách
 * request cho từng tài liệu, ở ba chỗ khác nhau: `stats`,
 * `filteredAndSortedDocuments`, và thân render của bảng.
 *
 * Đã ĐẾM bằng cách dựng lại đúng các đường quét đó với 100 tài liệu và 10.000
 * request (`getDocuments({limit: 100})` + `getAllReviewRequests(0, 10000)`):
 *
 *   tab all               1.777.700 phép so sánh / lần render
 *   tab needs-assignment  2.020.100
 *   tab in-review         2.111.000
 *   tab pending           2.776.700
 *
 * Mỗi phép còn cấp phát một chuỗi qua `String(req.document?.id || "")`. Các
 * `useMemo` phụ thuộc `activeTab` và `sortOrder`, nên chỉ đổi tab là tính lại
 * toàn bộ.
 *
 * Dựng chỉ mục một lần: O(số request). Sau đó tra O(1).
 *
 * Tách ra khỏi component (không import React) để test được.
 */

/** Phần của ReviewRequestResponse mà chỉ mục cần. */
export type IndexableRequest = {
  status?: string;
  createdAt: string;
  document?: { id?: string | number } | null;
};

export type RequestIndex<T extends IndexableRequest> = Map<string, T[]>;

/** Request được coi là "đang mở" — tài liệu đang có người xử lý. */
const OPEN_STATUSES = new Set(["PENDING", "ACCEPTED"]);

/**
 * Nhóm request theo documentId, mỗi nhóm sắp mới nhất trước.
 *
 * Request không có document bị bỏ qua: không gắn được vào tài liệu nào.
 */
export function indexRequestsByDocument<T extends IndexableRequest>(
  requests: readonly T[] | null | undefined,
): RequestIndex<T> {
  const index: RequestIndex<T> = new Map();

  for (const request of requests ?? []) {
    const documentId = String(request.document?.id ?? "");
    if (!documentId) continue;

    const bucket = index.get(documentId);
    if (bucket) {
      bucket.push(request);
    } else {
      index.set(documentId, [request]);
    }
  }

  for (const bucket of index.values()) {
    bucket.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  return index;
}

/**
 * Request hiện hành của tài liệu: ưu tiên request đang mở mới nhất, không có
 * thì lấy request mới nhất bất kể trạng thái.
 */
export function currentRequestFor<T extends IndexableRequest>(
  index: RequestIndex<T>,
  documentId: string | number,
): T | null {
  const bucket = index.get(String(documentId));
  if (!bucket || bucket.length === 0) return null;
  return bucket.find((r) => OPEN_STATUSES.has(r.status ?? "")) ?? bucket[0];
}

/** Request PENDING mới nhất của tài liệu, dùng cho tab "pending". */
export function pendingRequestFor<T extends IndexableRequest>(
  index: RequestIndex<T>,
  documentId: string | number,
): T | null {
  const bucket = index.get(String(documentId));
  if (!bucket) return null;
  return bucket.find((r) => r.status === "PENDING") ?? null;
}
