package com.capstone.be.repository.specification;

import com.capstone.be.domain.entity.Tag;
import com.capstone.be.domain.enums.TagStatus;
import jakarta.persistence.criteria.Predicate;
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
   * @param status Tag status filter (ACTIVE, PENDING, REJECTED)
   * @param name   Tag name filter (partial match, case-insensitive)
   * @return Specification for querying Tag
   */
  public static Specification<Tag> withFilters(TagStatus status, String name) {
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

      return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
    };
  }
}
