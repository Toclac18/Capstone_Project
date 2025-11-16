package com.capstone.be.mapper;

import com.capstone.be.domain.entity.OrganizationProfile;
import com.capstone.be.domain.entity.User;
import com.capstone.be.dto.response.organization.PendingOrganizationResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * MapStruct mapper for Organization Approval DTOs
 */
@Mapper
public interface OrganizationApprovalMapper {

  /**
   * Map User (admin) and OrganizationProfile to PendingOrganizationResponse
   */
  @Mapping(target = "adminUserId", source = "admin.id")
  @Mapping(target = "adminEmail", source = "admin.email")
  @Mapping(target = "adminFullName", source = "admin.fullName")
  @Mapping(target = "adminStatus", source = "admin.status")
  @Mapping(target = "registeredAt", source = "admin.createdAt")
  @Mapping(target = "organizationProfileId", source = "organizationProfile.id")
  @Mapping(target = "organizationName", source = "organizationProfile.name")
  @Mapping(target = "organizationType", source = "organizationProfile.type")
  @Mapping(target = "organizationEmail", source = "organizationProfile.email")
  @Mapping(target = "hotline", source = "organizationProfile.hotline")
  @Mapping(target = "address", source = "organizationProfile.address")
  @Mapping(target = "registrationNumber", source = "organizationProfile.registrationNumber")
  @Mapping(target = "logo", source = "organizationProfile.logo")
  PendingOrganizationResponse toPendingOrganizationResponse(
      User admin,
      OrganizationProfile organizationProfile
  );
}
