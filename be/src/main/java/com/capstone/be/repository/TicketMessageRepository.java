package com.capstone.be.repository;

import com.capstone.be.domain.entity.TicketMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface TicketMessageRepository extends JpaRepository<TicketMessage, Long> {
    List<TicketMessage> findByTicketIdOrderByCreatedAtAsc(Long ticketId);
}