package com.capstone.be.mapper;

import com.capstone.be.domain.entity.Domain;
import com.capstone.be.dto.response.domain.DomainDetailResponse;
import org.mapstruct.Mapper;

/**
 * Mapper for Domain entity and DTOs
 */
@Mapper(componentModel = "spring")
public interface DomainMapper {

  /**
   * Convert Domain entity to DomainDetailResponse
   */
  DomainDetailResponse toDetailResponse(Domain domain);
}
