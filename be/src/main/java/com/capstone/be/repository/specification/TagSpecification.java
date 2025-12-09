package com.capstone.be.repository.specification;

import com.capstone.be.domain.entity.Tag;
import com.capstone.be.domain.enums.TagStatus;
import jakarta.persistence.criteria.Predicate;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.jpa.domain.Specification;

/**
 * Specification for dynamic filtering of Tag entities
 */
public class TagSpecification {

  private TagSpecification() {
    // Private constructor to hide implicit public one
  }

  /**
   * Build dynamic specification based on filter criteria
   *
   * @param status   Tag status filter (ACTIVE, PENDING, REJECTED)
   * @param name     Tag name filter (partial match, case-insensitive)
   * @param dateFrom Filter by creation date from (optional)
   * @param dateTo   Filter by creation date to (optional)
   * @return Specification for querying Tag
   */
  public static Specification<Tag> withFilters(TagStatus status, String name, Instant dateFrom, Instant dateTo) {
    return (root, query, criteriaBuilder) -> {
      List<Predicate> predicates = new ArrayList<>();

      // Filter by status
      if (status != null) {
        predicates.add(criteriaBuilder.equal(root.get("status"), status));
      }

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
