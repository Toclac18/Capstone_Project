package com.capstone.be.repository.specification;

import com.capstone.be.domain.entity.OrgEnrollment;
import com.capstone.be.domain.entity.OrganizationProfile;
import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.OrgEnrollStatus;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.jpa.domain.Specification;

/**
 * JPA Specifications for OrgEnrollment queries
 * Supports dynamic filtering with multiple optional parameters
 */
public class OrgEnrollmentSpecification {

  /**
   * Build specification for organization members with filters
   *
   * @param organization Organization to filter by
   * @param status       Status filter (optional)
   * @param search       Search by member name or email (optional)
   * @return Specification for querying
   */
  public static Specification<OrgEnrollment> withFilters(
      OrganizationProfile organization,
      OrgEnrollStatus status,
      String search) {

    return (root, query, criteriaBuilder) -> {
      List<Predicate> predicates = new ArrayList<>();

      // Filter by organization (required)
      predicates.add(criteriaBuilder.equal(root.get("organization"), organization));

      // Filter by status (optional)
      if (status != null) {
        predicates.add(criteriaBuilder.equal(root.get("status"), status));
      }

      // Search by member name or email (optional)
      if (search != null && !search.trim().isEmpty()) {
        String searchPattern = "%" + search.toLowerCase() + "%";
        Join<OrgEnrollment, User> memberJoin = root.join("member");

        Predicate searchPredicate = criteriaBuilder.or(
            criteriaBuilder.like(
                criteriaBuilder.lower(memberJoin.get("fullName")),
                searchPattern
            ),
            criteriaBuilder.like(
                criteriaBuilder.lower(root.get("memberEmail")),
                searchPattern
            )
        );
        predicates.add(searchPredicate);
      }

      return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
    };
  }

  /**
   * Build specification for reader's enrollments with status filter
   *
   * @param member Reader/User
   * @param status Status filter (optional)
   * @return Specification for querying
   */
  public static Specification<OrgEnrollment> withMemberAndStatus(
      User member,
      OrgEnrollStatus status) {

    return (root, query, criteriaBuilder) -> {
      List<Predicate> predicates = new ArrayList<>();

      // Filter by member (required)
      predicates.add(criteriaBuilder.equal(root.get("member"), member));

      // Filter by status (optional)
      if (status != null) {
        predicates.add(criteriaBuilder.equal(root.get("status"), status));
      }

      return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
    };
  }
}
