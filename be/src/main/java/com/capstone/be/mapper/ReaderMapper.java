package com.capstone.be.mapper;

import com.capstone.be.domain.entity.Reader;
import com.capstone.be.dto.request.auth.ReaderRegisterRequest;
import com.capstone.be.dto.response.auth.ReaderRegisterResponse;
import com.capstone.be.dto.response.orgAdmin.ReaderResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

/**
 * ReaderMapper – MapStruct mapper cho Reader entity.
 * Dùng cho Auth module (register/verify) và OrgAdmin (reader management).
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface ReaderMapper {

  // -------- AUTH --------
  ReaderRegisterResponse toRegisterResponse(Reader reader);

  @Mapping(target = "id", ignore = true)
  @Mapping(target = "coinBalance", ignore = true)
  @Mapping(target = "status", ignore = true)
  Reader toReader(ReaderRegisterRequest request);

  // -------- ORG ADMIN --------
  default ReaderResponse toResponse(Reader r, String message) {
    if (r == null) return null;

    return ReaderResponse.builder()
            .id(r.getId())
            .fullName(r.getFullName())
            .username(r.getUsername())
            .dateOfBirth(r.getDateOfBirth())
            .email(r.getEmail())
            .avatarUrl(r.getAvatarUrl())
            .coinBalance(r.getCoinBalance())
            .status(r.getStatus())
            .build();
  }
}
