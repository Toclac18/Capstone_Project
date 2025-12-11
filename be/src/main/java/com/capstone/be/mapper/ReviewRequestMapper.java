package com.capstone.be.mapper;

import com.capstone.be.domain.entity.DocType;
import com.capstone.be.domain.entity.Domain;
import com.capstone.be.domain.entity.Document;
import com.capstone.be.domain.entity.ReviewRequest;
import com.capstone.be.domain.entity.Specialization;
import com.capstone.be.domain.entity.Tag;
import com.capstone.be.dto.response.review.ReviewRequestResponse;
import org.mapstruct.Context;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Mapper for ReviewRequest entity and DTOs
 */
@Mapper(componentModel = "spring")
public interface ReviewRequestMapper {

  @Mapping(target = "document", expression = "java(toDocumentInfo(reviewRequest.getDocument(), tags))")
  @Mapping(source = "reviewer.id", target = "reviewer.userId")
  @Mapping(source = "reviewer.email", target = "reviewer.email")
  @Mapping(source = "reviewer.fullName", target = "reviewer.fullName")
  @Mapping(source = "reviewer.avatarKey", target = "reviewer.avatarUrl")
  @Mapping(source = "assignedBy.id", target = "assignedBy.userId")
  @Mapping(source = "assignedBy.email", target = "assignedBy.email")
  @Mapping(source = "assignedBy.fullName", target = "assignedBy.fullName")
  ReviewRequestResponse toResponse(ReviewRequest reviewRequest, @Context List<Tag> tags);

  /**
   * Map Document to DocumentInfo
   */
  @Mapping(source = "id", target = "id")
  @Mapping(source = "title", target = "title")
  @Mapping(source = "description", target = "description")
  @Mapping(source = "thumbnailKey", target = "thumbnailUrl")
  @Mapping(source = "pageCount", target = "pageCount")
  @Mapping(source = "price", target = "price")
  @Mapping(source = "status", target = "status")
  @Mapping(source = "docType", target = "docType")
  @Mapping(source = "specialization.domain", target = "domain")
  @Mapping(source = "specialization", target = "specialization")
  @Mapping(target = "tags", expression = "java(mapTags(tags))")
  ReviewRequestResponse.DocumentInfo toDocumentInfo(Document document, @Context List<Tag> tags);

  /**
   * Map DocType to DocTypeInfo
   */
  @Mapping(source = "id", target = "id")
  @Mapping(source = "code", target = "code")
  @Mapping(source = "name", target = "name")
  ReviewRequestResponse.DocTypeInfo toDocTypeInfo(DocType docType);

  /**
   * Map Domain to DomainInfo
   */
  @Mapping(source = "id", target = "id")
  @Mapping(source = "code", target = "code")
  @Mapping(source = "name", target = "name")
  ReviewRequestResponse.DomainInfo toDomainInfo(Domain domain);

  /**
   * Map Specialization to SpecializationInfo
   */
  @Mapping(source = "id", target = "id")
  @Mapping(source = "code", target = "code")
  @Mapping(source = "name", target = "name")
  ReviewRequestResponse.SpecializationInfo toSpecializationInfo(Specialization specialization);

  /**
   * Map list of Tag entities to list of TagInfo DTOs
   */
  default List<ReviewRequestResponse.TagInfo> mapTags(List<Tag> tags) {
    if (tags == null || tags.isEmpty()) {
      return Collections.emptyList();
    }

    return tags.stream()
        .map(tag -> ReviewRequestResponse.TagInfo.builder()
            .id(tag.getId())
            .code(tag.getCode())
            .name(tag.getName())
            .build())
        .collect(Collectors.toList());
  }
}
