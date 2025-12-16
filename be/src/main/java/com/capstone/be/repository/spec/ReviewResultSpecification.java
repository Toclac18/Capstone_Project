package com.capstone.be.repository.spec;

import com.capstone.be.domain.entity.Document;
import com.capstone.be.domain.entity.ReviewResult;
import com.capstone.be.domain.entity.Specialization;
import com.capstone.be.dto.request.review.ReviewHistoryFilterRequest;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Specification for filtering ReviewResult entities
 */
public class ReviewResultSpecification {

  /**
   * Build specification for filtering review history by reviewer and optional filters
   *
   * @param reviewerId reviewer ID
   * @param filter     filter criteria (optional)
   * @return Specification for ReviewResult
   */
  public static Specification<ReviewResult> filterReviewHistory(UUID reviewerId, ReviewHistoryFilterRequest filter) {
    return (root, query, criteriaBuilder) -> {
      // Store joins for reuse when filtering
      Join<ReviewResult, Document> documentJoin = null;
      Join<Document, Specialization> specializationJoin = null;

      // Check if we need to filter by document properties
      boolean needDocumentJoin = filter != null && (
          filter.getDocTypeId() != null || 
          filter.getDomainId() != null || 
          (filter.getSearch() != null && !filter.getSearch().trim().isEmpty())
      );

      // Eager load related entities to avoid lazy loading issues
      if (query != null && Long.class != query.getResultType()) {
        if (needDocumentJoin) {
          documentJoin = root.join("document", jakarta.persistence.criteria.JoinType.LEFT);
          if (filter.getDomainId() != null) {
            specializationJoin = documentJoin.join("specialization", jakarta.persistence.criteria.JoinType.LEFT);
          }
        } else {
          root.fetch("document", jakarta.persistence.criteria.JoinType.LEFT)
              .fetch("docType", jakarta.persistence.criteria.JoinType.LEFT);
          root.fetch("document", jakarta.persistence.criteria.JoinType.LEFT)
              .fetch("specialization", jakarta.persistence.criteria.JoinType.LEFT)
              .fetch("domain", jakarta.persistence.criteria.JoinType.LEFT);
        }
        root.fetch("reviewer", jakarta.persistence.criteria.JoinType.LEFT);
      } else if (needDocumentJoin) {
        documentJoin = root.join("document", jakarta.persistence.criteria.JoinType.LEFT);
        if (filter.getDomainId() != null) {
          specializationJoin = documentJoin.join("specialization", jakarta.persistence.criteria.JoinType.LEFT);
        }
      }

      List<Predicate> predicates = new ArrayList<>();

      // Filter by reviewer ID (required)
      predicates.add(criteriaBuilder.equal(root.get("reviewer").get("id"), reviewerId));

      if (filter != null) {
        // Filter by decision
        if (filter.getDecision() != null) {
          predicates.add(criteriaBuilder.equal(root.get("decision"), filter.getDecision()));
        }

        // Filter by date from
        if (filter.getDateFrom() != null) {
          predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("submittedAt"), filter.getDateFrom()));
        }

        // Filter by date to
        if (filter.getDateTo() != null) {
          predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("submittedAt"), filter.getDateTo()));
        }

        // Filter by document type
        if (filter.getDocTypeId() != null) {
          if (documentJoin == null) {
            documentJoin = root.join("document", jakarta.persistence.criteria.JoinType.LEFT);
          }
          predicates.add(criteriaBuilder.equal(documentJoin.get("docType").get("id"), filter.getDocTypeId()));
        }

        // Filter by domain
        if (filter.getDomainId() != null) {
          if (documentJoin == null) {
            documentJoin = root.join("document", jakarta.persistence.criteria.JoinType.LEFT);
          }
          if (specializationJoin == null) {
            specializationJoin = documentJoin.join("specialization", jakarta.persistence.criteria.JoinType.LEFT);
          }
          predicates.add(criteriaBuilder.equal(specializationJoin.get("domain").get("id"), filter.getDomainId()));
        }

        // Search by document title
        if (filter.getSearch() != null && !filter.getSearch().trim().isEmpty()) {
          if (documentJoin == null) {
            documentJoin = root.join("document", jakarta.persistence.criteria.JoinType.LEFT);
          }
          String searchPattern = "%" + filter.getSearch().trim().toLowerCase() + "%";
          predicates.add(criteriaBuilder.like(
              criteriaBuilder.lower(documentJoin.get("title")),
              searchPattern
          ));
        }
      }

      return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
    };
  }
}
