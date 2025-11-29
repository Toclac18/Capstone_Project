package com.capstone.be.mapper;

import com.capstone.be.domain.entity.DocType;
import com.capstone.be.dto.response.doctype.DocTypeDetailResponse;
import org.mapstruct.Mapper;

/**
 * Mapper for DocType entity and DTOs
 */
@Mapper(componentModel = "spring")
public interface DocTypeMapper {

  /**
   * Convert DocType entity to DocTypeDetailResponse
   */
  DocTypeDetailResponse toDetailResponse(DocType docType);
}
