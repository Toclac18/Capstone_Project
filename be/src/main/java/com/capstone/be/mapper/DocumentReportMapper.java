package com.capstone.be.mapper;

import com.capstone.be.domain.entity.DocumentReport;
import com.capstone.be.dto.response.report.ReportResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface DocumentReportMapper {

  @Mapping(source = "document.id", target = "documentId")
  @Mapping(source = "document.title", target = "documentTitle")
  @Mapping(source = "reporter.id", target = "reporter.id")
  @Mapping(source = "reporter.fullName", target = "reporter.fullName")
  @Mapping(source = "reporter.email", target = "reporter.email")
  @Mapping(source = "reviewedBy.id", target = "reviewedBy.id")
  @Mapping(source = "reviewedBy.fullName", target = "reviewedBy.fullName")
  ReportResponse toResponse(DocumentReport report);
}
