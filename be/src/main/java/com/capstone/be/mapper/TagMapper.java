package com.capstone.be.mapper;

import com.capstone.be.domain.entity.Tag;
import com.capstone.be.dto.response.tag.TagResponse;
import org.mapstruct.Mapper;

/**
 * Mapper for Tag entity and DTOs
 */
@Mapper(componentModel = "spring")
public interface TagMapper {

  /**
   * Convert Tag entity to TagResponse
   */
  TagResponse toResponse(Tag tag);
}
