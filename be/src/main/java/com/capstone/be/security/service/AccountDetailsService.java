package com.capstone.be.security.service;

import com.capstone.be.domain.enums.UserRole;
import com.capstone.be.repository.BusinessAdminRepository;
import com.capstone.be.repository.OrganizationRepository;
import com.capstone.be.repository.ReaderRepository;
import com.capstone.be.repository.ReviewerRepository;
import com.capstone.be.repository.SystemAdminRepository;
import com.capstone.be.security.model.UserPrincipal;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AccountDetailsService {

  private final ReaderRepository readerRepository;
  private final ReviewerRepository reviewerRepository;
  private final OrganizationRepository organizationRepository;
  private final BusinessAdminRepository businessAdminRepository;
  private final SystemAdminRepository systemAdminRepository;

  public AccountDetailsService(ReaderRepository readerRepository,
      ReviewerRepository reviewerRepository,
      OrganizationRepository organizationRepository,
      BusinessAdminRepository businessAdminRepository,
      SystemAdminRepository systemAdminRepository) {
    this.readerRepository = readerRepository;
    this.reviewerRepository = reviewerRepository;
    this.organizationRepository = organizationRepository;
    this.businessAdminRepository = businessAdminRepository;
    this.systemAdminRepository = systemAdminRepository;
  }

  @Transactional(readOnly = true)
  public UserPrincipal loadPrincipal(UserRole role, Long userId) {
    return switch (role) {
      case READER -> readerRepository.findById(userId)
          .map(UserPrincipal::fromReader)
          .map(this::ensureEnabled)
          .orElseThrow(() -> new UsernameNotFoundException("Reader not found"));
      case REVIEWER -> reviewerRepository.findById(userId)
          .map(UserPrincipal::fromReviewer)
          .map(this::ensureEnabled)
          .orElseThrow(() -> new UsernameNotFoundException("Reviewer not found"));
      case ORGANIZATION -> organizationRepository.findById(userId)
          .map(UserPrincipal::fromOrganization)
          .map(this::ensureEnabled)
          .orElseThrow(() -> new UsernameNotFoundException("Organization not found"));
      case BUSINESS_ADMIN -> businessAdminRepository.findById(userId)
          .map(UserPrincipal::fromBusinessAdmin)
          .map(this::ensureEnabled)
          .orElseThrow(() -> new UsernameNotFoundException("Business admin not found"));
      case SYSTEM_ADMIN -> systemAdminRepository.findById(userId)
          .map(UserPrincipal::fromSystemAdmin)
          .map(this::ensureEnabled)
          .orElseThrow(() -> new UsernameNotFoundException("System admin not found"));
    };
  }

  private UserPrincipal ensureEnabled(UserPrincipal principal) {
    if (!principal.isEnabled()) {
      throw new DisabledException("Account is disabled");
    }
    if (!principal.isAccountNonLocked()) {
      throw new LockedException("Account is locked");
    }
    return principal;
  }
}
