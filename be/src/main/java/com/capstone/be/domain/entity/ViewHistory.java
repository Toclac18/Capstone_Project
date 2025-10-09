package com.capstone.be.domain.entity;

import com.capstone.be.domain.entity.common.BaseEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "view_histories")
@Data
@EqualsAndHashCode(callSuper = true)

public class ViewHistory extends BaseEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne
  @JoinColumn(name = "reader_id")
  private Reader reader;

  @ManyToOne
  @JoinColumn(name = "document_id")
  private Document document;

  private LocalDateTime viewAt;

//  private LocalDateTime expiry; //#temp

}
