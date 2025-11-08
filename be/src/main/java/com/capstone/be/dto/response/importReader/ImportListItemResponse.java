package com.capstone.be.dto.response.importReader;

import com.capstone.be.domain.enums.ImportStatus;

public class ImportListItemResponse {
    public String id;
    public String fileName;
    public String createdAt;
    public String createdBy;
    public int totalRows;
    public int processedRows;
    public int successCount;
    public int failureCount;
    public ImportStatus status;
}