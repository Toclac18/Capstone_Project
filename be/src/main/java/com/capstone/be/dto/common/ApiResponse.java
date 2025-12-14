package com.capstone.be.dto.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Standard API response wrapper for all non-paginated responses
 *
 * @param <T> The type of data being returned
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

  @Builder.Default
  private Instant timestamp = Instant.now();

  /**
   * Create a successful response with data
   */
  public static <T> ApiResponse<T> success(T data) {
    return ApiResponse.<T>builder()
        .success(true)
        .data(data)
        .timestamp(Instant.now())
        .build();
  }

  /**
   * Create a successful response with data and message
   */
  public static <T> ApiResponse<T> success(T data, String message) {
    return ApiResponse.<T>builder()
        .success(true)
        .message(message)
        .data(data)
        .timestamp(Instant.now())
        .build();
  }

  /**
   * Create a successful response with only message (no data)
   */
  public static <T> ApiResponse<T> success(String message) {
    return ApiResponse.<T>builder()
        .success(true)
        .message(message)
        .timestamp(Instant.now())
        .build();
  }

  /**
   * Create an error response
   */
  public static <T> ApiResponse<T> error(String message) {
    return ApiResponse.<T>builder()
        .success(false)
        .message(message)
        .timestamp(Instant.now())
        .build();
  }

  /**
   * Create an error response with data
   */
  public static <T> ApiResponse<T> error(String message, T data) {
    return ApiResponse.<T>builder()
        .success(false)
        .message(message)
        .data(data)
        .timestamp(Instant.now())
        .build();
  }
}
