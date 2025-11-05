package com.capstone.be.dto.response.importReader;

public class RowUpdate {
    public String jobId;
    public int row;
    public String fullName;
    public String username;
    public String email;
    public boolean imported;
    public boolean emailSent;
    public String error;     // nullable

    public int processedRows;
    public int totalRows;
    public int successCount;
    public int failureCount;
    public int percent;      // 0..100
}
