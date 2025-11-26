package com.capstone.be.mapper;

import com.capstone.be.domain.entity.SavedList;
import com.capstone.be.domain.entity.SavedListDocument;
import com.capstone.be.dto.response.savedlist.SavedListDetailResponse;
import com.capstone.be.dto.response.savedlist.SavedListResponse;
import java.util.Set;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

/**
 * Mapper for SavedList entity and DTOs
 */
@Mapper(componentModel = "spring")
public interface SavedListMapper {

  /**
   * Convert SavedList entity to SavedListResponse DTO
   *
   * @param savedList SavedList entity
   * @return SavedListResponse DTO
   */
  @Mapping(source = "savedListDocuments", target = "docCount", qualifiedByName = "countDocuments")
  SavedListResponse toResponse(SavedList savedList);

  /**
   * Convert SavedList entity to SavedListDetailResponse DTO
   * Note: documents field needs to be set manually
   *
   * @param savedList SavedList entity
   * @return SavedListDetailResponse DTO
   */
  @Mapping(source = "savedListDocuments", target = "docCount", qualifiedByName = "countDocuments")
  @Mapping(target = "documents", ignore = true)
  SavedListDetailResponse toDetailResponse(SavedList savedList);

  /**
   * Count documents in SavedList
   */
  @Named("countDocuments")
  default Long countDocuments(Set<SavedListDocument> savedListDocuments) {
    if (savedListDocuments == null) {
      return 0L;
    }
    return (long) savedListDocuments.size();
  }
}
