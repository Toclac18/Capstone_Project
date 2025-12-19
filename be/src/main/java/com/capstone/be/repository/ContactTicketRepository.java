    package com.capstone.be.repository;

import com.capstone.be.domain.entity.ContactTicket;
import com.capstone.be.domain.enums.ContactStatus;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

/**
 * Repository for ContactTicket entity
 */
@Repository
public interface ContactTicketRepository extends JpaRepository<ContactTicket, UUID>,
    JpaSpecificationExecutor<ContactTicket> {

  /**
   * Find ticket by ticket code
   */
  Optional<ContactTicket> findByTicketCode(String ticketCode);

  /**
   * Find all tickets by status with pagination
   */
  Page<ContactTicket> findByStatus(ContactStatus status, Pageable pageable);

  /**
   * Find all tickets by email with pagination
   */
  Page<ContactTicket> findByEmail(String email, Pageable pageable);
}
