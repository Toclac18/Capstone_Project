package com.capstone.be.repository.specification;

import com.capstone.be.domain.entity.Document;
import com.capstone.be.domain.entity.DocumentRedemption;
import com.capstone.be.domain.enums.DocStatus;
import com.capstone.be.dto.request.document.DocumentLibraryFilter;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.domain.Specification;

/**
 * Simplified specification class for Document library filtering
 */
public class DocumentLibrarySpecification {

  /**
   * Build specification for user's library Includes documents uploaded by user OR purchased by
   * user
   *
   * @param userId User ID
   * @param filter Filter criteria (searchKeyword, isPremium, isOwned, isPurchased, dateFrom, dateTo, docTypeId, domainId)
   * @return Combined specification
   */
  public static Specification<Document> buildLibrarySpec(UUID userId,
      DocumentLibraryFilter filter) {
    return (root, query, cb) -> {
      List<Predicate> predicates = new ArrayList<>();

      // Core library condition: owned OR purchased
      Predicate libraryPredicate = buildLibraryPredicate(userId, filter, root, query, cb);
      if (libraryPredicate != null) {
        predicates.add(libraryPredicate);
      }

      // Only show ACTIVE documents in library (approved and published)
      predicates.add(cb.equal(root.get("status"), DocStatus.ACTIVE));

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
      }

      return cb.and(predicates.toArray(new Predicate[0]));
    };
  }

  /**
   * Builds the predicate to filter documents in the user's library.
   */
  private static Predicate buildLibraryPredicate(
      UUID userId,
      DocumentLibraryFilter filter,
      Root<Document> root,
      CriteriaQuery<?> query,
      CriteriaBuilder cb) {

    // Base predicate: documents uploaded by the user
    Predicate owned = cb.equal(root.get("uploader").get("id"), userId);

    // Check filter flags (mutually exclusive by design)
    if (filter != null && Boolean.TRUE.equals(filter.getIsOwned())) {
      return owned;
    }

    // Subquery: documents purchased by the user
    Subquery<UUID> purchasedSubquery = query.subquery(UUID.class);
    Root<DocumentRedemption> r = purchasedSubquery.from(DocumentRedemption.class);
    purchasedSubquery.select(r.get("document").get("id"))
        .where(cb.equal(r.get("reader").get("id"), userId));
    Predicate purchased = root.get("id").in(purchasedSubquery);

    if (filter != null && Boolean.TRUE.equals(filter.getIsPurchased())) {
      return purchased;
    }

    // Default: show everything in user's library → uploaded OR purchased
    return cb.or(owned, purchased);
  }
}
