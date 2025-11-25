package com.capstone.be.controller;

import com.capstone.be.domain.enums.UserStatus;
import com.capstone.be.dto.request.admin.UpdateUserStatusRequest;
import com.capstone.be.dto.response.admin.AdminReviewerResponse;
import com.capstone.be.service.UserService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller for Business Admin to manage Reviewers
 */
@Slf4j
@RestController
@RequestMapping("/admin/reviewers")
@RequiredArgsConstructor
@PreAuthorize("hasRole('BUSINESS_ADMIN')")
public class AdminReviewerController {

  private final UserService userService;

  /**
   * Get all reviewers with optional filters
   * GET /api/v1/admin/reviewers
   */
  @GetMapping
  public ResponseEntity<Page<AdminReviewerResponse>> getAllReviewers(
      @RequestParam(name = "status", required = false) UserStatus status,
      @RequestParam(name = "search", required = false) String search,
      @RequestParam(name = "page", defaultValue = "0") int page,
      @RequestParam(name = "size", defaultValue = "20") int size,
      @RequestParam(name = "sort", defaultValue = "createdAt") String sort,
      @RequestParam(name = "order", defaultValue = "desc") String order) {

    log.info("Admin get all reviewers - status: {}, search: {}, page: {}, size: {}", status, search,
        page, size);

    Sort.Direction direction =
        order.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
    Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sort));

    Page<AdminReviewerResponse> reviewers = userService.getAllReviewers(status, search, pageable);

    return ResponseEntity.ok(reviewers);
  }

  /**
   * Get reviewer detail by ID
   * GET /api/v1/admin/reviewers/{userId}
   */
  @GetMapping("/{userId}")
  public ResponseEntity<AdminReviewerResponse> getReviewerDetail(
      @PathVariable(name = "userId") UUID userId) {
    log.info("Admin get reviewer detail for ID: {}", userId);

    AdminReviewerResponse reviewer = userService.getReviewerDetail(userId);

    return ResponseEntity.ok(reviewer);
  }

  /**
   * Update reviewer status
   * PUT /api/v1/admin/reviewers/{userId}/status
   */
  @PutMapping("/{userId}/status")
  public ResponseEntity<AdminReviewerResponse> updateReviewerStatus(
      @PathVariable(name = "userId") UUID userId,
      @Valid @RequestBody UpdateUserStatusRequest request) {

    log.info("Admin update reviewer status for ID: {} to {}", userId, request.getStatus());

    AdminReviewerResponse reviewer = userService.updateReviewerStatus(userId, request);

    return ResponseEntity.ok(reviewer);
  }
}
