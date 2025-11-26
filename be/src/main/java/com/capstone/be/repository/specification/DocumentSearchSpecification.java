package com.capstone.be.repository.specification;

import com.capstone.be.domain.entity.Document;
import com.capstone.be.domain.entity.DocumentTagLink;
import com.capstone.be.domain.enums.DocStatus;
import com.capstone.be.domain.enums.DocVisibility;
import com.capstone.be.dto.request.document.DocumentSearchFilter;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Subquery;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.jpa.domain.Specification;

/**
 * Specification for searching public documents
 * Only returns PUBLIC, VERIFIED documents
 */
public class DocumentSearchSpecification {

  /**
   * Build specification for public document search
   * Always filters for PUBLIC visibility and VERIFIED status
   *
   * @param filter Search filters (all optional)
   * @return Specification for the query
   */
  public static Specification<Document> buildSearchSpec(DocumentSearchFilter filter) {
    return (root, query, cb) -> {
      List<Predicate> predicates = new ArrayList<>();

      // CORE REQUIREMENTS: Only PUBLIC and VERIFIED documents
      predicates.add(cb.equal(root.get("visibility"), DocVisibility.PUBLIC));
      predicates.add(cb.equal(root.get("status"), DocStatus.VERIFIED));

      if (filter == null) {
        return cb.and(predicates.toArray(new Predicate[0]));
      }

      // Search keyword in title or description
      if (filter.getSearchKeyword() != null && !filter.getSearchKeyword().trim().isEmpty()) {
        String keyword = "%" + filter.getSearchKeyword().toLowerCase() + "%";
        Predicate titleMatch = cb.like(cb.lower(root.get("title")), keyword);
        Predicate descMatch = cb.like(cb.lower(root.get("description")), keyword);
        predicates.add(cb.or(titleMatch, descMatch));
      }

      // Filter by document type
      if (filter.getDocTypeId() != null) {
        predicates.add(cb.equal(root.get("docType").get("id"), filter.getDocTypeId()));
      }

      // Filter by specialization
      if (filter.getSpecializationId() != null) {
        predicates.add(cb.equal(root.get("specialization").get("id"),
            filter.getSpecializationId()));
      }

      // Filter by domain
      if (filter.getDomainId() != null) {
        predicates.add(cb.equal(root.get("specialization").get("domain").get("id"),
            filter.getDomainId()));
      }

      // Filter by organization
      if (filter.getOrganizationId() != null) {
        predicates.add(cb.equal(root.get("organization").get("id"), filter.getOrganizationId()));
      }

      // Filter by tags (document must have at least one of the specified tags)
      if (filter.getTagCodes() != null && !filter.getTagCodes().isEmpty()) {
        Subquery<Long> tagSubquery = query.subquery(Long.class);
        jakarta.persistence.criteria.Root<DocumentTagLink> tagLinkRoot = tagSubquery.from(
            DocumentTagLink.class);
        tagSubquery.select(cb.count(tagLinkRoot.get("id")))
            .where(
                cb.equal(tagLinkRoot.get("document"), root),
                tagLinkRoot.get("tag").get("code").in(filter.getTagCodes())
            );
        predicates.add(cb.greaterThan(tagSubquery, 0L));
      }

      // Filter by premium status
      if (filter.getIsPremium() != null) {
        predicates.add(cb.equal(root.get("isPremium"), filter.getIsPremium()));
      }

      return cb.and(predicates.toArray(new Predicate[0]));
    };
  }
}
