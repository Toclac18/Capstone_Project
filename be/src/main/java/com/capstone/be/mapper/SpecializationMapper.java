package com.capstone.be.mapper;

import com.capstone.be.domain.entity.Specialization;
import com.capstone.be.dto.response.specialization.SpecializationDetailResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * Mapper for Specialization entity and DTOs
 */
@Mapper(componentModel = "spring")
public interface SpecializationMapper {

  /**
   * Convert Specialization entity to SpecializationDetailResponse
   */
  @Mapping(source = "domain.id", target = "domain.id")
  @Mapping(source = "domain.code", target = "domain.code")
  @Mapping(source = "domain.name", target = "domain.name")
  SpecializationDetailResponse toDetailResponse(Specialization specialization);
}
