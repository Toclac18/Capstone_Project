package com.capstone.be.mapper;

import com.capstone.be.domain.entity.Domain;
import com.capstone.be.domain.entity.ReviewerProfile;
import com.capstone.be.domain.entity.Specialization;
import com.capstone.be.domain.entity.User;
import com.capstone.be.dto.response.reviewer.PendingReviewerResponse;
import com.capstone.be.dto.response.reviewer.PendingReviewerResponse.DomainInfo;
import com.capstone.be.dto.response.reviewer.PendingReviewerResponse.SpecializationInfo;
import java.util.List;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * MapStruct mapper for Reviewer Approval DTOs
 */
@Mapper
public interface ReviewerApprovalMapper {

  /**
   * Map User and ReviewerProfile to PendingReviewerResponse
   */
  @Mapping(target = "userId", source = "user.id")
  @Mapping(target = "email", source = "user.email")
  @Mapping(target = "fullName", source = "user.fullName")
  @Mapping(target = "status", source = "user.status")
  @Mapping(target = "registeredAt", source = "user.createdAt")
  @Mapping(target = "reviewerProfileId", source = "reviewerProfile.id")
  @Mapping(target = "dateOfBirth", source = "reviewerProfile.dateOfBirth")
  @Mapping(target = "orcid", source = "reviewerProfile.ordid")
  @Mapping(target = "educationLevel", source = "reviewerProfile.educationLevel")
  @Mapping(target = "organizationName", source = "reviewerProfile.organizationName")
  @Mapping(target = "organizationEmail", source = "reviewerProfile.organizationEmail")
  @Mapping(target = "credentialFileUrls", source = "reviewerProfile.credentialFileUrls")
  @Mapping(target = "domains", source = "domains")
  @Mapping(target = "specializations", source = "specializations")
  PendingReviewerResponse toPendingReviewerResponse(
      User user,
      ReviewerProfile reviewerProfile,
      List<Domain> domains,
      List<Specialization> specializations
  );

  /**
   * Map Domain to DomainInfo
   */
  DomainInfo toDomainInfo(Domain domain);

  /**
   * Map Specialization to SpecializationInfo
   */
  @Mapping(target = "domainId", source = "domain.id")
  @Mapping(target = "domainName", source = "domain.name")
  SpecializationInfo toSpecializationInfo(Specialization specialization);

  /**
   * Map List of Domains to List of DomainInfo
   */
  List<DomainInfo> toDomainInfoList(List<Domain> domains);

  /**
   * Map List of Specializations to List of SpecializationInfo
   */
  List<SpecializationInfo> toSpecializationInfoList(List<Specialization> specializations);
}
