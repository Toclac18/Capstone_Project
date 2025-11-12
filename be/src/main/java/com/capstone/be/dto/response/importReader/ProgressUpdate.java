package com.capstone.be.dto.response.importReader;

public class ProgressUpdate {

  public String jobId;
  public int processedRows;
  public int totalRows;
  public int successCount;
  public int failureCount;
  public String status;   // PROCESSING / COMPLETED / FAILED
  public int percent;
}
