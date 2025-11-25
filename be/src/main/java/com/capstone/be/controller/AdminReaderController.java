package com.capstone.be.controller;

import com.capstone.be.domain.enums.UserStatus;
import com.capstone.be.dto.request.admin.UpdateUserStatusRequest;
import com.capstone.be.dto.response.admin.AdminReaderResponse;
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
 * Controller for Business Admin to manage Readers
 */
@Slf4j
@RestController
@RequestMapping("/admin/readers")
@RequiredArgsConstructor
@PreAuthorize("hasRole('BUSINESS_ADMIN')")
public class AdminReaderController {

  private final UserService userService;

  /**
   * Get all readers with optional filters
   * GET /api/v1/admin/readers
   */
  @GetMapping
  public ResponseEntity<Page<AdminReaderResponse>> getAllReaders(
      @RequestParam(name = "status", required = false) UserStatus status,
      @RequestParam(name = "search", required = false) String search,
      @RequestParam(name = "page", defaultValue = "0") int page,
      @RequestParam(name = "size", defaultValue = "20") int size,
      @RequestParam(name = "sort", defaultValue = "createdAt") String sort,
      @RequestParam(name = "order", defaultValue = "desc") String order) {

    log.info("Admin get all readers - status: {}, search: {}, page: {}, size: {}", status, search,
        page, size);

    Sort.Direction direction =
        order.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
    Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sort));

    Page<AdminReaderResponse> readers = userService.getAllReaders(status, search, pageable);

    return ResponseEntity.ok(readers);
  }

  /**
   * Get reader detail by ID
   * GET /api/v1/admin/readers/{userId}
   */
  @GetMapping("/{userId}")
  public ResponseEntity<AdminReaderResponse> getReaderDetail(
      @PathVariable(name = "userId") UUID userId) {
    log.info("Admin get reader detail for ID: {}", userId);

    AdminReaderResponse reader = userService.getReaderDetail(userId);

    return ResponseEntity.ok(reader);
  }

  /**
   * Update reader status
   * PUT /api/v1/admin/readers/{userId}/status
   */
  @PutMapping("/{userId}/status")
  public ResponseEntity<AdminReaderResponse> updateReaderStatus(
      @PathVariable(name = "userId") UUID userId,
      @Valid @RequestBody UpdateUserStatusRequest request) {

    log.info("Admin update reader status for ID: {} to {}", userId, request.getStatus());

    AdminReaderResponse reader = userService.updateReaderStatus(userId, request);

    return ResponseEntity.ok(reader);
  }
}
