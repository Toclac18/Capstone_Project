package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.Ticket;
import com.capstone.be.domain.entity.TicketMessage;
import com.capstone.be.domain.enums.MsgAuthorType;
import com.capstone.be.domain.enums.TicketStatus;
import com.capstone.be.dto.request.contactAdmin.ContactAdminRequest;
import com.capstone.be.dto.response.ContactAdminResponse;
import com.capstone.be.repository.TicketMessageRepository;
import com.capstone.be.repository.TicketRepository;
import com.capstone.be.service.ContactAdminService;
import com.capstone.be.util.TicketCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContactAdminServiceImpl implements ContactAdminService {

  private final TicketRepository ticketRepository;
  private final TicketMessageRepository ticketMessageRepository;

  @Override
  @Transactional
  public ContactAdminResponse createTicket(ContactAdminRequest req) {

    Ticket t = new Ticket();
    t.setRequesterName(req.getName());
    t.setRequesterEmail(req.getEmail());
    t.setSubject(req.getSubject());
    t.setCategory(req.getCategory());
    t.setUrgency(req.getUrgency());
    t.setStatus(TicketStatus.OPEN);
    t.setMessage(req.getMessage());
    t.setTicketCode(TicketCode.generate());

    Ticket saved = ticketRepository.save(t);

    TicketMessage m = new TicketMessage();
    m.setTicketId(saved.getTicketId());
    m.setAuthorType(MsgAuthorType.USER);
    m.setAuthorUserId(null);
    m.setBody(req.getMessage());
    ticketMessageRepository.save(m);

    ContactAdminResponse res = new ContactAdminResponse();
    res.setTicketId(String.valueOf(saved.getTicketId()));
    res.setTicketCode(saved.getTicketCode());
    res.setStatus(saved.getStatus().name());
    res.setMessage("Your message has been received. We'll get back to you shortly.");
    return res;
  }
}
