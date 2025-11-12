package com.capstone.be.dto.base;

import org.springframework.data.domain.Page;

public record PageMeta(
    long totalElements,
    int totalPages,
    int page,
    int size,
    boolean first,
    boolean last
) {

  public static <T> PageMeta from(Page<T> page) {
    return new PageMeta(page.getTotalElements(),
        page.getTotalPages(),
        page.getNumber(),
        page.getSize(),
        page.isFirst(),
        page.isLast());
  }

}