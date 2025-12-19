package com.capstone.be.dto.request.document;

import jakarta.validation.constraints.Min;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Filter criteria cho search public documents.
 * Tất cả field đều optional.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentSearchFilter {

  /**
   * Text search từ FE: filters.q
   */
  private String searchKeyword;

  // ============ MULTI-SELECT ID LISTS ============

  private List<UUID> organizationIds;
  private List<UUID> domainIds;
  private List<UUID> specializationIds;
  private List<UUID> docTypeIds;
  private List<UUID> tagIds;

  // (Optional) giữ lại field đơn để không làm hỏng code cũ (nếu đang dùng)
  private UUID organizationId;
  private UUID domainId;
  private UUID specializationId;
  private UUID docTypeId;
  private UUID tagId;

  // ============ YEAR / PRICE / PREMIUM ============

  private Integer yearFrom;
  private Integer yearTo;

  private Integer priceFrom;
  private Integer priceTo;

  /**
   * FE: checkbox "Premium only"
   * - null  -> không filter
   * - true  -> chỉ lấy isPremium = true
   * - false -> chỉ lấy isPremium = false (nếu sau này cần)
   */
  private Boolean isPremium;

  // ============ PAGINATION & SORT ============

  /**
   * Có thể không dùng nếu bạn dùng Pageable từ Spring,
   * nhưng để đây cho service logic nếu cần.
   */
  @Min(0)
  private Integer page = 0;

  @Min(1)
  private Integer size = 20;

  /**
   * Ví dụ: ["createdAt,desc", "price,asc"]
   */
  private List<String> sorts;
}
