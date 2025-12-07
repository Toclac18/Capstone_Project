package com.capstone.be.mapper;

import com.capstone.be.domain.entity.DocType;
import com.capstone.be.domain.entity.Domain;
import com.capstone.be.domain.entity.Document;
import com.capstone.be.domain.entity.DocumentReview;
import com.capstone.be.domain.entity.Specialization;
import com.capstone.be.domain.entity.Tag;
import com.capstone.be.dto.response.review.DocumentReviewResponse;
import org.mapstruct.Context;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Mapper for converting DocumentReview entity to DTOs
 */
@Mapper(componentModel = "spring")
public interface DocumentReviewMapper {

  /**
   * Map DocumentReview entity to DocumentReviewResponse DTO
   *
   * @param documentReview the DocumentReview entity
   * @param tags           list of tags for the document (passed from service layer)
   * @return DocumentReviewResponse DTO
   */
  @Mapping(source = "documentReview.reviewRequest.id", target = "reviewRequestId")
  @Mapping(target = "document", expression = "java(toDocumentInfo(documentReview.getDocument(), tags))")
  @Mapping(source = "documentReview.reviewer.id", target = "reviewer.id")
  @Mapping(source = "documentReview.reviewer.fullName", target = "reviewer.username")
  @Mapping(source = "documentReview.reviewer.email", target = "reviewer.email")
  @Mapping(source = "documentReview.reportFilePath", target = "reportFileUrl")
  DocumentReviewResponse toResponse(DocumentReview documentReview, @Context List<Tag> tags);

  /**
   * Map Document to DocumentInfo
   */
  @Mapping(source = "id", target = "id")
  @Mapping(source = "title", target = "title")
  @Mapping(source = "thumbnailKey", target = "thumbnailUrl")
  @Mapping(source = "docType", target = "docType")
  @Mapping(source = "specialization.domain", target = "domain")
  @Mapping(source = "specialization", target = "specialization")
  @Mapping(target = "tags", expression = "java(mapTags(tags))")
  DocumentReviewResponse.DocumentInfo toDocumentInfo(Document document, @Context List<Tag> tags);

  /**
   * Map DocType to DocTypeInfo
   */
  @Mapping(source = "id", target = "id")
  @Mapping(source = "code", target = "code")
  @Mapping(source = "name", target = "name")
  DocumentReviewResponse.DocTypeInfo toDocTypeInfo(DocType docType);

  /**
   * Map Domain to DomainInfo
   */
  @Mapping(source = "id", target = "id")
  @Mapping(source = "code", target = "code")
  @Mapping(source = "name", target = "name")
  DocumentReviewResponse.DomainInfo toDomainInfo(Domain domain);

  /**
   * Map Specialization to SpecializationInfo
   */
  @Mapping(source = "id", target = "id")
  @Mapping(source = "code", target = "code")
  @Mapping(source = "name", target = "name")
  DocumentReviewResponse.SpecializationInfo toSpecializationInfo(Specialization specialization);

  /**
   * Map list of Tag entities to list of TagInfo DTOs
   */
  default List<DocumentReviewResponse.TagInfo> mapTags(List<Tag> tags) {
    if (tags == null || tags.isEmpty()) {
      return Collections.emptyList();
    }

    return tags.stream()
        .map(tag -> DocumentReviewResponse.TagInfo.builder()
            .id(tag.getId())
            .code(tag.getCode())
            .name(tag.getName())
            .build())
        .collect(Collectors.toList());
  }
}
