package com.capstone.be.mapper;

import com.capstone.be.domain.entity.OrganizationProfile;
import com.capstone.be.domain.entity.ReaderProfile;
import com.capstone.be.domain.entity.ReviewerProfile;
import com.capstone.be.domain.entity.User;
import com.capstone.be.dto.request.auth.RegisterOrganizationRequest;
import com.capstone.be.dto.request.auth.RegisterReaderRequest;
import com.capstone.be.dto.request.auth.RegisterReviewerRequest;
import com.capstone.be.dto.response.auth.AuthResponse;
import com.capstone.be.security.model.UserPrincipal;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * MapStruct mapper for Auth-related DTOs and entities Uses componentModel = "spring" (configured in
 * build.gradle)
 */
@Mapper
public interface AuthMapper {

  /**
   * Map User entity to AuthResponse DTO
   */
  @Mapping(target = "userId", source = "id")
  @Mapping(target = "accessToken", ignore = true)
  @Mapping(target = "tokenType", constant = "Bearer")
  AuthResponse toAuthResponse(User user);

  /**
   * Map User entity to AuthResponse with access token
   */
  @Mapping(target = "userId", source = "user.id")
  @Mapping(target = "email", source = "user.email")
  @Mapping(target = "fullName", source = "user.fullName")
  @Mapping(target = "role", source = "user.role")
  @Mapping(target = "status", source = "user.status")
  @Mapping(target = "tokenType", constant = "Bearer")
  AuthResponse toAuthResponseWithToken(User user, String accessToken);

  @Mapping(target = "userId", source = "principal.id")
  @Mapping(target = "email", source = "principal.email")
  @Mapping(target = "fullName", source = "principal.fullName")
  @Mapping(target = "role", source = "principal.role")
  @Mapping(target = "status", source = "principal.status")
  @Mapping(target = "tokenType", constant = "Bearer")
  AuthResponse toAuthResponseWithToken(UserPrincipal principal, String accessToken);

  /**
   * Map RegisterReaderRequest to User entity Note: passwordHash needs to be set manually in service
   * layer
   */
  @Mapping(target = "id", ignore = true)
  @Mapping(target = "passwordHash", ignore = true)
  @Mapping(target = "role", ignore = true)
  @Mapping(target = "status", ignore = true)
//  @Mapping(target = "point", constant = "0")
  @Mapping(target = "avatarKey", ignore = true)
  User toUserEntity(RegisterReaderRequest request);

  /**
   * Map RegisterReviewerRequest to User entity
   */
  @Mapping(target = "id", ignore = true)
  @Mapping(target = "passwordHash", ignore = true)
  @Mapping(target = "role", ignore = true)
  @Mapping(target = "status", ignore = true)
//  @Mapping(target = "point", constant = "0")
  @Mapping(target = "avatarKey", ignore = true)
  User toUserEntity(RegisterReviewerRequest request);

  /**
   * Map RegisterReaderRequest to ReaderProfile entity
   */
  @Mapping(target = "id", ignore = true)
  @Mapping(target = "user", ignore = true)
  @Mapping(target = "dob", source = "dateOfBirth")
  ReaderProfile toReaderProfile(RegisterReaderRequest request);

  /**
   * Map RegisterReviewerRequest to ReviewerProfile entity
   */
  @Mapping(target = "id", ignore = true)
  @Mapping(target = "user", ignore = true)
  @Mapping(target = "ordid", source = "orcid")
  @Mapping(target = "credentialFileUrls", ignore = true)
  ReviewerProfile toReviewerProfile(RegisterReviewerRequest request);

  /**
   * Map RegisterOrganizationRequest to User entity (Organization Admin)
   */
  @Mapping(target = "id", ignore = true)
  @Mapping(target = "email", source = "adminEmail")
  @Mapping(target = "fullName", source = "adminFullName")
  @Mapping(target = "passwordHash", ignore = true)
  @Mapping(target = "role", ignore = true)
  @Mapping(target = "status", ignore = true)
//  @Mapping(target = "point", constant = "0")
  @Mapping(target = "avatarKey", ignore = true)
  User toOrganizationAdminEntity(RegisterOrganizationRequest request);

  /**
   * Map RegisterOrganizationRequest to OrganizationProfile entity
   */
  @Mapping(target = "id", ignore = true)
  @Mapping(target = "admin", ignore = true)
  @Mapping(target = "name", source = "organizationName")
  @Mapping(target = "type", source = "organizationType")
  @Mapping(target = "email", source = "organizationEmail")
  @Mapping(target = "logoKey", ignore = true)
  OrganizationProfile toOrganizationProfile(RegisterOrganizationRequest request);
}
