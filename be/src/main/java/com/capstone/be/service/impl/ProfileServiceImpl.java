package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.BusinessAdmin;
import com.capstone.be.domain.entity.Organization;
import com.capstone.be.domain.entity.Reader;
import com.capstone.be.domain.entity.Reviewer;
import com.capstone.be.domain.entity.SystemAdmin;
import com.capstone.be.domain.enums.UserRole;
import com.capstone.be.dto.response.ProfileResponse;
import com.capstone.be.repository.BusinessAdminRepository;
import com.capstone.be.repository.OrganizationRepository;
import com.capstone.be.repository.ReaderRepository;
import com.capstone.be.repository.ReviewerRepository;
import com.capstone.be.repository.SystemAdminRepository;
import com.capstone.be.service.ProfileService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class ProfileServiceImpl implements ProfileService {

  private final ReaderRepository readerRepository;
  private final ReviewerRepository reviewerRepository;
  private final OrganizationRepository organizationRepository;
  private final BusinessAdminRepository businessAdminRepository;
  private final SystemAdminRepository systemAdminRepository;

  @Override
  @Transactional(readOnly = true)
  public ProfileResponse getProfile(UUID subjectId, UserRole role) {
    return switch (role) {
      case READER -> getReaderProfile(subjectId);
      case REVIEWER -> getReviewerProfile(subjectId);
      case ORGANIZATION -> getOrganizationProfile(subjectId);
      case BUSINESS_ADMIN -> getBusinessAdminProfile(subjectId);
      case SYSTEM_ADMIN -> getSystemAdminProfile(subjectId);
    };
  }

  private ProfileResponse getReaderProfile(UUID subjectId) {
    Reader reader = readerRepository.findById(subjectId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reader not found"));

    return ProfileResponse.builder()
        .id(reader.getId())
        .role(UserRole.READER)
        .email(reader.getEmail())
        .fullName(reader.getFullName())
        .dateOfBirth(reader.getDateOfBirth())
        .username(reader.getUsername())
        .coinBalance(reader.getPoint())
        .status(reader.getStatus())
        .build();
  }

  private ProfileResponse getReviewerProfile(UUID subjectId) {
    Reviewer reviewer = reviewerRepository.findById(subjectId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reviewer not found"));

    return ProfileResponse.builder()
        .id(reviewer.getId())
        .role(UserRole.REVIEWER)
        .email(reviewer.getEmail())
        .fullName(reviewer.getFullName())
        .dateOfBirth(reviewer.getDateOfBirth())
        .username(reviewer.getUsername())
        .ordid(reviewer.getOrdid())
        .active(Boolean.TRUE.equals(reviewer.getActive()))
        .deleted(Boolean.TRUE.equals(reviewer.getDeleted()))
        .build();
  }

  private ProfileResponse getOrganizationProfile(UUID subjectId) {
    Organization organization = organizationRepository.findById(subjectId)
        .orElseThrow(
            () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Organization not found"));

    return ProfileResponse.builder()
        .id(organization.getId())
        .role(UserRole.ORGANIZATION)
        .email(organization.getAdminEmail())
        .fullName(organization.getAdminName())
        .organizationName(organization.getName()) // Using email as organization name
        .organizationEmail(organization.getAdminEmail())
        .organizationHotline(organization.getHotline())
        .organizationLogo(organization.getLogo())
        .organizationAddress(organization.getAddress())
        .active(Boolean.TRUE.equals(organization.getActive()))
        .deleted(Boolean.TRUE.equals(organization.getDeleted()))
        .build();
  }

  private ProfileResponse getBusinessAdminProfile(UUID subjectId) {
    BusinessAdmin admin = businessAdminRepository.findById(subjectId)
        .orElseThrow(
            () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Business Admin not found"));

    return ProfileResponse.builder()
        .id(admin.getId())
        .role(UserRole.BUSINESS_ADMIN)
        .email(admin.getEmail())
        .fullName(admin.getFullName())
        .active(Boolean.TRUE.equals(admin.getActive()))
        .deleted(Boolean.TRUE.equals(admin.getDeleted()))
        .build();
  }

  private ProfileResponse getSystemAdminProfile(UUID subjectId) {
    SystemAdmin admin = systemAdminRepository.findById(subjectId)
        .orElseThrow(
            () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "System Admin not found"));

    return ProfileResponse.builder()
        .id(admin.getId())
        .role(UserRole.SYSTEM_ADMIN)
        .email(admin.getEmail())
        .fullName(admin.getFullName())
        .active(Boolean.TRUE.equals(admin.getActive()))
        .deleted(Boolean.TRUE.equals(admin.getDeleted()))
        .build();
  }
}
