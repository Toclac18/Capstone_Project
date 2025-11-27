package com.capstone.be.repository.specification;

import com.capstone.be.domain.entity.Specialization;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.domain.Specification;

/**
 * Specification for dynamic filtering of Specialization entities
 */
public class SpecializationSpecification {

  private SpecializationSpecification() {
    // Private constructor to hide implicit public one
  }

  /**
   * Build dynamic specification based on filter criteria
   *
   * @param domainId Domain ID filter (optional)
   * @param name     Specialization name filter (partial match, case-insensitive)
   * @return Specification for querying Specialization
   */
  public static Specification<Specialization> withFilters(UUID domainId, String name) {
    return (root, query, criteriaBuilder) -> {
      List<Predicate> predicates = new ArrayList<>();

      // Filter by domain ID
      if (domainId != null) {
        predicates.add(criteriaBuilder.equal(root.get("domain").get("id"), domainId));
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
