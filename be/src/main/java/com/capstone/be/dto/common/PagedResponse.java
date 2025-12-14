package com.capstone.be.dto.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;

/**
 * Standard API response wrapper for paginated responses
 *
 * @param <T> The type of items in the page
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PagedResponse<T> {

  @Builder.Default
  private boolean success = true;

  private String message;

  private List<T> data;

  private PageInfo pageInfo;

  @Builder.Default
  private Instant timestamp = Instant.now();

  /**
   * Create a successful paged response from Spring Data Page
   */
  public static <T> PagedResponse<T> of(Page<T> page) {
    return PagedResponse.<T>builder()
        .success(true)
        .data(page.getContent())
        .pageInfo(PageInfo.from(page))
        .timestamp(Instant.now())
        .build();
  }

  /**
   * Create a successful paged response from Spring Data Page with message
   */
  public static <T> PagedResponse<T> of(Page<T> page, String message) {
    return PagedResponse.<T>builder()
        .success(true)
        .message(message)
        .data(page.getContent())
        .pageInfo(PageInfo.from(page))
        .timestamp(Instant.now())
        .build();
  }

  /**
   * Create a successful paged response manually
   */
  public static <T> PagedResponse<T> of(List<T> data, PageInfo pageInfo) {
    return PagedResponse.<T>builder()
        .success(true)
        .data(data)
        .pageInfo(pageInfo)
        .timestamp(Instant.now())
        .build();
  }

  /**
   * Create a successful paged response manually with message
   */
  public static <T> PagedResponse<T> of(List<T> data, PageInfo pageInfo, String message) {
    return PagedResponse.<T>builder()
        .success(true)
        .message(message)
        .data(data)
        .pageInfo(pageInfo)
        .timestamp(Instant.now())
        .build();
  }

  /**
   * Create an error paged response
   */
  public static <T> PagedResponse<T> error(String message) {
    return PagedResponse.<T>builder()
        .success(false)
        .message(message)
        .timestamp(Instant.now())
        .build();
  }
}
