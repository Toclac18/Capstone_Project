package com.capstone.be.domain.entity;

import com.capstone.be.domain.enums.ImportStatus;
import java.time.OffsetDateTime;
import java.util.*;

public class ImportJob {
  private String id = "imp-" + UUID.randomUUID();
  private String fileName;
  private OffsetDateTime createdAt = OffsetDateTime.now();
  private String createdBy;

  private int totalRows;
  private int processedRows;
  private int successCount;
  private int failureCount;
  private ImportStatus status = ImportStatus.PENDING;

  private java.util.List<ImportRowResult> results = new java.util.ArrayList<>();

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getFileName() {
    return fileName;
  }

  public void setFileName(String fileName) {
    this.fileName = fileName;
  }

  public OffsetDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(OffsetDateTime createdAt) {
    this.createdAt = createdAt;
  }

  public String getCreatedBy() {
    return createdBy;
  }

  public void setCreatedBy(String createdBy) {
    this.createdBy = createdBy;
  }

  public int getTotalRows() {
    return totalRows;
  }

  public void setTotalRows(int totalRows) {
    this.totalRows = totalRows;
  }

  public int getProcessedRows() {
    return processedRows;
  }

  public void setProcessedRows(int processedRows) {
    this.processedRows = processedRows;
  }

  public int getSuccessCount() {
    return successCount;
  }

  public void setSuccessCount(int successCount) {
    this.successCount = successCount;
  }

  public int getFailureCount() {
    return failureCount;
  }

  public void setFailureCount(int failureCount) {
    this.failureCount = failureCount;
  }

  public ImportStatus getStatus() {
    return status;
  }

  public void setStatus(ImportStatus status) {
    this.status = status;
  }

  public java.util.List<ImportRowResult> getResults() {
    return results;
  }

  public void setResults(java.util.List<ImportRowResult> results) {
    this.results = results;
  }
}
