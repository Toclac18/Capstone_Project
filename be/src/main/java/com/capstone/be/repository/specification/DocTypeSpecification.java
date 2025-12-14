package com.capstone.be.repository.specification;

import com.capstone.be.domain.entity.DocType;
import jakarta.persistence.criteria.Predicate;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.jpa.domain.Specification;

/**
 * Specification for dynamic filtering of DocType entities
 */
public class DocTypeSpecification {

  private DocTypeSpecification() {
    // Private constructor to hide implicit public one
  }

  /**
   * Build dynamic specification based on filter criteria
   *
   * @param name     DocType name filter (partial match, case-insensitive)
   * @param dateFrom Filter by creation date from (optional)
   * @param dateTo   Filter by creation date to (optional)
   * @return Specification for querying DocType
   */
  public static Specification<DocType> withFilters(String name, Instant dateFrom, Instant dateTo) {
    return (root, query, criteriaBuilder) -> {
      List<Predicate> predicates = new ArrayList<>();

      // Filter by name (case-insensitive partial match)
      if (name != null && !name.trim().isEmpty()) {
        predicates.add(
            criteriaBuilder.like(
                criteriaBuilder.lower(root.get("name")),
                "%" + name.toLowerCase().trim() + "%"
            )
        );
      }

      // Filter by creation date range
      if (dateFrom != null) {
        predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("createdAt"), dateFrom));
      }
      if (dateTo != null) {
        // dateTo is already end of day from frontend (23:59:59.999 UTC)
        predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("createdAt"), dateTo));
      }

      return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
    };
  }
}
