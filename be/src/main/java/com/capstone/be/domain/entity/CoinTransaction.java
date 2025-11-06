package com.capstone.be.domain.entity;

import com.capstone.be.domain.entity.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.UUID;

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

    private String type; // #temp

    @ManyToOne()
    @JoinColumn(name = "document_id")
    private Document document;

    private Integer amount;
}
