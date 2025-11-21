package com.capstone.be.dto.common;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;

/**
 * Pagination metadata
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageInfo {

  private int page;          // Current page number (0-based)
  private int size;          // Number of items per page
  private long totalElements; // Total number of elements
  private int totalPages;    // Total number of pages
  private boolean first;     // Is this the first page?
  private boolean last;      // Is this the last page?
  private boolean hasNext;   // Has next page?
  private boolean hasPrevious; // Has previous page?

  /**
   * Create PageInfo from Spring Data Page object
   */
  public static PageInfo from(Page<?> page) {
    return PageInfo.builder()
        .page(page.getNumber())
        .size(page.getSize())
        .totalElements(page.getTotalElements())
        .totalPages(page.getTotalPages())
        .first(page.isFirst())
        .last(page.isLast())
        .hasNext(page.hasNext())
        .hasPrevious(page.hasPrevious())
        .build();
  }

  /**
   * Create PageInfo manually
   */
  public static PageInfo of(int page, int size, long totalElements) {
    int totalPages = (int) Math.ceil((double) totalElements / size);
    return PageInfo.builder()
        .page(page)
        .size(size)
        .totalElements(totalElements)
        .totalPages(totalPages)
        .first(page == 0)
        .last(page >= totalPages - 1)
        .hasNext(page < totalPages - 1)
        .hasPrevious(page > 0)
        .build();
  }
}
