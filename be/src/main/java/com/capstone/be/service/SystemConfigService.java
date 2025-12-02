package com.capstone.be.service;

import com.capstone.be.dto.request.admin.UpdateSystemConfigRequest;
import com.capstone.be.dto.response.admin.SystemConfigResponse;
import java.util.List;

public interface SystemConfigService {

  /**
   * Get all system configurations
   */
  List<SystemConfigResponse> getAllConfigs();

  /**
   * Get system configuration by key
   */
  SystemConfigResponse getConfigByKey(String key);

  /**
   * Update system configuration
   */
  SystemConfigResponse updateConfig(String key, UpdateSystemConfigRequest request);

  /**
   * Get config value as String
   */
  String getStringValue(String key, String defaultValue);

  /**
   * Get config value as Integer
   */
  Integer getIntValue(String key, Integer defaultValue);

  /**
   * Get config value as Boolean
   */
  Boolean getBooleanValue(String key, Boolean defaultValue);
}

