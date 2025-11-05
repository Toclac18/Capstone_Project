package com.capstone.be.mapper;

import com.capstone.be.domain.entity.Organization;
import com.capstone.be.dto.response.organization.OrganizationDetailResponse;
import com.capstone.be.dto.response.organization.OrganizationResponse;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface OrganizationMapper {

  OrganizationResponse toResponse(Organization organization);

  OrganizationDetailResponse toDetailResponse(Organization organization);
}


