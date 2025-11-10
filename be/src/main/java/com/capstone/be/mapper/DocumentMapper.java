package com.capstone.be.mapper;

import com.capstone.be.domain.entity.Document;
import com.capstone.be.dto.response.document.DocumentDetailResponse;
import com.capstone.be.dto.response.document.DocumentListItemResponse;
import com.capstone.be.dto.response.document.DocumentOrganizationInfo;
import com.capstone.be.dto.response.document.DocumentSpecializationInfo;
import com.capstone.be.dto.response.document.DocumentTypeInfo;
import com.capstone.be.dto.response.document.DocumentUploaderInfo;
import java.util.List;
import java.util.stream.Collectors;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface DocumentMapper {

  DocumentMapper INSTANCE = Mappers.getMapper(DocumentMapper.class);

  @Mapping(target = "uploader", ignore = true)
  @Mapping(target = "organization", ignore = true)
  @Mapping(target = "type", ignore = true)
  DocumentListItemResponse toListItemResponse(Document document);

  @Mapping(target = "uploader", ignore = true)
  @Mapping(target = "organization", ignore = true)
  @Mapping(target = "type", ignore = true)
  @Mapping(target = "specializations", ignore = true)
  @Mapping(target = "tags", ignore = true)
  @Mapping(target = "commentCount", ignore = true)
  @Mapping(target = "saveCount", ignore = true)
  @Mapping(target = "upvoteCount", ignore = true)
  @Mapping(target = "downvoteCount", ignore = true)
  @Mapping(target = "reportCount", ignore = true)
  @Mapping(target = "purchaseCount", ignore = true)
  DocumentDetailResponse toDetailResponse(Document document);

  default DocumentListItemResponse mapToListItemResponse(Document document) {
    DocumentListItemResponse response = toListItemResponse(document);
    response.setUploader(mapUploader(document));
    response.setOrganization(mapOrganization(document));
    response.setType(mapType(document));
    return response;
  }

  default DocumentDetailResponse mapToDetailResponse(Document document) {
    DocumentDetailResponse response = toDetailResponse(document);
    response.setUploader(mapUploaderDetail(document));
    response.setOrganization(mapOrganizationDetail(document));
    response.setType(mapType(document));
    response.setSpecializations(mapSpecializations(document));
    // Tags will be set in Service layer
    return response;
  }

  default DocumentUploaderInfo mapUploader(Document document) {
    if (document.getUploader() == null) {
      return null;
    }
    return DocumentUploaderInfo.builder()
        .id(document.getUploader().getId())
        .fullName(document.getUploader().getFullName())
        .username(document.getUploader().getUsername())
        .avatarUrl(document.getUploader().getAvatarUrl())
        .email(null)      // Not set for List
        .status(null)     // Not set for List
        .build();
  }

  default DocumentUploaderInfo mapUploaderDetail(Document document) {
    if (document.getUploader() == null) {
      return null;
    }
    return DocumentUploaderInfo.builder()
        .id(document.getUploader().getId())
        .fullName(document.getUploader().getFullName())
        .username(document.getUploader().getUsername())
        .avatarUrl(document.getUploader().getAvatarUrl())
        .email(document.getUploader().getEmail())
        .status(document.getUploader().getStatus() != null ? document.getUploader().getStatus().name() : null)
        .build();
  }

  default DocumentOrganizationInfo mapOrganization(Document document) {
    if (document.getOrganization() == null) {
      return null;
    }
    return DocumentOrganizationInfo.builder()
        .id(document.getOrganization().getId())
        .name(document.getOrganization().getName())
        .logo(document.getOrganization().getLogo())
        .type(null)       // Not set for List
        .email(null)      // Not set for List
        .status(null)     // Not set for List
        .build();
  }

  default DocumentOrganizationInfo mapOrganizationDetail(Document document) {
    if (document.getOrganization() == null) {
      return null;
    }
    return DocumentOrganizationInfo.builder()
        .id(document.getOrganization().getId())
        .name(document.getOrganization().getName())
        .logo(document.getOrganization().getLogo())
        .type(document.getOrganization().getType() != null ? document.getOrganization().getType().name() : null)
        .email(document.getOrganization().getEmail())
        .status(document.getOrganization().getStatus() != null ? document.getOrganization().getStatus().name() : null)
        .build();
  }

  default DocumentTypeInfo mapType(Document document) {
    if (document.getType() == null) {
      return null;
    }
    return DocumentTypeInfo.builder()
        .id(document.getType().getId())
        .name(document.getType().getName())
        .build();
  }

  default List<DocumentSpecializationInfo> mapSpecializations(Document document) {
    if (document.getSpecializations() == null || document.getSpecializations().isEmpty()) {
      return List.of();
    }
    return document.getSpecializations().stream()
        .map(spec -> {
          DocumentSpecializationInfo.DomainInfo domainInfo = null;
          if (spec.getDomain() != null) {
            domainInfo = DocumentSpecializationInfo.DomainInfo.builder()
                .id(spec.getDomain().getId())
                .code(spec.getDomain().getCode())
                .name(spec.getDomain().getName())
                .build();
          }
          return DocumentSpecializationInfo.builder()
              .id(spec.getId())
              .code(spec.getCode())
              .name(spec.getName())
              .domain(domainInfo)
              .build();
        })
        .collect(Collectors.toList());
  }
}
