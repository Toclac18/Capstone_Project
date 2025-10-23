package com.capstone.be.domain.entity;

import com.capstone.be.domain.entity.common.BaseEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.util.UUID;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "coin_transactions")
@EqualsAndHashCode(callSuper = true)
@Data
public class CoinTransaction extends BaseEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne()
  @JoinColumn(name = "reader_id")
  private Reader reader;

  private String type; //#temp

  @ManyToOne()
  @JoinColumn(name = "document_id")
  private Document document;

  private Integer amount;

}
