package com.capstone.be.service.helper;

import com.capstone.be.service.SystemConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Giá trị cấu hình của document: đọc từ SystemConfig, lùi về @Value nếu không có.
 *
 * <p>Tách ra vì cả luồng upload (createDocument) và luồng còn lại (updateDocument,
 * getDocumentPresignedUrl, getDocumentDetailForAdmin) đều cần — để nguyên trong
 * DocumentServiceImpl thì hai service sau khi tách phải cùng giữ systemConfigService.
 *
 * <p>Thân phương thức chuyển nguyên văn.
 */
@Component
@RequiredArgsConstructor
public class DocumentConfigValues {

  private final SystemConfigService systemConfigService;

  @Value("${app.document.defaultPremiumPrice:100}")
  private Integer defaultPremiumPriceFallback;

  @Value("${app.s3.document.presignedExpInMinutes:60}")
  private Integer presignedUrlExpirationMinutesFallback;

  /**
   * Get premium document price from SystemConfig, fallback to @Value
   */
  public Integer getPremiumDocPrice() {
    return systemConfigService.getIntValue("document.defaultPremiumPrice", defaultPremiumPriceFallback);
  }

  /**
   * Get presigned URL expiration minutes from SystemConfig, fallback to @Value
   */
  public Integer getPresignedUrlExpirationMinutes() {
    return systemConfigService.getIntValue("s3.document.presignedExpInMinutes", presignedUrlExpirationMinutesFallback);
  }
}
