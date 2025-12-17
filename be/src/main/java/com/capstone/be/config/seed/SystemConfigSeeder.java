package com.capstone.be.config.seed;

import com.capstone.be.domain.entity.SystemConfig;
import com.capstone.be.repository.SystemConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Seeder for System Config (dev profile only)
 * Seeds default system configurations
 */
@Profile("dev")
@Component
@RequiredArgsConstructor
@Slf4j
public class SystemConfigSeeder {

  private final SystemConfigRepository systemConfigRepository;

  @Transactional
  @EventListener(org.springframework.boot.context.event.ApplicationReadyEvent.class)
  public void run() {
    log.info("Starting System Config seeding...");

    // ========== DOCUMENT SETTINGS ==========
    createConfig("document.defaultPremiumPrice", "120", "Default price for premium documents (points)", "NUMBER", true);
    createConfig("document.conversion.timeoutSeconds", "60", "Timeout in seconds for document conversion process", "NUMBER", true);
    createConfig("s3.document.presignedExpInMinutes", "20", "Presigned URL expiration time in minutes for document access", "NUMBER", true);

    // ========== POINT SYSTEM SETTINGS ==========
    createConfig("document.points.aiApproval", "20", "Points awarded when AI approves a document", "NUMBER", true);
    createConfig("document.points.baApproval", "100", "Points awarded when Business Admin approves a premium document", "NUMBER", true);

    log.info("Seeded {} System Configs successfully.", systemConfigRepository.count());
  }

  private void createConfig(String key, String value, String description, String type, boolean editable) {
    // Check if config already exists
    if (systemConfigRepository.findByConfigKey(key).isPresent()) {
      log.debug("System config already exists: key={}, skipping", key);
      return;
    }

    SystemConfig config = SystemConfig.builder()
        .id(SeedUtil.generateUUID("config-" + key.replace(".", "-")))
        .configKey(key)
        .configValue(value)
        .description(description)
        .configType(type)
        .isEditable(editable)
        .build();

    systemConfigRepository.save(config);
    log.debug("Created system config: key={}, value={}", key, value);
  }
}

