package com.capstone.be.repository;

import com.capstone.be.domain.entity.TicketMessage;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TicketMessageRepository extends JpaRepository<TicketMessage, Long> {
  List<TicketMessage> findByTicketIdOrderByCreatedAtAsc(Long ticketId);
}
