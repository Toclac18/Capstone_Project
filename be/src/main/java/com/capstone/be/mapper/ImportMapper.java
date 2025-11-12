package com.capstone.be.mapper;

import com.capstone.be.domain.entity.ImportJob;
import com.capstone.be.domain.entity.ImportRowResult;
import com.capstone.be.dto.response.importReader.ImportDetailResponse;
import com.capstone.be.dto.response.importReader.ImportListItemResponse;
import java.time.format.DateTimeFormatter;
import java.util.stream.Collectors;

public class ImportMapper {

  private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_OFFSET_DATE_TIME;

  public static ImportListItemResponse toItem(ImportJob j) {
    ImportListItemResponse dto = new ImportListItemResponse();
    dto.id = j.getId();
    dto.fileName = j.getFileName();
    dto.createdAt = j.getCreatedAt().format(ISO);
    dto.createdBy = j.getCreatedBy();
    dto.totalRows = j.getTotalRows();
    dto.processedRows = j.getProcessedRows();
    dto.successCount = j.getSuccessCount();
    dto.failureCount = j.getFailureCount();
    dto.status = j.getStatus();
    return dto;
  }

  public static ImportDetailResponse toDetail(ImportJob j) {
    ImportDetailResponse dto = new ImportDetailResponse();
    dto.id = j.getId();
    dto.fileName = j.getFileName();
    dto.createdAt = j.getCreatedAt().format(ISO);
    dto.createdBy = j.getCreatedBy();
    dto.totalRows = j.getTotalRows();
    dto.processedRows = j.getProcessedRows();
    dto.successCount = j.getSuccessCount();
    dto.failureCount = j.getFailureCount();
    dto.status = j.getStatus();
    dto.results = j.getResults().stream().map(ImportMapper::toRow).collect(Collectors.toList());
    return dto;
  }

  private static ImportDetailResponse.RowResult toRow(ImportRowResult r) {
    ImportDetailResponse.RowResult x = new ImportDetailResponse.RowResult();
    x.row = r.getRow();
    x.fullName = r.getFullName();
    x.username = r.getUsername();
    x.email = r.getEmail();
    x.imported = r.isImported();
    x.emailSent = r.isEmailSent();
    x.error = r.getError();
    return x;
  }
}