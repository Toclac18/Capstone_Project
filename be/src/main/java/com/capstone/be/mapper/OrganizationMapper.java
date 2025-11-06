package com.capstone.be.mapper;

import com.capstone.be.domain.entity.Organization;
import com.capstone.be.dto.request.auth.RegisterOrganizationInfo;
import com.capstone.be.dto.response.auth.RegisterOrganizationResponse;
import com.capstone.be.dto.response.organization.OrganizationDetailResponse;
import com.capstone.be.dto.response.organization.OrganizationResponse;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface OrganizationMapper {

  OrganizationResponse toResponse(Organization organization);

  OrganizationDetailResponse toDetailResponse(Organization organization);

  Organization toOrganization(RegisterOrganizationInfo info);

  RegisterOrganizationResponse toRegisterOrganizationResponse(Organization org);
}
