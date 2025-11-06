package com.capstone.be.domain.entity;

import com.capstone.be.domain.entity.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;
import java.util.UUID;

@EqualsAndHashCode(callSuper = true)
@Data
@Entity
@Table(name = "document_reports")
public class DocumentReport extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "reporter_id")
    private Reader reporter;

    @ManyToOne
    @JoinColumn(name = "document_id")
    private Document document;

    private String type; // #temp

    private String reportContent;

    private String reportResponse;

    private LocalDateTime responseAt;

    private String status; // #temp
}
