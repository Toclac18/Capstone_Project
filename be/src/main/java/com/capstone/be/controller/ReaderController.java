package com.capstone.be.controller;

import com.capstone.be.dto.request.reader.UpdateReaderProfileRequest;
import com.capstone.be.dto.response.reader.ReaderProfileResponse;
import com.capstone.be.security.model.UserPrincipal;
import com.capstone.be.service.ReaderService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller for Reader-specific operations
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/reader")
@RequiredArgsConstructor
public class ReaderController {

  private final ReaderService readerService;

  /**
   * Get reader profile
   * GET /api/v1/reader/profile
   *
   * @return ReaderProfileResponse
   */
  @GetMapping("/profile")
  @PreAuthorize("hasRole('READER')")
  public ResponseEntity<ReaderProfileResponse> getProfile(
      @AuthenticationPrincipal UserPrincipal userPrincipal) {
    UUID userId = userPrincipal.getId();
    log.info("Get profile request for reader user ID: {}", userId);

    ReaderProfileResponse response = readerService.getProfile(userId);

    return ResponseEntity.ok(response);
  }

  /**
   * Update reader profile PUT /api/v1/reader/profile
   *
   * @param request        Update profile request
   * @return Updated ReaderProfileResponse
   */
  @PutMapping("/profile")
  @PreAuthorize("hasRole('READER')")
  public ResponseEntity<ReaderProfileResponse> updateProfile(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @Valid @RequestBody UpdateReaderProfileRequest request) {
    UUID userId = userPrincipal.getId();
    log.info("Update profile request for reader user ID: {}", userId);

    ReaderProfileResponse response = readerService.updateProfile(userId, request);

    return ResponseEntity.ok(response);
  }

}
