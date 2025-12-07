package com.capstone.be.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isA;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.capstone.be.domain.entity.ContactTicket;
import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.ContactStatus;
import com.capstone.be.dto.request.admin.CreateContactTicketRequest;
import com.capstone.be.dto.request.admin.UpdateContactTicketRequest;
import com.capstone.be.dto.response.admin.ContactTicketResponse;
import com.capstone.be.exception.ResourceNotFoundException;
import com.capstone.be.mapper.ContactTicketMapper;
import com.capstone.be.repository.ContactTicketRepository;
import com.capstone.be.repository.UserRepository;
import com.capstone.be.service.EmailService;
import com.capstone.be.service.NotificationService;
import com.capstone.be.service.impl.ContactTicketServiceImpl;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

@ExtendWith(MockitoExtension.class)
@DisplayName("ContactTicketService Unit Tests")
class ContactTicketServiceTest {

  @Mock
  private ContactTicketRepository contactTicketRepository;

  @Mock
  private UserRepository userRepository;

  @Mock
  private ContactTicketMapper contactTicketMapper;

  @Mock
  private NotificationService notificationService;

  @Mock
  private EmailService emailService;

  @InjectMocks
  private ContactTicketServiceImpl contactTicketService;

  private ContactTicket ticket;
  private User user;
  private UUID ticketId;
  private UUID userId;
  private String ticketCode;

  @BeforeEach
  void setUp() {
    ticketId = UUID.randomUUID();
    userId = UUID.randomUUID();
    ticketCode = "TKT-12345";

    user = User.builder()
        .id(userId)
        .email("user@example.com")
        .fullName("Test User")
        .build();

    ticket = ContactTicket.builder()
        .id(ticketId)
        .ticketCode(ticketCode)
        .email("user@example.com")
        .subject("Test Subject")
        .message("Test Message")
        .status(ContactStatus.NEW)
        .ipAddress("127.0.0.1")
        .user(user)
        .createdAt(Instant.now())
        .updatedAt(Instant.now())
        .build();
  }

  // test createTicket should create ticket for authenticated user
  @Test
  @DisplayName("createTicket should create ticket for authenticated user")
  void createTicket_ShouldCreateTicket_ForAuthenticatedUser() {
    CreateContactTicketRequest request = CreateContactTicketRequest.builder()
        .email("user@example.com")
        .subject("Test Subject")
        .message("Test Message")
        .build();

    ContactTicket newTicket = ContactTicket.builder()
        .id(ticketId)
        .ticketCode(ticketCode)
        .email("user@example.com")
        .subject("Test Subject")
        .message("Test Message")
        .status(ContactStatus.NEW)
        .user(user)
        .build();

    when(contactTicketMapper.toEntity(request)).thenReturn(newTicket);
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(contactTicketRepository.save(any(ContactTicket.class))).thenReturn(newTicket);

    ContactTicketResponse result = contactTicketService.createTicket(request, "127.0.0.1", userId);

    assertNotNull(result);
    assertEquals(ticketCode, result.getTicketCode());
    verify(contactTicketRepository, times(1)).save(any(ContactTicket.class));
  }

  // test createTicket should create ticket for guest
  @Test
  @DisplayName("createTicket should create ticket for guest")
  void createTicket_ShouldCreateTicket_ForGuest() {
    CreateContactTicketRequest request = CreateContactTicketRequest.builder()
        .email("guest@example.com")
        .subject("Test Subject")
        .message("Test Message")
        .build();

    ContactTicket newTicket = ContactTicket.builder()
        .id(ticketId)
        .ticketCode(ticketCode)
        .email("guest@example.com")
        .subject("Test Subject")
        .message("Test Message")
        .status(ContactStatus.NEW)
        .build();

    when(contactTicketMapper.toEntity(request)).thenReturn(newTicket);
    when(contactTicketRepository.save(any(ContactTicket.class))).thenReturn(newTicket);

    ContactTicketResponse result = contactTicketService.createTicket(request, "127.0.0.1", null);

    assertNotNull(result);
    verify(userRepository, never()).findById(any());
    verify(contactTicketRepository, times(1)).save(any(ContactTicket.class));
  }

  // test getTicketById should return ticket
  @Test
  @DisplayName("getTicketById should return ticket")
  void getTicketById_ShouldReturnTicket() {
    ContactTicketResponse response = ContactTicketResponse.builder()
        .ticketId(ticketId)
        .ticketCode(ticketCode)
        .email("user@example.com")
        .status(ContactStatus.NEW)
        .build();

    when(contactTicketRepository.findById(ticketId)).thenReturn(Optional.of(ticket));
    when(contactTicketMapper.toResponse(ticket)).thenReturn(response);

    ContactTicketResponse result = contactTicketService.getTicketById(ticketId);

    assertNotNull(result);
    assertEquals(ticketId, result.getTicketId());
    assertEquals(ticketCode, result.getTicketCode());
    verify(contactTicketRepository, times(1)).findById(ticketId);
  }

  // test getTicketById should throw exception when not found
  @Test
  @DisplayName("getTicketById should throw exception when not found")
  void getTicketById_ShouldThrowException_WhenNotFound() {
    UUID nonExistentId = UUID.randomUUID();
    when(contactTicketRepository.findById(nonExistentId)).thenReturn(Optional.empty());

    assertThrows(ResourceNotFoundException.class,
        () -> contactTicketService.getTicketById(nonExistentId));
    verify(contactTicketMapper, never()).toResponse(any());
  }

  // test getTicketByCode should return ticket
  @Test
  @DisplayName("getTicketByCode should return ticket")
  void getTicketByCode_ShouldReturnTicket() {
    ContactTicketResponse response = ContactTicketResponse.builder()
        .ticketId(ticketId)
        .ticketCode(ticketCode)
        .email("user@example.com")
        .status(ContactStatus.NEW)
        .build();

    when(contactTicketRepository.findByTicketCode(ticketCode)).thenReturn(Optional.of(ticket));
    when(contactTicketMapper.toResponse(ticket)).thenReturn(response);

    ContactTicketResponse result = contactTicketService.getTicketByCode(ticketCode);

    assertNotNull(result);
    assertEquals(ticketCode, result.getTicketCode());
    verify(contactTicketRepository, times(1)).findByTicketCode(ticketCode);
  }

  // test getTicketByCode should throw exception when not found
  @Test
  @DisplayName("getTicketByCode should throw exception when not found")
  void getTicketByCode_ShouldThrowException_WhenNotFound() {
    String nonExistentCode = "TKT-99999";
    when(contactTicketRepository.findByTicketCode(nonExistentCode)).thenReturn(Optional.empty());

    assertThrows(ResourceNotFoundException.class,
        () -> contactTicketService.getTicketByCode(nonExistentCode));
    verify(contactTicketMapper, never()).toResponse(any());
  }

  // test getTicketsWithFilters should return filtered tickets
  @Test
  @DisplayName("getTicketsWithFilters should return filtered tickets")
  void getTicketsWithFilters_ShouldReturnFilteredTickets() {
    Pageable pageable = PageRequest.of(0, 10);
    List<ContactTicket> tickets = Arrays.asList(ticket);
    Page<ContactTicket> ticketPage = new PageImpl<>(tickets, pageable, 1);

    ContactTicketResponse response = ContactTicketResponse.builder()
        .ticketId(ticketId)
        .ticketCode(ticketCode)
        .email("user@example.com")
        .status(ContactStatus.NEW)
        .build();

    when(contactTicketRepository.findAll(isA(Specification.class), eq(pageable)))
        .thenReturn(ticketPage);
    when(contactTicketMapper.toResponse(ticket)).thenReturn(response);

    Page<ContactTicketResponse> result =
        contactTicketService.getTicketsWithFilters(ContactStatus.NEW, null, pageable);

    assertNotNull(result);
    assertEquals(1, result.getTotalElements());
    verify(contactTicketRepository, times(1))
        .findAll(isA(Specification.class), eq(pageable));
  }

  // test getTicketsWithFilters should filter by email
  @Test
  @DisplayName("getTicketsWithFilters should filter by email")
  void getTicketsWithFilters_ShouldFilterByEmail() {
    Pageable pageable = PageRequest.of(0, 10);
    String emailFilter = "user@example.com";
    List<ContactTicket> tickets = Arrays.asList(ticket);
    Page<ContactTicket> ticketPage = new PageImpl<>(tickets, pageable, 1);

    ContactTicketResponse response = ContactTicketResponse.builder()
        .ticketId(ticketId)
        .ticketCode(ticketCode)
        .email("user@example.com")
        .status(ContactStatus.NEW)
        .build();

    when(contactTicketRepository.findAll(isA(Specification.class), eq(pageable)))
        .thenReturn(ticketPage);
    when(contactTicketMapper.toResponse(ticket)).thenReturn(response);

    Page<ContactTicketResponse> result =
        contactTicketService.getTicketsWithFilters(null, emailFilter, pageable);

    assertEquals(1, result.getTotalElements());
    assertEquals("user@example.com", result.getContent().get(0).getEmail());
  }

  // test updateTicket should update ticket
  @Test
  @DisplayName("updateTicket should update ticket")
  void updateTicket_ShouldUpdateTicket() {
    UpdateContactTicketRequest request = UpdateContactTicketRequest.builder()
        .status(ContactStatus.IN_PROGRESS)
        .adminNotes("Admin notes")
        .build();

    ContactTicket updatedTicket = ContactTicket.builder()
        .id(ticketId)
        .ticketCode(ticketCode)
        .status(ContactStatus.IN_PROGRESS)
        .adminNotes("Admin notes")
        .build();

    ContactTicketResponse response = ContactTicketResponse.builder()
        .ticketId(ticketId)
        .ticketCode(ticketCode)
        .status(ContactStatus.IN_PROGRESS)
        .adminNotes("Admin notes")
        .build();

    when(contactTicketRepository.findById(ticketId)).thenReturn(Optional.of(ticket));
    when(contactTicketRepository.save(any(ContactTicket.class))).thenReturn(updatedTicket);
    when(contactTicketMapper.toResponse(updatedTicket)).thenReturn(response);

    ContactTicketResponse result = contactTicketService.updateTicket(ticketId, request);

    assertEquals(ContactStatus.IN_PROGRESS, result.getStatus());
    assertEquals("Admin notes", result.getAdminNotes());
    verify(contactTicketRepository, times(1)).save(any(ContactTicket.class));
  }

  // test updateTicket should throw exception when not found
  @Test
  @DisplayName("updateTicket should throw exception when not found")
  void updateTicket_ShouldThrowException_WhenNotFound() {
    UUID nonExistentId = UUID.randomUUID();
    UpdateContactTicketRequest request = UpdateContactTicketRequest.builder()
        .status(ContactStatus.IN_PROGRESS)
        .build();

    when(contactTicketRepository.findById(nonExistentId)).thenReturn(Optional.empty());

    assertThrows(ResourceNotFoundException.class,
        () -> contactTicketService.updateTicket(nonExistentId, request));
    verify(contactTicketRepository, never()).save(any());
  }

  // test deleteTicket should delete ticket
  @Test
  @DisplayName("deleteTicket should delete ticket")
  void deleteTicket_ShouldDeleteTicket() {
    when(contactTicketRepository.findById(ticketId)).thenReturn(Optional.of(ticket));

    contactTicketService.deleteTicket(ticketId);

    verify(contactTicketRepository, times(1)).findById(ticketId);
    verify(contactTicketRepository, times(1)).delete(ticket);
  }

  // test deleteTicket should throw exception when not found
  @Test
  @DisplayName("deleteTicket should throw exception when not found")
  void deleteTicket_ShouldThrowException_WhenNotFound() {
    UUID nonExistentId = UUID.randomUUID();
    when(contactTicketRepository.findById(nonExistentId)).thenReturn(Optional.empty());

    assertThrows(ResourceNotFoundException.class,
        () -> contactTicketService.deleteTicket(nonExistentId));
    verify(contactTicketRepository, never()).delete(any(ContactTicket.class));
  }
}

