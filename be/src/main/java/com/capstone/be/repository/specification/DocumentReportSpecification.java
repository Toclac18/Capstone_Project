package com.capstone.be.repository.specification;

import com.capstone.be.domain.entity.DocumentReport;
import com.capstone.be.domain.enums.ReportReason;
import com.capstone.be.domain.enums.ReportStatus;
import java.util.UUID;
import org.springframework.data.jpa.domain.Specification;

public class DocumentReportSpecification {

  public static Specification<DocumentReport> hasStatus(ReportStatus status) {
    return (root, query, criteriaBuilder) -> {
      if (status == null) {
        return null;
      }
      return criteriaBuilder.equal(root.get("status"), status);
    };
  }

  public static Specification<DocumentReport> hasReason(ReportReason reason) {
    return (root, query, criteriaBuilder) -> {
      if (reason == null) {
        return null;
      }
      return criteriaBuilder.equal(root.get("reason"), reason);
    };
  }

  public static Specification<DocumentReport> hasDocumentId(UUID documentId) {
    return (root, query, criteriaBuilder) -> {
      if (documentId == null) {
        return null;
      }
      return criteriaBuilder.equal(root.get("document").get("id"), documentId);
    };
  }

  public static Specification<DocumentReport> hasReporterId(UUID reporterId) {
    return (root, query, criteriaBuilder) -> {
      if (reporterId == null) {
        return null;
      }
      return criteriaBuilder.equal(root.get("reporter").get("id"), reporterId);
    };
  }

  public static Specification<DocumentReport> hasReviewedBy(UUID reviewedBy) {
    return (root, query, criteriaBuilder) -> {
      if (reviewedBy == null) {
        return null;
      }
      return criteriaBuilder.equal(root.get("reviewedBy").get("id"), reviewedBy);
    };
  }

  public static Specification<DocumentReport> withFilters(
      ReportStatus status,
      ReportReason reason,
      UUID documentId,
      UUID reporterId) {
    return Specification
        .where(hasStatus(status))
        .and(hasReason(reason))
        .and(hasDocumentId(documentId))
        .and(hasReporterId(reporterId));
  }
}
