package com.capstone.be.security.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import com.capstone.be.domain.entity.Reader;
import com.capstone.be.domain.entity.Reviewer;
import com.capstone.be.domain.enums.ReaderStatus;
import com.capstone.be.domain.enums.UserRole;
import com.capstone.be.repository.BusinessAdminRepository;
import com.capstone.be.repository.OrganizationRepository;
import com.capstone.be.repository.ReaderRepository;
import com.capstone.be.repository.ReviewerRepository;
import com.capstone.be.repository.SystemAdminRepository;
import com.capstone.be.security.model.UserPrincipal;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

@ExtendWith(MockitoExtension.class)
class AccountDetailsServiceTest {

  @Mock private ReaderRepository readerRepository;
  @Mock private ReviewerRepository reviewerRepository;
  @Mock private OrganizationRepository organizationRepository;
  @Mock private BusinessAdminRepository businessAdminRepository;
  @Mock private SystemAdminRepository systemAdminRepository;

  private AccountDetailsService accountDetailsService;

  @BeforeEach
  void setUp() {
    accountDetailsService =
        new AccountDetailsService(
            readerRepository,
            reviewerRepository,
            organizationRepository,
            businessAdminRepository,
            systemAdminRepository);
  }

  @Test
  void loadPrincipal_readerSuccess() {
    UUID readerId = UUID.randomUUID();
    Reader reader = new Reader();
    reader.setId(readerId);
    reader.setEmail("reader@example.com");
    reader.setUsername("reader");
    reader.setPasswordHash("hash");
    reader.setStatus(ReaderStatus.PENDING_VERIFICATION);

    when(readerRepository.findById(readerId)).thenReturn(Optional.of(reader));

    UserPrincipal principal = accountDetailsService.loadPrincipal(UserRole.READER, readerId);

    assertEquals(readerId, principal.getId());
    assertEquals(UserRole.READER, principal.getRole());
    assertEquals(reader.getEmail(), principal.getUsername());
  }

  @Test
  void loadPrincipal_readerDisabledThrows() {
    UUID readerId = UUID.randomUUID();
    Reader reader = new Reader();
    reader.setId(readerId);
    reader.setEmail("reader@example.com");
    reader.setUsername("reader");
    reader.setPasswordHash("hash");
    reader.setStatus(ReaderStatus.ACTIVE);

    when(readerRepository.findById(readerId)).thenReturn(Optional.of(reader));

    assertThrows(
        DisabledException.class,
        () -> accountDetailsService.loadPrincipal(UserRole.READER, readerId));
  }

  @Test
  void loadPrincipal_readerNotFoundThrows() {
    UUID readerId = UUID.randomUUID();
    when(readerRepository.findById(readerId)).thenReturn(Optional.empty());

    assertThrows(
        UsernameNotFoundException.class,
        () -> accountDetailsService.loadPrincipal(UserRole.READER, readerId));
  }

  @Test
  void loadPrincipal_reviewerNotFoundThrows() {
    UUID reviewerId = UUID.randomUUID();
    when(reviewerRepository.findById(reviewerId)).thenReturn(Optional.empty());

    assertThrows(
        UsernameNotFoundException.class,
        () -> accountDetailsService.loadPrincipal(UserRole.REVIEWER, reviewerId));
  }

  @Test
  void loadPrincipal_reviewerInactiveThrows() {
    UUID reviewerId = UUID.randomUUID();
    Reviewer reviewer = new Reviewer();
    reviewer.setId(reviewerId);
    reviewer.setEmail("reviewer@example.com");
    reviewer.setPasswordHash("hash");
    reviewer.setActive(false);
    reviewer.setDeleted(false);

    when(reviewerRepository.findById(reviewerId)).thenReturn(Optional.of(reviewer));

    assertThrows(
        DisabledException.class,
        () -> accountDetailsService.loadPrincipal(UserRole.REVIEWER, reviewerId));
  }
}
