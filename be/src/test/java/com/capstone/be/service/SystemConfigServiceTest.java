package com.capstone.be.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.capstone.be.domain.entity.SystemConfig;
import com.capstone.be.dto.request.admin.UpdateSystemConfigRequest;
import com.capstone.be.dto.response.admin.SystemConfigResponse;
import com.capstone.be.exception.ResourceNotFoundException;
import com.capstone.be.repository.SystemConfigRepository;
import com.capstone.be.service.impl.SystemConfigServiceImpl;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("SystemConfigService Unit Tests")
class SystemConfigServiceTest {

  @Mock
  private SystemConfigRepository systemConfigRepository;

  @InjectMocks
  private SystemConfigServiceImpl systemConfigService;

  private SystemConfig config;
  private String configKey;

  @BeforeEach
  void setUp() {
    configKey = "test.key";

    config = SystemConfig.builder()
        .id(UUID.randomUUID())
        .configKey(configKey)
        .configValue("test-value")
        .description("Test config")
        .configType("STRING")
        .isEditable(true)
        .build();
  }

  // test getAllConfigs should return all configs
  @Test
  @DisplayName("getAllConfigs should return all configs")
  void getAllConfigs_ShouldReturnAllConfigs() {
    List<SystemConfig> configs = Arrays.asList(config);
    when(systemConfigRepository.findAll()).thenReturn(configs);

    List<SystemConfigResponse> result = systemConfigService.getAllConfigs();

    assertNotNull(result);
    assertEquals(1, result.size());
    verify(systemConfigRepository, times(1)).findAll();
  }

  // test getConfigByKey should return config
  @Test
  @DisplayName("getConfigByKey should return config")
  void getConfigByKey_ShouldReturnConfig() {
    when(systemConfigRepository.findByConfigKey(configKey)).thenReturn(Optional.of(config));

    SystemConfigResponse result = systemConfigService.getConfigByKey(configKey);

    assertNotNull(result);
    assertEquals(configKey, result.getConfigKey());
    verify(systemConfigRepository, times(1)).findByConfigKey(configKey);
  }

  // test getConfigByKey should throw exception when not found
  @Test
  @DisplayName("getConfigByKey should throw exception when not found")
  void getConfigByKey_ShouldThrowException_WhenNotFound() {
    String nonExistentKey = "non.existent.key";
    when(systemConfigRepository.findByConfigKey(nonExistentKey)).thenReturn(Optional.empty());

    assertThrows(ResourceNotFoundException.class,
        () -> systemConfigService.getConfigByKey(nonExistentKey));
  }

  // test updateConfig should update config
  @Test
  @DisplayName("updateConfig should update config")
  void updateConfig_ShouldUpdateConfig() {
    UpdateSystemConfigRequest request = UpdateSystemConfigRequest.builder()
        .configValue("updated-value")
        .build();

    SystemConfig updatedConfig = SystemConfig.builder()
        .id(config.getId())
        .configKey(configKey)
        .configValue("updated-value")
        .configType("STRING")
        .isEditable(true)
        .build();

    config.setConfigType("STRING");
    config.setIsEditable(true);
    when(systemConfigRepository.findByConfigKey(configKey)).thenReturn(Optional.of(config));
    when(systemConfigRepository.save(any(SystemConfig.class))).thenReturn(updatedConfig);

    SystemConfigResponse result = systemConfigService.updateConfig(configKey, request);

    assertNotNull(result);
    assertEquals("updated-value", result.getConfigValue());
    verify(systemConfigRepository, times(1)).save(any(SystemConfig.class));
  }

  // test getStringValue should return string value
  @Test
  @DisplayName("getStringValue should return string value")
  void getStringValue_ShouldReturnStringValue() {
    when(systemConfigRepository.findByConfigKey(configKey)).thenReturn(Optional.of(config));

    String result = systemConfigService.getStringValue(configKey, "default");

    assertEquals("test-value", result);
  }

  // test getStringValue should return default when not found
  @Test
  @DisplayName("getStringValue should return default when not found")
  void getStringValue_ShouldReturnDefault_WhenNotFound() {
    String nonExistentKey = "non.existent.key";
    when(systemConfigRepository.findByConfigKey(nonExistentKey)).thenReturn(Optional.empty());

    String result = systemConfigService.getStringValue(nonExistentKey, "default");

    assertEquals("default", result);
  }

  // test getIntValue should return integer value
  @Test
  @DisplayName("getIntValue should return integer value")
  void getIntValue_ShouldReturnIntValue() {
    SystemConfig intConfig = SystemConfig.builder()
        .id(UUID.randomUUID())
        .configKey("int.key")
        .configValue("100")
        .build();

    when(systemConfigRepository.findByConfigKey("int.key")).thenReturn(Optional.of(intConfig));

    Integer result = systemConfigService.getIntValue("int.key", 0);

    assertEquals(100, result);
  }

  // test getBooleanValue should return boolean value
  @Test
  @DisplayName("getBooleanValue should return boolean value")
  void getBooleanValue_ShouldReturnBooleanValue() {
    SystemConfig boolConfig = SystemConfig.builder()
        .id(UUID.randomUUID())
        .configKey("bool.key")
        .configValue("true")
        .build();

    when(systemConfigRepository.findByConfigKey("bool.key")).thenReturn(Optional.of(boolConfig));

    Boolean result = systemConfigService.getBooleanValue("bool.key", false);

    assertEquals(true, result);
  }
}

