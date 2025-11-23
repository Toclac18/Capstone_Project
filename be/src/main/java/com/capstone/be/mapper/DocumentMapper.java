package com.capstone.be.mapper;

import com.capstone.be.domain.entity.Document;
import com.capstone.be.domain.entity.Tag;
import com.capstone.be.dto.response.document.DocumentDetailResponse;
import com.capstone.be.dto.response.document.DocumentUploadHistoryResponse;
import com.capstone.be.dto.response.document.DocumentUploadResponse;
import java.util.List;
import java.util.Set;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

/**
 * Mapper for Document entity and DTOs
 */
@Mapper(componentModel = "spring")
public interface DocumentMapper {

  /**
   * Convert Document entity to DocumentUploadResponse DTO
   *
   * @param document Document entity
   * @param tags     Tags associated with the document
   * @return DocumentUploadResponse DTO
   */
  @Mapping(source = "document.docType.name", target = "type")
  @Mapping(source = "document.specialization.name", target = "specializationName")
  @Mapping(source = "document.specialization.domain.name", target = "domainName")
  @Mapping(source = "document.organization.id", target = "organizationId")
  @Mapping(source = "document.organization.name", target = "organizationName")
  @Mapping(source = "tags", target = "tagNames", qualifiedByName = "mapTagsToNames")
  DocumentUploadResponse toUploadResponse(Document document, Set<Tag> tags);

  /**
   * Map tags to tag names
   */
  @Named("mapTagsToNames")
  default List<String> mapTagsToNames(Set<Tag> tags) {
    if (tags == null || tags.isEmpty()) {
      return List.of();
    }
    return tags.stream()
        .map(Tag::getName)
        .sorted()
        .toList();
  }

  /**
   * Convert Document entity to DocumentDetailResponse DTO This is a base mapping - additional
   * fields need to be set manually
   *
   * @param document Document entity
   * @return DocumentDetailResponse DTO
   */
  @Mapping(source = "uploader.id", target = "uploader.id")
  @Mapping(source = "uploader.fullName", target = "uploader.fullName")
  @Mapping(source = "uploader.email", target = "uploader.email")
  @Mapping(source = "uploader.avatarKey", target = "uploader.avatarUrl")
  @Mapping(source = "organization.id", target = "organization.id")
  @Mapping(source = "organization.name", target = "organization.name")
  @Mapping(source = "organization.logoKey", target = "organization.logoUrl")
  @Mapping(source = "docType.id", target = "docType.id")
  @Mapping(source = "docType.name", target = "docType.name")
  @Mapping(source = "docType.description", target = "docType.description")
  @Mapping(source = "specialization.id", target = "specialization.id")
  @Mapping(source = "specialization.name", target = "specialization.name")
  @Mapping(source = "specialization.domain.id", target = "specialization.domain.id")
  @Mapping(source = "specialization.domain.name", target = "specialization.domain.name")
  @Mapping(source = "thumbnailKey", target = "thumbnailUrl")
  @Mapping(source = "voteScore", target = "downvoteCount", qualifiedByName = "calculateDownvotes")
  @Mapping(target = "tags", ignore = true)
  @Mapping(target = "userInfo", ignore = true)
  DocumentDetailResponse toDetailResponse(Document document);

  /**
   * Calculate downvotes from voteScore and upvoteCount voteScore = upvoteCount - downvoteCount
   * downvoteCount = upvoteCount - voteScore
   */
  @Named("calculateDownvotes")
  default Integer calculateDownvotes(Integer voteScore) {
    return 0; // Will be calculated in service layer with upvoteCount
  }

  /**
   * Convert Document entity to DocumentUploadHistoryResponse DTO
   * This is a lightweight mapping for list view
   *
   * @param document Document entity
   * @return DocumentUploadHistoryResponse DTO
   */
  @Mapping(source = "thumbnailKey", target = "thumbnailUrl")
  @Mapping(source = "docType.name", target = "docTypeName")
  @Mapping(source = "specialization.name", target = "specializationName")
  @Mapping(source = "specialization.domain.name", target = "domainName")
  @Mapping(source = "organization.name", target = "organizationName")
  @Mapping(target = "redemptionCount", ignore = true)
  DocumentUploadHistoryResponse toUploadHistoryResponse(Document document);
}
