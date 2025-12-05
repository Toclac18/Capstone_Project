package com.capstone.be.repository.specification;

import com.capstone.be.domain.entity.Document;
import com.capstone.be.domain.entity.DocumentTagLink;
import com.capstone.be.domain.enums.DocStatus;
import com.capstone.be.domain.enums.DocVisibility;
import com.capstone.be.dto.request.document.DocumentSearchFilter;
import jakarta.persistence.criteria.Predicate;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
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

      // Search keyword in multiple fields
      if (filter.getSearchKeyword() != null && !filter.getSearchKeyword().trim().isEmpty()) {
        String keyword = "%" + filter.getSearchKeyword().trim().toLowerCase() + "%";

        // Core fields
        Predicate titleMatch = cb.like(cb.lower(root.get("title")), keyword);
        Predicate descMatch = cb.like(cb.lower(root.get("description")), keyword);

        // Uploader full name
        Predicate uploaderMatch = cb.like(cb.lower(root.get("uploader").get("fullName")), keyword);

        // Embedded summarizations (short / medium / detailed)
        Predicate shortSummaryMatch = cb.like(
                cb.lower(root.get("summarizations").get("shortSummary")), keyword);
        Predicate mediumSummaryMatch = cb.like(
                cb.lower(root.get("summarizations").get("mediumSummary")), keyword);
        Predicate detailedSummaryMatch = cb.like(
                cb.lower(root.get("summarizations").get("detailedSummary")), keyword);

        predicates.add(cb.or(
                titleMatch,
                descMatch,
                uploaderMatch,
                shortSummaryMatch,
                mediumSummaryMatch,
                detailedSummaryMatch
        ));
      }

      // ===== Document type =====
      if (filter != null) {

        // DOC TYPE (multi trước, single sau)
        if (filter.getDocTypeIds() != null && !filter.getDocTypeIds().isEmpty()) {
          predicates.add(root.get("docType").get("id").in(filter.getDocTypeIds()));
        } else if (filter.getDocTypeId() != null) {
          predicates.add(cb.equal(root.get("docType").get("id"), filter.getDocTypeId()));
        }

        // SPECIALIZATION
        if (filter.getSpecializationIds() != null && !filter.getSpecializationIds().isEmpty()) {
          predicates.add(root.get("specialization").get("id")
                  .in(filter.getSpecializationIds()));
        } else if (filter.getSpecializationId() != null) {
          predicates.add(cb.equal(root.get("specialization").get("id"),
                  filter.getSpecializationId()));
        }

        // DOMAIN (qua specialization.domain)
        if (filter.getDomainIds() != null && !filter.getDomainIds().isEmpty()) {
          predicates.add(root.get("specialization").get("domain").get("id")
                  .in(filter.getDomainIds()));
        } else if (filter.getDomainId() != null) {
          predicates.add(cb.equal(root.get("specialization").get("domain").get("id"),
                  filter.getDomainId()));
        }

        // ORGANIZATION
        if (filter.getOrganizationIds() != null && !filter.getOrganizationIds().isEmpty()) {
          predicates.add(root.get("organization").get("id")
                  .in(filter.getOrganizationIds()));
        } else if (filter.getOrganizationId() != null) {
          predicates.add(cb.equal(root.get("organization").get("id"),
                  filter.getOrganizationId()));
        }

        // TAGS: ít nhất một trong tagIds (subquery)
        if (filter.getTagIds() != null && !filter.getTagIds().isEmpty()) {
          assert query != null;
          var tagSub = query.subquery(Long.class);
          var tagLinkRoot = tagSub.from(DocumentTagLink.class);

          tagSub.select(cb.count(tagLinkRoot.get("id")))
                  .where(
                          cb.equal(tagLinkRoot.get("document"), root),
                          tagLinkRoot.get("tag").get("tag_id").in(filter.getTagIds())
                  );

          predicates.add(cb.greaterThan(tagSub, 0L));
        } else if (filter.getTagId() != null) {
          assert query != null;
          var tagSub = query.subquery(Long.class);
          var tagLinkRoot = tagSub.from(DocumentTagLink.class);

          tagSub.select(cb.count(tagLinkRoot.get("id")))
                  .where(
                          cb.equal(tagLinkRoot.get("document"), root),
                          tagLinkRoot.get("tag").get("tag_id").in(filter.getTagId())
                  );

          predicates.add(cb.greaterThan(tagSub, 0L));
        }

        // PREMIUM
        if (filter.getIsPremium() != null) {
          predicates.add(cb.equal(root.get("isPremium"), filter.getIsPremium()));
        }

        // YEAR FILTER
        if (filter.getYearFrom() != null) {
          Instant start = LocalDate.of(filter.getYearFrom(), 1, 1)
                  .atStartOfDay(ZoneOffset.UTC)
                  .toInstant();
          predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), start));
        }

        if (filter.getYearTo() != null) {
          Instant end = LocalDate.of(filter.getYearTo(), 12, 31)
                  .atTime(23, 59, 59)
                  .toInstant(ZoneOffset.UTC);
          predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), end));
        }

        // PRICE RANGE
        if (filter.getPriceFrom() != null) {
          predicates.add(cb.greaterThanOrEqualTo(
                  root.get("price"), filter.getPriceFrom()));
        }
        if (filter.getPriceTo() != null) {
          predicates.add(cb.lessThanOrEqualTo(
                  root.get("price"), filter.getPriceTo()));
        }
      }

      return cb.and(predicates.toArray(new Predicate[0]));
    };
  }
}
