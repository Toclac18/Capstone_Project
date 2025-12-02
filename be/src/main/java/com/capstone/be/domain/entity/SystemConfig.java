package com.capstone.be.domain.entity;

import com.capstone.be.domain.entity.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

/**
 * System configuration entity - simple key-value store
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Entity
@Table(
    name = "system_configs",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = "config_key")
    }
)
public class SystemConfig extends BaseEntity {

  @Column(name = "config_key", nullable = false, unique = true, length = 100)
  private String configKey;

  @Column(name = "config_value", nullable = false, columnDefinition = "TEXT")
  private String configValue;

  @Column(name = "description", columnDefinition = "TEXT")
  private String description;

  @Column(name = "config_type", nullable = false, length = 20)
  private String configType; // STRING, NUMBER, BOOLEAN, JSON

  @Column(name = "is_editable", nullable = false)
  private Boolean isEditable = true;
}

