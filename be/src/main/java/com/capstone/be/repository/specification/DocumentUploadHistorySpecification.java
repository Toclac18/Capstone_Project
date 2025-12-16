package com.capstone.be.repository.specification;

import com.capstone.be.domain.entity.Document;
import com.capstone.be.dto.request.document.DocumentUploadHistoryFilter;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Date;
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
   * @param filter Filter criteria (searchKeyword, isPremium, dateFrom, dateTo, docTypeId, domainId, status)
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

        // Filter by date range (createdAt)
        if (filter.getDateFrom() != null) {
          ZonedDateTime startOfDay = filter.getDateFrom().atStartOfDay(ZoneId.systemDefault());
          Date dateFrom = Date.from(startOfDay.toInstant());
          predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), dateFrom));
        }

        if (filter.getDateTo() != null) {
          ZonedDateTime endOfDay = filter.getDateTo().atTime(LocalTime.MAX)
              .atZone(ZoneId.systemDefault());
          Date dateTo = Date.from(endOfDay.toInstant());
          predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), dateTo));
        }

        // Filter by document type
        if (filter.getDocTypeId() != null) {
          predicates.add(cb.equal(root.get("docType").get("id"), filter.getDocTypeId()));
        }

        // Filter by domain (through specialization)
        if (filter.getDomainId() != null) {
          Join<Object, Object> specializationJoin = root.join("specialization", JoinType.LEFT);
          predicates.add(
              cb.equal(specializationJoin.get("domain").get("id"), filter.getDomainId()));
        }

        // Filter by document status (single or multiple)
        var statusList = filter.getStatusList();
        if (statusList != null && !statusList.isEmpty()) {
          predicates.add(root.get("status").in(statusList));
        } else if (filter.getStatus() != null) {
          predicates.add(cb.equal(root.get("status"), filter.getStatus()));
        }
      }

      return cb.and(predicates.toArray(new Predicate[0]));
    };
  }
}
