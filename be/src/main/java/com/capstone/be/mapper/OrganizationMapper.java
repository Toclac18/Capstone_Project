package com.capstone.be.mapper;

import com.capstone.be.domain.entity.Organization;
import com.capstone.be.dto.request.auth.RegisterOrganizationInfo;
import com.capstone.be.dto.response.auth.RegisterOrganizationResponse;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface OrganizationMapper {

  Organization toOrganization(RegisterOrganizationInfo info);

  RegisterOrganizationResponse toRegisterOrganizationResponse(Organization org);
}
