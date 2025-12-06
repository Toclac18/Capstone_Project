package com.capstone.be.mapper;

import com.capstone.be.domain.entity.DocumentReview;
import com.capstone.be.dto.response.review.DocumentReviewResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * Mapper for converting DocumentReview entity to DTOs
 */
@Mapper(componentModel = "spring")
public interface DocumentReviewMapper {

  /**
   * Map DocumentReview entity to DocumentReviewResponse DTO
   */
  @Mapping(source = "reviewRequest.id", target = "reviewRequestId")
  @Mapping(source = "document.id", target = "document.id")
  @Mapping(source = "document.title", target = "document.title")
  @Mapping(source = "document.thumbnailKey", target = "document.thumbnailUrl")
  @Mapping(source = "reviewer.id", target = "reviewer.id")
  @Mapping(source = "reviewer.fullName", target = "reviewer.username")
  @Mapping(source = "reviewer.email", target = "reviewer.email")
  DocumentReviewResponse toResponse(DocumentReview documentReview);
}
