package com.capstone.be.dto.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;

/**
 * Hình dạng response duy nhất của toàn bộ API.
 *
 * <p>Trước đây có ba hình dạng khác nhau cho cùng một loại API — {@code ApiResponse},
 * {@code PagedResponse} và {@code Page<T>} thô của Spring Data — nên frontend phải
 * đoán xem đang nhận cái nào. Giờ chỉ còn lớp này.
 *
 * <p>Mọi field phụ đều {@code NON_NULL}, nên response thực tế chỉ chứa phần có ý nghĩa:
 *
 * <pre>
 * // Thành công, không phân trang
 * { "success": true, "data": {...}, "timestamp": "..." }
 *
 * // Thành công, có phân trang — data là danh sách, pageInfo mô tả trang
 * { "success": true, "data": [...], "pageInfo": {...}, "timestamp": "..." }
 *
 * // Lỗi — errorCode ổn định để frontend so khớp, không phải so chuỗi message
 * { "success": false, "message": "...", "errorCode": "3001", "timestamp": "..." }
 *
 * // Lỗi validation — thêm fieldErrors
 * { "success": false, "message": "...", "errorCode": "1002",
 *   "fieldErrors": { "email": "..." }, "timestamp": "..." }
 * </pre>
 *
 * @param <T> kiểu dữ liệu trả về
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

  @Builder.Default
  private boolean success = true;

  private String message;

  private T data;

  /** Chỉ có khi response phân trang. */
  private PageInfo pageInfo;

  /** Chỉ có khi success=false. Mã từ {@link com.capstone.be.exception.ErrorCode}. */
  private String errorCode;

  /** Chỉ có khi lỗi validation: tên field -> thông báo. */
  private Map<String, String> fieldErrors;

  @Builder.Default
  private Instant timestamp = Instant.now();

  // ───────────────────────── thành công ─────────────────────────

  public static <T> ApiResponse<T> success(T data) {
    return ApiResponse.<T>builder().success(true).data(data).build();
  }

  public static <T> ApiResponse<T> success(T data, String message) {
    return ApiResponse.<T>builder().success(true).message(message).data(data).build();
  }

  /** Thành công, chỉ có message (không có dữ liệu trả về). */
  public static <T> ApiResponse<T> success(String message) {
    return ApiResponse.<T>builder().success(true).message(message).build();
  }

  // ───────────────────────── phân trang ─────────────────────────

  /**
   * Bọc một {@link Page} của Spring Data: {@code data} là nội dung trang,
   * {@code pageInfo} là thông tin trang.
   *
   * <p>Controller KHÔNG được trả {@code Page<T>} thô — hình dạng JSON của nó
   * ({@code content}, {@code pageable}, {@code totalElements}…) khác hoàn toàn
   * và là một trong ba hình dạng mà Phase 1 xoá bỏ.
   */
  public static <T> ApiResponse<List<T>> page(Page<T> page) {
    return ApiResponse.<List<T>>builder()
        .success(true)
        .data(page.getContent())
        .pageInfo(PageInfo.from(page))
        .build();
  }

  public static <T> ApiResponse<List<T>> page(Page<T> page, String message) {
    return ApiResponse.<List<T>>builder()
        .success(true)
        .message(message)
        .data(page.getContent())
        .pageInfo(PageInfo.from(page))
        .build();
  }

  /** Phân trang khi danh sách và thông tin trang được dựng tay. */
  public static <T> ApiResponse<List<T>> page(List<T> items, PageInfo pageInfo) {
    return ApiResponse.<List<T>>builder()
        .success(true)
        .data(items)
        .pageInfo(pageInfo)
        .build();
  }

  // ───────────────────────── lỗi ─────────────────────────

  /** Lỗi kèm mã ổn định. */
  public static <T> ApiResponse<T> failure(String message, String errorCode) {
    return ApiResponse.<T>builder()
        .success(false)
        .message(message)
        .errorCode(errorCode)
        .build();
  }

  /** Lỗi validation: kèm mã và chi tiết từng field. */
  public static <T> ApiResponse<T> failure(
      String message, String errorCode, Map<String, String> fieldErrors) {
    return ApiResponse.<T>builder()
        .success(false)
        .message(message)
        .errorCode(errorCode)
        .fieldErrors(fieldErrors)
        .build();
  }

  /**
   * @deprecated dùng {@link #failure(String, String)} để response lỗi luôn có mã.
   */
  @Deprecated
  public static <T> ApiResponse<T> error(String message) {
    return ApiResponse.<T>builder().success(false).message(message).build();
  }

  /**
   * @deprecated dùng {@link #failure(String, String)}; nhét dữ liệu vào response lỗi
   *     làm {@code data} mang hai nghĩa khác nhau.
   */
  @Deprecated
  public static <T> ApiResponse<T> error(String message, T data) {
    return ApiResponse.<T>builder().success(false).message(message).data(data).build();
  }
}
