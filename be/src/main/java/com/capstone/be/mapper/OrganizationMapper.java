package com.capstone.be.mapper;

import com.capstone.be.domain.entity.OrganizationProfile;
import com.capstone.be.dto.response.organization.PublicOrganizationResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * Mapper for OrganizationProfile entity and DTOs
 */
@Mapper(componentModel = "spring")
public interface OrganizationMapper {

  /**
   * Convert OrganizationProfile to PublicOrganizationResponse
   *
   * @param organization OrganizationProfile entity
   * @return PublicOrganizationResponse DTO
   */
  @Mapping(target = "memberCount", ignore = true)
  @Mapping(target = "documentCount", ignore = true)
  @Mapping(source = "logoKey", target = "logo")
  PublicOrganizationResponse toPublicResponse(OrganizationProfile organization);
}
