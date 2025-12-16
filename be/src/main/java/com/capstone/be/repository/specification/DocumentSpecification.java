package com.capstone.be.repository.specification;

import com.capstone.be.domain.entity.Document;
import com.capstone.be.domain.enums.DocStatus;
import com.capstone.be.domain.enums.DocVisibility;
import jakarta.persistence.criteria.Predicate;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.domain.Specification;

public class DocumentSpecification {

  private DocumentSpecification() {
  }

  public static Specification<Document> withFilters(
      String title,
      UUID uploaderId,
      UUID organizationId,
      UUID docTypeId,
      UUID specializationId,
      DocStatus status,
      DocVisibility visibility,
      Boolean isPremium,
      Instant dateFrom,
      Instant dateTo) {
    return (root, query, criteriaBuilder) -> {
      List<Predicate> predicates = new ArrayList<>();

      if (title != null && !title.trim().isEmpty()) {
        predicates.add(
            criteriaBuilder.like(
                criteriaBuilder.lower(root.get("title")),
                "%" + title.toLowerCase().trim() + "%"
            )
        );
      }

      if (uploaderId != null) {
        predicates.add(criteriaBuilder.equal(root.get("uploader").get("id"), uploaderId));
      }

      if (organizationId != null) {
        predicates.add(criteriaBuilder.equal(root.get("organization").get("id"), organizationId));
      }

      if (docTypeId != null) {
        predicates.add(criteriaBuilder.equal(root.get("docType").get("id"), docTypeId));
      }

      if (specializationId != null) {
        predicates.add(
            criteriaBuilder.equal(root.get("specialization").get("id"), specializationId));
      }

      if (status != null) {
        predicates.add(criteriaBuilder.equal(root.get("status"), status));
      } else {
        // If status is null (not filtered), exclude DELETED by default
        predicates.add(criteriaBuilder.notEqual(root.get("status"), DocStatus.DELETED));
      }

      if (visibility != null) {
        predicates.add(criteriaBuilder.equal(root.get("visibility"), visibility));
      }

      if (isPremium != null) {
        predicates.add(criteriaBuilder.equal(root.get("isPremium"), isPremium));
      }

      // Date range filter (createdAt)
      if (dateFrom != null) {
        predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("createdAt"), dateFrom));
      }

      if (dateTo != null) {
        predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("createdAt"), dateTo));
      }

      return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
    };
  }
}
