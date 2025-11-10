package com.capstone.be.controller;

import com.capstone.be.dto.base.SuccessResponse;
import com.capstone.be.dto.request.organization.OrganizationQueryRequest;
import com.capstone.be.dto.request.organization.UpdateOrganizationStatusRequest;
import com.capstone.be.dto.response.organization.OrganizationDetailResponse;
import com.capstone.be.dto.response.organization.OrganizationListResponse;
import com.capstone.be.service.OrganizationService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/organizations")
@RequiredArgsConstructor
public class OrganizationController {

  private final OrganizationService organizationService;

  @GetMapping("/{id}")
  public ResponseEntity<SuccessResponse<OrganizationDetailResponse>> getDetail(
      @PathVariable UUID id) {
    OrganizationDetailResponse response = organizationService.getDetail(id);
    return ResponseEntity.status(HttpStatus.OK).body(SuccessResponse.of(response));
  }

  @PostMapping
  public ResponseEntity<SuccessResponse<OrganizationListResponse>> query(
      @RequestBody @Valid OrganizationQueryRequest request) {
    OrganizationListResponse response = organizationService.query(request);
    return ResponseEntity.status(HttpStatus.OK).body(SuccessResponse.of(response));
  }

  @PatchMapping("/{id}/status")
  public ResponseEntity<SuccessResponse<OrganizationDetailResponse>> updateStatus(
      @PathVariable UUID id,
      @RequestBody @Valid UpdateOrganizationStatusRequest request) {
    OrganizationDetailResponse response = organizationService.updateStatus(id, request);
    return ResponseEntity.status(HttpStatus.OK).body(SuccessResponse.of(response));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<SuccessResponse<Void>> delete(@PathVariable UUID id) {
    organizationService.delete(id);
    return ResponseEntity.status(HttpStatus.OK).body(SuccessResponse.of(null));
  }

  @GetMapping("/all")
  public ResponseEntity<SuccessResponse<OrganizationListResponse>> getAll() {
    // Get all organizations (no pagination, no filters) for dropdown
    OrganizationListResponse response = organizationService.getAll();
    return ResponseEntity.status(HttpStatus.OK).body(SuccessResponse.of(response));
  }
}


