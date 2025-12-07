package com.capstone.be.repository.spec;

import com.capstone.be.domain.entity.Document;
import com.capstone.be.domain.entity.DocumentReview;
import com.capstone.be.domain.entity.Specialization;
import com.capstone.be.dto.request.review.ReviewHistoryFilterRequest;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Specification for filtering DocumentReview entities
 */
public class DocumentReviewSpecification {

  /**
   * Build specification for filtering review history by reviewer and optional filters
   *
   * @param reviewerId reviewer ID
   * @param filter     filter criteria (optional)
   * @return Specification for DocumentReview
   */
  public static Specification<DocumentReview> filterReviewHistory(UUID reviewerId, ReviewHistoryFilterRequest filter) {
    return (root, query, criteriaBuilder) -> {
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
          Join<DocumentReview, Document> documentJoin = root.join("document");
          predicates.add(criteriaBuilder.equal(documentJoin.get("docType").get("id"), filter.getDocTypeId()));
        }

        // Filter by domain
        if (filter.getDomainId() != null) {
          Join<DocumentReview, Document> documentJoin = root.join("document");
          Join<Document, Specialization> specializationJoin = documentJoin.join("specialization");
          predicates.add(criteriaBuilder.equal(specializationJoin.get("domain").get("id"), filter.getDomainId()));
        }
      }

      return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
    };
  }
}
