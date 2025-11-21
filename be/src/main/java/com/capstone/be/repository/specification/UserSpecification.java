package com.capstone.be.repository.specification;

import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.UserRole;
import com.capstone.be.domain.enums.UserStatus;
import jakarta.persistence.criteria.Predicate;
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
}
