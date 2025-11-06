package com.capstone.be.domain.entity;

import com.capstone.be.domain.enums.ImportStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "import_jobs")
@Getter
@Setter
public class ImportJob {

    @Id
    @Column(name = "id", nullable = false, length = 64)
    private String id = "imp-" + UUID.randomUUID();

    @Column(name = "file_name", length = 255)
    private String fileName;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "total_rows")
    private int totalRows;

    @Column(name = "processed_rows")
    private int processedRows;

    @Column(name = "success_count")
    private int successCount;

    @Column(name = "failure_count")
    private int failureCount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    private ImportStatus status = ImportStatus.PENDING;

    @OneToMany(
            mappedBy = "job",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY)
    @OrderBy("row ASC")
    private List<ImportRowResult> results = new ArrayList<>();
}
