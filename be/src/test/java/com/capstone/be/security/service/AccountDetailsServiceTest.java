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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

@ExtendWith(MockitoExtension.class)
class AccountDetailsServiceTest {

  @Mock
  private ReaderRepository readerRepository;
  @Mock
  private ReviewerRepository reviewerRepository;
  @Mock
  private OrganizationRepository organizationRepository;
  @Mock
  private BusinessAdminRepository businessAdminRepository;
  @Mock
  private SystemAdminRepository systemAdminRepository;

  private AccountDetailsService accountDetailsService;

  @BeforeEach
  void setUp() {
    accountDetailsService = new AccountDetailsService(readerRepository, reviewerRepository,
        organizationRepository, businessAdminRepository, systemAdminRepository);
  }

  @Test
  void loadPrincipal_readerSuccess() {
    Reader reader = new Reader();
    reader.setId(1L);
    reader.setEmail("reader@example.com");
    reader.setUsername("reader");
    reader.setPasswordHash("hash");
    reader.setStatus(ReaderStatus.VERIFIED);

    when(readerRepository.findById(1L)).thenReturn(Optional.of(reader));

    UserPrincipal principal = accountDetailsService.loadPrincipal(UserRole.READER, 1L);

    assertEquals(reader.getId(), principal.getId());
    assertEquals(UserRole.READER, principal.getRole());
    assertEquals(reader.getEmail(), principal.getUsername());
  }

  @Test
  void loadPrincipal_readerDeletedThrows() {
    Reader reader = new Reader();
    reader.setId(1L);
    reader.setEmail("reader@example.com");
    reader.setUsername("reader");
    reader.setPasswordHash("hash");
    reader.setDeleted(true);

    when(readerRepository.findById(1L)).thenReturn(Optional.of(reader));

    assertThrows(DisabledException.class,
        () -> accountDetailsService.loadPrincipal(UserRole.READER, 1L));
  }

  @Test
  void loadPrincipal_readerBannedThrows() {
    Reader reader = new Reader();
    reader.setId(1L);
    reader.setEmail("reader@example.com");
    reader.setUsername("reader");
    reader.setPasswordHash("hash");
    reader.setStatus(ReaderStatus.BANNED);

    when(readerRepository.findById(1L)).thenReturn(Optional.of(reader));

    assertThrows(LockedException.class,
        () -> accountDetailsService.loadPrincipal(UserRole.READER, 1L));
  }

  @Test
  void loadPrincipal_reviewerNotFoundThrows() {
    when(reviewerRepository.findById(2L)).thenReturn(Optional.empty());

    assertThrows(UsernameNotFoundException.class,
        () -> accountDetailsService.loadPrincipal(UserRole.REVIEWER, 2L));
  }

  @Test
  void loadPrincipal_reviewerInactiveThrows() {
    Reviewer reviewer = new Reviewer();
    reviewer.setId(2L);
    reviewer.setEmail("reviewer@example.com");
    reviewer.setPasswordHash("hash");
    reviewer.setActive(false);
    reviewer.setDeleted(false);

    when(reviewerRepository.findById(2L)).thenReturn(Optional.of(reviewer));

    assertThrows(DisabledException.class,
        () -> accountDetailsService.loadPrincipal(UserRole.REVIEWER, 2L));
  }
}
