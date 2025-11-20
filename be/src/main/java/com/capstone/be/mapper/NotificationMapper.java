package com.capstone.be.mapper;

import com.capstone.be.domain.entity.Notification;
import com.capstone.be.dto.response.user.NotificationResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * Mapper for Notification entity and DTOs
 */
@Mapper(componentModel = "spring")
public interface NotificationMapper {

  /**
   * Convert Notification entity to NotificationResponse DTO
   *
   * @param notification Notification entity
   * @return NotificationResponse DTO
   */
  @Mapping(source = "createdAt", target = "timestamp")
  NotificationResponse toResponse(Notification notification);
}
