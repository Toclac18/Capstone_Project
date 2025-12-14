package com.capstone.be.repository.specification;

import com.capstone.be.domain.entity.OrganizationProfile;
import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.UserRole;
import com.capstone.be.domain.enums.UserStatus;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import java.time.Instant;
import org.springframework.data.jpa.domain.Specification;

/**
 * Specification class for User entity filtering
 * Provides reusable, type-safe, and composable query specifications
 */
public class UserSpecification {

  /**
   * Filter users by role
   * @param role the user role to filter by (nullable)
   * @return Specification that filters by role, or null if role is null
   */
  public static Specification<User> hasRole(UserRole role) {
    return (root, query, criteriaBuilder) -> {
      if (role == null) {
        return null;
      }
      return criteriaBuilder.equal(root.get("role"), role);
    };
  }

  /**
   * Filter users by status
   * @param status the user status to filter by (nullable)
   * @return Specification that filters by status, or null if status is null
   */
  public static Specification<User> hasStatus(UserStatus status) {
    return (root, query, criteriaBuilder) -> {
      if (status == null) {
        return null;
      }
      return criteriaBuilder.equal(root.get("status"), status);
    };
  }

  /**
   * Filter users by excluding a specific status
   * @param status the user status to exclude (nullable)
   * @return Specification that excludes the status, or null if status is null
   */
  public static Specification<User> hasStatusNot(UserStatus status) {
    return (root, query, criteriaBuilder) -> {
      if (status == null) {
        return null;
      }
      return criteriaBuilder.notEqual(root.get("status"), status);
    };
  }

  /**
   * Search users by keyword in email or full name (case-insensitive)
   * @param search the keyword to search for (nullable)
   * @return Specification that searches in email and fullName, or null if search is null/empty
   */
  public static Specification<User> searchByKeyword(String search) {
    return (root, query, criteriaBuilder) -> {
      if (search == null || search.trim().isEmpty()) {
        return null;
      }

      String searchPattern = "%" + search.toLowerCase() + "%";

      Predicate emailPredicate = criteriaBuilder.like(
          criteriaBuilder.lower(root.get("email")),
          searchPattern
      );

      Predicate fullNamePredicate = criteriaBuilder.like(
          criteriaBuilder.lower(root.get("fullName")),
          searchPattern
      );

      return criteriaBuilder.or(emailPredicate, fullNamePredicate);
    };
  }

  /**
   * Search organizations by keyword in multiple fields (case-insensitive)
   * Searches in:
   * - User email (Admin Email)
   * - OrganizationProfile name (Organization Name)
   * - OrganizationProfile email (Organization Email)
   * - OrganizationProfile hotline (Phone)
   * @param search the keyword to search for (nullable)
   * @return Specification that searches in multiple fields with subquery to OrganizationProfile
   */
  public static Specification<User> searchOrganizationsByKeyword(String search) {
    return (root, query, criteriaBuilder) -> {
      if (search == null || search.trim().isEmpty()) {
        return null;
      }

      String searchPattern = "%" + search.toLowerCase() + "%";

      // Search in User email (Admin Email)
      Predicate adminEmailPredicate = criteriaBuilder.like(
          criteriaBuilder.lower(root.get("email")),
          searchPattern
      );

      // Use exists subquery for OrganizationProfile searches
      // Search in OrganizationProfile name (Organization Name)
      Subquery<Long> orgNameSubquery = query.subquery(Long.class);
      Root<OrganizationProfile> orgNameRoot = orgNameSubquery.from(OrganizationProfile.class);
      orgNameSubquery.select(criteriaBuilder.literal(1L));
      orgNameSubquery.where(
          criteriaBuilder.and(
              criteriaBuilder.equal(orgNameRoot.get("admin"), root),
              criteriaBuilder.like(
                  criteriaBuilder.lower(orgNameRoot.get("name")),
                  searchPattern
              )
          )
      );

      // Search in OrganizationProfile email (Organization Email)
      Subquery<Long> orgEmailSubquery = query.subquery(Long.class);
      Root<OrganizationProfile> orgEmailRoot = orgEmailSubquery.from(OrganizationProfile.class);
      orgEmailSubquery.select(criteriaBuilder.literal(1L));
      orgEmailSubquery.where(
          criteriaBuilder.and(
              criteriaBuilder.equal(orgEmailRoot.get("admin"), root),
              criteriaBuilder.like(
                  criteriaBuilder.lower(orgEmailRoot.get("email")),
                  searchPattern
              )
          )
      );

      // Search in OrganizationProfile hotline (Phone)
      Subquery<Long> phoneSubquery = query.subquery(Long.class);
      Root<OrganizationProfile> phoneRoot = phoneSubquery.from(OrganizationProfile.class);
      phoneSubquery.select(criteriaBuilder.literal(1L));
      phoneSubquery.where(
          criteriaBuilder.and(
              criteriaBuilder.equal(phoneRoot.get("admin"), root),
              criteriaBuilder.like(
                  criteriaBuilder.lower(phoneRoot.get("hotline")),
                  searchPattern
              )
          )
      );

      return criteriaBuilder.or(
          adminEmailPredicate,
          criteriaBuilder.exists(orgNameSubquery),
          criteriaBuilder.exists(orgEmailSubquery),
          criteriaBuilder.exists(phoneSubquery)
      );
    };
  }

  /**
   * Filter users by created date range
   * @param dateFrom start date (nullable)
   * @param dateTo end date (nullable)
   * @return Specification that filters by date range, or null if both dates are null
   */
  public static Specification<User> createdBetween(Instant dateFrom, Instant dateTo) {
    return (root, query, criteriaBuilder) -> {
      if (dateFrom == null && dateTo == null) {
        return null;
      }

      Predicate predicate = null;
      if (dateFrom != null) {
        predicate = criteriaBuilder.greaterThanOrEqualTo(root.get("createdAt"), dateFrom);
      }
      if (dateTo != null) {
        Predicate dateToPredicate = criteriaBuilder.lessThanOrEqualTo(root.get("createdAt"), dateTo);
        if (predicate == null) {
          predicate = dateToPredicate;
        } else {
          predicate = criteriaBuilder.and(predicate, dateToPredicate);
        }
      }

      return predicate;
    };
  }

  /**
   * Combine all user filters
   * @param role the user role to filter by (nullable)
   * @param status the user status to filter by (nullable)
   * @param search the keyword to search for (nullable)
   * @return Combined Specification with all filters applied
   */
  public static Specification<User> withFilters(UserRole role, UserStatus status, String search) {
    return Specification
        .where(hasRole(role))
        .and(hasStatus(status))
        .and(searchByKeyword(search));
  }

  /**
   * Combine all user filters including date range
   * @param role the user role to filter by (nullable)
   * @param status the user status to filter by (nullable)
   * @param search the keyword to search for (nullable)
   * @param dateFrom start date (nullable)
   * @param dateTo end date (nullable)
   * @return Combined Specification with all filters applied
   */
  public static Specification<User> withFilters(
      UserRole role, UserStatus status, String search, Instant dateFrom, Instant dateTo) {
    return Specification
        .where(hasRole(role))
        .and(hasStatus(status))
        .and(searchByKeyword(search))
        .and(createdBetween(dateFrom, dateTo));
  }
}
