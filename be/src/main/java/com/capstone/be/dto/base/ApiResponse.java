package com.capstone.be.dto.base;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.OffsetDateTime;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(
    boolean success,
    String message,
    T data,
    ApiError error,
    String path,
    OffsetDateTime timestamp,
    String code,
    PageMeta page //For Paging
) {

  public static <T> ApiResponse<T> ok(T data, String message, String path) {
    return new ApiResponse<>(true, message, data, null, path, OffsetDateTime.now(), null, null);
  }

  public static <T> ApiResponse<T> ok(T data, String path) {
    return ok(data, null, path);
  }

  public static <T> ApiResponse<T> created(T data, String path) {
    return new ApiResponse<>(true, "Created", data, null, path, OffsetDateTime.now(), null, null);
  }

  public static <T> ApiResponse<T> fail(String message, String path, String code, ApiError error) {
    return new ApiResponse<>(false, message, null, error, path, OffsetDateTime.now(), code, null);
  }


  /**
   * Helper to fill missing path/timestamp while keeping existing values.
   */
  public ApiResponse<T> ensureDefaults(String fallbackPath) {
    var ts = (this.timestamp() != null) ? this.timestamp() : OffsetDateTime.now();
    var p = (this.path() != null) ? this.path() : fallbackPath;
    return new ApiResponse<>(this.success(), this.message(), this.data(), this.error(), p, ts,
        this.code(), this.page());
  }
}