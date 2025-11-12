package com.capstone.be.dto.response.importReader;

import com.capstone.be.domain.enums.ImportStatus;

public class ImportDetailResponse {

  public String id;
  public String fileName;
  public String createdAt;
  public String createdBy;

  public int totalRows;
  public int processedRows;
  public int successCount;
  public int failureCount;
  public ImportStatus status;

  public java.util.List<RowResult> results;

  public static class RowResult {

    public int row;
    public String fullName;
    public String username;
    public String email;
    public boolean imported;
    public boolean emailSent;
    public String error;
  }
}