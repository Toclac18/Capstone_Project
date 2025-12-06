package com.capstone.be.mapper;

import com.capstone.be.domain.entity.ReviewRequest;
import com.capstone.be.dto.response.review.ReviewRequestResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * Mapper for ReviewRequest entity and DTOs
 */
@Mapper(componentModel = "spring")
public interface ReviewRequestMapper {

  @Mapping(source = "document.id", target = "document.id")
  @Mapping(source = "document.title", target = "document.title")
  @Mapping(source = "document.description", target = "document.description")
  @Mapping(source = "document.thumbnailKey", target = "document.thumbnailUrl")
  @Mapping(source = "document.pageCount", target = "document.pageCount")
  @Mapping(source = "document.price", target = "document.price")
  @Mapping(source = "reviewer.id", target = "reviewer.userId")
  @Mapping(source = "reviewer.email", target = "reviewer.email")
  @Mapping(source = "reviewer.fullName", target = "reviewer.fullName")
  @Mapping(source = "reviewer.avatarKey", target = "reviewer.avatarUrl")
  @Mapping(source = "assignedBy.id", target = "assignedBy.userId")
  @Mapping(source = "assignedBy.email", target = "assignedBy.email")
  @Mapping(source = "assignedBy.fullName", target = "assignedBy.fullName")
  ReviewRequestResponse toResponse(ReviewRequest reviewRequest);
}
