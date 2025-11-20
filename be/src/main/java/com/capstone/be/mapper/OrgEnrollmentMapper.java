package com.capstone.be.mapper;

import com.capstone.be.domain.entity.OrgEnrollment;
import com.capstone.be.dto.response.organization.OrgEnrollmentResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * Mapper for OrgEnrollment entity and DTOs
 */
@Mapper(componentModel = "spring")
public interface OrgEnrollmentMapper {

  /**
   * Convert OrgEnrollment entity to OrgEnrollmentResponse DTO
   *
   * @param enrollment OrgEnrollment entity
   * @return OrgEnrollmentResponse DTO
   */
  @Mapping(source = "id", target = "enrollmentId")
  @Mapping(source = "member.id", target = "memberId")
  @Mapping(source = "member.fullName", target = "memberFullName")
  @Mapping(source = "member.avatarUrl", target = "memberAvatarUrl")
  @Mapping(source = "organization.id", target = "organizationId")
  @Mapping(source = "organization.name", target = "organizationName")
  @Mapping(source = "createdAt", target = "invitedAt")
  @Mapping(source = "updatedAt", target = "respondedAt")
  OrgEnrollmentResponse toResponse(OrgEnrollment enrollment);
}
