package com.capstone.be.mapper;

import com.capstone.be.domain.entity.MemberImportBatch;
import com.capstone.be.dto.response.organization.MemberImportBatchResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * Mapper for MemberImportBatch entity and DTOs
 */
@Mapper(componentModel = "spring")
public interface MemberImportBatchMapper {

  /**
   * Convert MemberImportBatch entity to MemberImportBatchResponse DTO
   *
   * @param batch MemberImportBatch entity
   * @return MemberImportBatchResponse DTO
   */
  @Mapping(source = "admin.fullName", target = "adminName")
  @Mapping(source = "admin.email", target = "adminEmail")
  @Mapping(source = "createdAt", target = "importedAt")
  MemberImportBatchResponse toResponse(MemberImportBatch batch);
}
