package com.capstone.be.mapper;

import com.capstone.be.domain.entity.DocType;
import com.capstone.be.domain.entity.Domain;
import com.capstone.be.domain.entity.Document;
import com.capstone.be.domain.entity.ReviewResult;
import com.capstone.be.domain.entity.Specialization;
import com.capstone.be.domain.entity.Tag;
import com.capstone.be.dto.response.review.ReviewResultResponse;
import org.mapstruct.Context;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Mapper for converting ReviewResult entity to DTOs
 */
@Mapper(componentModel = "spring")
public interface ReviewResultMapper {

  /**
   * Map ReviewResult entity to ReviewResultResponse DTO
   *
   * @param reviewResult the ReviewResult entity
   * @param tags         list of tags for the document (passed from service layer)
   * @return ReviewResultResponse DTO
   */
  @Mapping(source = "reviewResult.reviewRequest.id", target = "reviewRequestId")
  @Mapping(target = "document", expression = "java(toDocumentInfo(reviewResult.getDocument(), tags))")
  @Mapping(source = "reviewResult.reviewer.id", target = "reviewer.id")
  @Mapping(source = "reviewResult.reviewer.fullName", target = "reviewer.fullName")
  @Mapping(source = "reviewResult.reviewer.email", target = "reviewer.email")
  @Mapping(source = "reviewResult.reviewer.avatarKey", target = "reviewer.avatarUrl")
  @Mapping(source = "reviewResult.document.uploader.id", target = "uploader.id")
  @Mapping(source = "reviewResult.document.uploader.fullName", target = "uploader.fullName")
  @Mapping(source = "reviewResult.document.uploader.email", target = "uploader.email")
  @Mapping(source = "reviewResult.reportFilePath", target = "reportFileUrl")
  @Mapping(source = "reviewResult.status", target = "status")
  @Mapping(source = "reviewResult.comment", target = "report")
  @Mapping(target = "approval", expression = "java(toApprovalInfo(reviewResult))")
  ReviewResultResponse toResponse(ReviewResult reviewResult, @Context List<Tag> tags);

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
  ReviewResultResponse.DocumentInfo toDocumentInfo(Document document, @Context List<Tag> tags);

  /**
   * Map DocType to DocTypeInfo
   */
  @Mapping(source = "id", target = "id")
  @Mapping(source = "code", target = "code")
  @Mapping(source = "name", target = "name")
  ReviewResultResponse.DocTypeInfo toDocTypeInfo(DocType docType);

  /**
   * Map Domain to DomainInfo
   */
  @Mapping(source = "id", target = "id")
  @Mapping(source = "code", target = "code")
  @Mapping(source = "name", target = "name")
  ReviewResultResponse.DomainInfo toDomainInfo(Domain domain);

  /**
   * Map Specialization to SpecializationInfo
   */
  @Mapping(source = "id", target = "id")
  @Mapping(source = "code", target = "code")
  @Mapping(source = "name", target = "name")
  ReviewResultResponse.SpecializationInfo toSpecializationInfo(Specialization specialization);

  /**
   * Map list of Tag entities to list of TagInfo DTOs
   */
  default List<ReviewResultResponse.TagInfo> mapTags(List<Tag> tags) {
    if (tags == null || tags.isEmpty()) {
      return Collections.emptyList();
    }

    return tags.stream()
        .map(tag -> ReviewResultResponse.TagInfo.builder()
            .id(tag.getId())
            .code(tag.getCode())
            .name(tag.getName())
            .build())
        .collect(Collectors.toList());
  }

  /**
   * Map approval info from ReviewResult
   */
  default ReviewResultResponse.ApprovalInfo toApprovalInfo(ReviewResult reviewResult) {
    if (reviewResult.getApprovedBy() == null) {
      return null;
    }
    return ReviewResultResponse.ApprovalInfo.builder()
        .approvedById(reviewResult.getApprovedBy().getId())
        .approvedByName(reviewResult.getApprovedBy().getFullName())
        .approvedAt(reviewResult.getApprovedAt())
        .rejectionReason(reviewResult.getRejectionReason())
        .build();
  }
}
