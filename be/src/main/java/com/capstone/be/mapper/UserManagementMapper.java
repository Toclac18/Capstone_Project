package com.capstone.be.mapper;

import com.capstone.be.domain.entity.Organization;
import com.capstone.be.domain.entity.Reader;
import com.capstone.be.domain.entity.Reviewer;
import com.capstone.be.dto.response.user.UserResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserManagementMapper {

  @Mapping(source = "fullName", target = "name")
  @Mapping(target = "status", expression = "java(mapReaderStatus(reader.getStatus()))")
  @Mapping(constant = "READER", target = "role")
  UserResponse toUserResponse(Reader reader);

  @Mapping(target = "status", expression = "java(mapReviewerStatus(reviewer.getActive()))")
  @Mapping(constant = "REVIEWER", target = "role")
  UserResponse toUserResponse(Reviewer reviewer);

  @Mapping(source = "adminEmail", target = "email")
  @Mapping(source = "email", target = "name")
  @Mapping(target = "status", expression = "java(mapOrganizationStatus(organization.getActive()))")
  @Mapping(constant = "ORGANIZATION_ADMIN", target = "role")
  UserResponse toUserResponse(Organization organization);

  default String mapReaderStatus(Object status) {
    if (status == null) {
      return null;
    }
    return status.toString();
  }

  default String mapReviewerStatus(Boolean active) {
    if (active == null) {
      return null;
    }
    return active ? "ACTIVE" : "INACTIVE";
  }

  default String mapOrganizationStatus(Boolean active) {
    if (active == null) {
      return null;
    }
    return active ? "ACTIVE" : "INACTIVE";
  }
}

