package com.capstone.be.controller;

import com.capstone.be.domain.enums.TagStatus;
import com.capstone.be.dto.common.ApiResponse;
import com.capstone.be.dto.common.PagedResponse;
import com.capstone.be.dto.request.tag.CreateTagRequest;
import com.capstone.be.dto.request.tag.ReviewTagRequest;
import com.capstone.be.dto.request.tag.UpdateTagRequest;
import com.capstone.be.dto.response.tag.TagResponse;
import com.capstone.be.service.TagService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller for Business Admin to manage tags
 * Only accessible by users with BUSINESS_ADMIN role
 */
@Slf4j
@RestController
@RequestMapping("/admin/tags")
@RequiredArgsConstructor
public class AdminTagController {

  private final TagService tagService;

  /**
   * Get all tags with optional filters (paginated)
   * GET /api/v1/admin/tags
   *
   * @param status   Tag status filter (optional)
   * @param name     Tag name filter (optional)
   * @param search   Tag name search filter (optional, takes precedence over name)
   * @param dateFrom Filter by creation date from (optional)
   * @param dateTo   Filter by creation date to (optional)
   * @param pageable Pagination parameters
   * @return PagedResponse of TagResponse
   */
  @GetMapping
  @PreAuthorize("hasRole('BUSINESS_ADMIN')")
  public ResponseEntity<PagedResponse<TagResponse>> getAllTags(
      @RequestParam(name = "status", required = false) TagStatus status,
      @RequestParam(name = "name", required = false) String name,
      @RequestParam(name = "dateFrom", required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.Instant dateFrom,
      @RequestParam(name = "dateTo", required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.Instant dateTo,
      Pageable pageable) {
    log.info("Admin requesting all tags - status: {}, name: {}, dateFrom: {}, dateTo: {}, page: {}, size: {}",
        status, name, dateFrom, dateTo, pageable.getPageNumber(), pageable.getPageSize());
    
    Page<TagResponse> page = tagService.getAllTagsForAdmin(status, name, dateFrom, dateTo, pageable);

    PagedResponse<TagResponse> response = PagedResponse.of(page, "Tags retrieved successfully");

    return ResponseEntity.ok(response);
  }

  /**
   * Get tag by ID
   * GET /api/v1/admin/tags/{tagId}
   *
   * @param tagId Tag ID
   * @return TagResponse
   */
  @GetMapping("/{tagId}")
  @PreAuthorize("hasRole('BUSINESS_ADMIN')")
  public ResponseEntity<ApiResponse<TagResponse>> getTagById(
      @PathVariable(name = "tagId") UUID tagId) {
    log.info("Admin requesting tag by ID: {}", tagId);

    TagResponse tagResponse = tagService.getTagById(tagId);

    ApiResponse<TagResponse> response = ApiResponse.<TagResponse>builder()
        .success(true)
        .message("Tag retrieved successfully")
        .data(tagResponse)
        .build();

    return ResponseEntity.ok(response);
  }

  /**
   * Create a new tag with ACTIVE status
   * POST /api/v1/admin/tags
   *
   * @param request CreateTagRequest
   * @return Created TagResponse
   */
  @PostMapping
  @PreAuthorize("hasRole('BUSINESS_ADMIN')")
  public ResponseEntity<ApiResponse<TagResponse>> createTag(
      @Valid @RequestBody CreateTagRequest request) {
    log.info("Admin creating new tag: {}", request.getName());

    TagResponse tagResponse = tagService.createTag(request);

    ApiResponse<TagResponse> response = ApiResponse.<TagResponse>builder()
        .success(true)
        .message("Tag created successfully")
        .data(tagResponse)
        .build();

    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  /**
   * Update an existing tag
   * PUT /api/v1/admin/tags/{tagId}
   *
   * @param tagId   Tag ID
   * @param request UpdateTagRequest
   * @return Updated TagResponse
   */
  @PutMapping("/{tagId}")
  @PreAuthorize("hasRole('BUSINESS_ADMIN')")
  public ResponseEntity<ApiResponse<TagResponse>> updateTag(
      @PathVariable(name = "tagId") UUID tagId,
      @Valid @RequestBody UpdateTagRequest request) {
    log.info("Admin updating tag: {}", tagId);

    TagResponse tagResponse = tagService.updateTag(tagId, request);

    ApiResponse<TagResponse> response = ApiResponse.<TagResponse>builder()
        .success(true)
        .message("Tag updated successfully")
        .data(tagResponse)
        .build();

    return ResponseEntity.ok(response);
  }

  /**
   * Review (accept/reject) a pending tag
   * POST /api/v1/admin/tags/{tagId}/review
   *
   * @param tagId   Tag ID
   * @param request ReviewTagRequest
   * @return Success response
   */
  @PostMapping("/{tagId}/review")
  @PreAuthorize("hasRole('BUSINESS_ADMIN')")
  public ResponseEntity<ApiResponse<Void>> reviewTag(
      @PathVariable(name = "tagId") UUID tagId,
      @Valid @RequestBody ReviewTagRequest request) {
    log.info("Admin reviewing tag: {}, approved: {}", tagId, request.getApproved());

    tagService.reviewTag(tagId, request);

    String message = Boolean.TRUE.equals(request.getApproved())
        ? "Tag approved successfully"
        : "Tag rejected successfully";

    ApiResponse<Void> response = ApiResponse.<Void>builder()
        .success(true)
        .message(message)
        .build();

    return ResponseEntity.ok(response);
  }

  /**
   * Delete a tag
   * DELETE /api/v1/admin/tags/{tagId}
   *
   * @param tagId Tag ID
   * @return Success response
   */
  @DeleteMapping("/{tagId}")
  @PreAuthorize("hasRole('BUSINESS_ADMIN')")
  public ResponseEntity<ApiResponse<Void>> deleteTag(
      @PathVariable(name = "tagId") UUID tagId) {
    log.info("Admin deleting tag: {}", tagId);

    tagService.deleteTag(tagId);

    ApiResponse<Void> response = ApiResponse.<Void>builder()
        .success(true)
        .message("Tag deleted successfully")
        .build();

    return ResponseEntity.ok(response);
  }
}
