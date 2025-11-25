package com.capstone.be.repository.specification;

import com.capstone.be.domain.entity.Document;
import com.capstone.be.domain.entity.DocumentRedemption;
import com.capstone.be.dto.request.document.DocumentLibraryFilter;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import java.util.ArrayList;
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
   * @param filter Filter criteria (searchKeyword, isPremium, isOwned, isPurchased)
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

  /**
   * Build predicate for library membership (owned OR purchased)
   */
  private static Predicate buildLibraryPredicate(UUID userId, DocumentLibraryFilter filter,
      Root<Document> root,
      CriteriaQuery<?> query,
      CriteriaBuilder cb) {

    List<Predicate> libraryPredicates = new ArrayList<>();

    // If specific ownership filter is requested
    if (filter != null && filter.getIsOwned() != null && filter.getIsOwned()) {
      libraryPredicates.add(cb.equal(root.get("uploader").get("id"), userId));
    } else if (filter != null && filter.getIsPurchased() != null && filter.getIsPurchased()) {
      // Only purchased documents
      Subquery<UUID> purchaseSubquery = query.subquery(UUID.class);
      var redemptionRoot = purchaseSubquery.from(DocumentRedemption.class);
      purchaseSubquery.select(redemptionRoot.get("document").get("id"))
          .where(cb.equal(redemptionRoot.get("reader").get("id"), userId));
      libraryPredicates.add(root.get("id").in(purchaseSubquery));
    } else {
      // Default: both owned AND purchased
      Predicate ownedPredicate = cb.equal(root.get("uploader").get("id"), userId);

      Subquery<UUID> purchaseSubquery = query.subquery(UUID.class);
      var redemptionRoot = purchaseSubquery.from(DocumentRedemption.class);
      purchaseSubquery.select(redemptionRoot.get("document").get("id"))
          .where(cb.equal(redemptionRoot.get("reader").get("id"), userId));
      Predicate purchasedPredicate = root.get("id").in(purchaseSubquery);

      libraryPredicates.add(cb.or(ownedPredicate, purchasedPredicate));
    }

    return cb.or(libraryPredicates.toArray(new Predicate[0]));
  }
}
