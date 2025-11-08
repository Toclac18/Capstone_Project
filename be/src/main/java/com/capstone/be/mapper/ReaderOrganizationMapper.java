package com.capstone.be.mapper;

import com.capstone.be.domain.entity.Enrollment;
import com.capstone.be.dto.response.reader.JoinedOrganizationResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ReaderOrganizationMapper {

  @Mapping(source = "organization.id", target = "organizationId")
  @Mapping(source = "organization.email", target = "organizationEmail")
  @Mapping(source = "organization.hotline", target = "hotline")
  @Mapping(source = "organization.logo", target = "logo")
  @Mapping(source = "organization.address", target = "address")
  @Mapping(source = "organization.status", target = "status")
  @Mapping(source = "addedAt", target = "joinedAt")
  JoinedOrganizationResponse toJoinedOrganizationResponse(Enrollment enrollment);
}

