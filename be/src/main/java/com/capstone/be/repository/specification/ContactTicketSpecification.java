package com.capstone.be.repository.specification;

import com.capstone.be.domain.entity.ContactTicket;
import com.capstone.be.domain.enums.ContactStatus;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.jpa.domain.Specification;

/**
 * Specification for dynamic filtering of ContactTicket entities
 */
public class ContactTicketSpecification {

  private ContactTicketSpecification() {
    // Private constructor to hide implicit public one
  }

  /**
   * Build dynamic specification based on filter criteria
   *
   * @param status Ticket status filter
   * @param email  Email filter
   * @return Specification for querying ContactTicket
   */
  public static Specification<ContactTicket> withFilters(ContactStatus status, String email) {
    return (root, query, criteriaBuilder) -> {
      List<Predicate> predicates = new ArrayList<>();

      // Filter by status
      if (status != null) {
        predicates.add(criteriaBuilder.equal(root.get("status"), status));
      }

      // Filter by email (case-insensitive partial match)
      if (email != null && !email.trim().isEmpty()) {
        predicates.add(
            criteriaBuilder.like(
                criteriaBuilder.lower(root.get("email")),
                "%" + email.toLowerCase().trim() + "%"
            )
        );
      }

      return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
    };
  }
}
