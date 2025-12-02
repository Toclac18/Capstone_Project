package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.SystemConfig;
import com.capstone.be.dto.request.admin.UpdateSystemConfigRequest;
import com.capstone.be.dto.response.admin.SystemConfigResponse;
import com.capstone.be.exception.ResourceNotFoundException;
import com.capstone.be.repository.SystemConfigRepository;
import com.capstone.be.service.SystemConfigService;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class SystemConfigServiceImpl implements SystemConfigService {

  private final SystemConfigRepository systemConfigRepository;

  @Override
  @Transactional(readOnly = true)
  public List<SystemConfigResponse> getAllConfigs() {
    List<SystemConfig> configs = systemConfigRepository.findAll();
    return configs.stream()
        .map(this::toResponse)
        .collect(Collectors.toList());
  }

  @Override
  @Transactional(readOnly = true)
  public SystemConfigResponse getConfigByKey(String key) {
    SystemConfig config = systemConfigRepository.findByConfigKey(key)
        .orElseThrow(() -> new ResourceNotFoundException(
            "System config not found with key: " + key,
            "CONFIG_NOT_FOUND"
        ));
    return toResponse(config);
  }

  @Override
  @Transactional
  public SystemConfigResponse updateConfig(String key, UpdateSystemConfigRequest request) {
    SystemConfig config = systemConfigRepository.findByConfigKey(key)
        .orElseThrow(() -> new ResourceNotFoundException(
            "System config not found with key: " + key,
            "CONFIG_NOT_FOUND"
        ));

    if (!config.getIsEditable()) {
      throw new IllegalArgumentException("Config key '" + key + "' is not editable");
    }

    // Validate value based on type
    validateValue(config.getConfigType(), request.getConfigValue());

    config.setConfigValue(request.getConfigValue());
    SystemConfig updated = systemConfigRepository.save(config);

    log.info("System config updated: key={}, value={}", key, request.getConfigValue());
    return toResponse(updated);
  }

  @Override
  @Transactional(readOnly = true)
  public String getStringValue(String key, String defaultValue) {
    return systemConfigRepository.findByConfigKey(key)
        .map(SystemConfig::getConfigValue)
        .orElse(defaultValue);
  }

  @Override
  @Transactional(readOnly = true)
  public Integer getIntValue(String key, Integer defaultValue) {
    return systemConfigRepository.findByConfigKey(key)
        .map(config -> {
          try {
            return Integer.parseInt(config.getConfigValue());
          } catch (NumberFormatException e) {
            log.warn("Invalid integer value for config key: {}, using default", key);
            return defaultValue;
          }
        })
        .orElse(defaultValue);
  }

  @Override
  @Transactional(readOnly = true)
  public Boolean getBooleanValue(String key, Boolean defaultValue) {
    return systemConfigRepository.findByConfigKey(key)
        .map(config -> {
          String value = config.getConfigValue().toLowerCase().trim();
          return "true".equals(value) || "1".equals(value) || "yes".equals(value);
        })
        .orElse(defaultValue);
  }

  private void validateValue(String configType, String value) {
    if (value == null || value.trim().isEmpty()) {
      throw new IllegalArgumentException("Config value cannot be empty");
    }

    switch (configType.toUpperCase()) {
      case "NUMBER":
      case "INTEGER":
        try {
          Integer.parseInt(value);
        } catch (NumberFormatException e) {
          throw new IllegalArgumentException("Config value must be a valid number");
        }
        break;
      case "BOOLEAN":
        String lowerValue = value.toLowerCase().trim();
        if (!"true".equals(lowerValue) && !"false".equals(lowerValue)
            && !"1".equals(lowerValue) && !"0".equals(lowerValue)
            && !"yes".equals(lowerValue) && !"no".equals(lowerValue)) {
          throw new IllegalArgumentException("Config value must be a valid boolean (true/false)");
        }
        break;
      case "STRING":
      case "JSON":
        // No validation needed
        break;
      default:
        log.warn("Unknown config type: {}", configType);
    }
  }

  private SystemConfigResponse toResponse(SystemConfig config) {
    return SystemConfigResponse.builder()
        .id(config.getId())
        .configKey(config.getConfigKey())
        .configValue(config.getConfigValue())
        .description(config.getDescription())
        .configType(config.getConfigType())
        .isEditable(config.getIsEditable())
        .createdAt(config.getCreatedAt())
        .updatedAt(config.getUpdatedAt())
        .build();
  }
}

