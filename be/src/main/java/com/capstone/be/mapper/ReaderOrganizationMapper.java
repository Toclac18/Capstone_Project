package com.capstone.be.mapper;

import com.capstone.be.domain.entity.OrganizationEnrollment;
import com.capstone.be.dto.response.reader.JoinedOrganizationResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ReaderOrganizationMapper {

  @Mapping(source = "organization.id", target = "organizationId")
  @Mapping(source = "organization.name", target = "organizationName")
  @Mapping(source = "addedAt", target = "joinedAt")
  JoinedOrganizationResponse toJoinedOrganizationResponse(Enrollment enrollment);
}

