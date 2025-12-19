package com.capstone.be.util;

import java.util.List;
import org.springframework.data.domain.Sort;

public class PagingUtil {
  public static Sort parseSort(List<String> sorts) {
    if (sorts == null || sorts.isEmpty()) {
      return Sort.unsorted();
    }

    Sort result = Sort.unsorted();

    for (String sortSpec : sorts) {
      String[] parts = sortSpec.split(",");
      String field = parts[0];
      Sort.Direction direction =
          parts.length > 1 ? Sort.Direction.fromString(parts[1]) : Sort.Direction.ASC;

      result = result.and(Sort.by(direction, field));
    }

    return result;
  }

}
