package com.capstone.be.mapper;

import com.capstone.be.domain.entity.Document;
import com.capstone.be.domain.entity.Tag;
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
}
