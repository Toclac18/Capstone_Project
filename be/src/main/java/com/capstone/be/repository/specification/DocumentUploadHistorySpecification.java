package com.capstone.be.repository.specification;

import com.capstone.be.domain.entity.Document;
import com.capstone.be.dto.request.document.DocumentUploadHistoryFilter;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.domain.Specification;

/**
 * Specification class for Document upload history filtering
 */
public class DocumentUploadHistorySpecification {

  /**
   * Build specification for user's upload history
   * Includes documents uploaded by specific user with optional filters
   *
   * @param uploaderId Uploader user ID
   * @param filter Filter criteria (searchKeyword, isPremium)
   * @return Combined specification
   */
  public static Specification<Document> buildUploadHistorySpec(UUID uploaderId,
      DocumentUploadHistoryFilter filter) {
    return (root, query, cb) -> {
      List<Predicate> predicates = new ArrayList<>();

      // Core condition: uploaded by this user
      predicates.add(cb.equal(root.get("uploader").get("id"), uploaderId));

      // Apply additional filters
      if (filter != null) {
        // Search by keyword in title or description
        if (filter.getSearchKeyword() != null && !filter.getSearchKeyword().trim().isEmpty()) {
          String keyword = "%" + filter.getSearchKeyword().toLowerCase() + "%";
          Predicate titleMatch = cb.like(cb.lower(root.get("title")), keyword);
          Predicate descMatch = cb.like(cb.lower(root.get("description")), keyword);
          predicates.add(cb.or(titleMatch, descMatch));
        }

        // Filter by premium
        if (filter.getIsPremium() != null) {
          predicates.add(cb.equal(root.get("isPremium"), filter.getIsPremium()));
        }
      }

      return cb.and(predicates.toArray(new Predicate[0]));
    };
  }
}
