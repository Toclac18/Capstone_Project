package com.capstone.be.controller;

import com.capstone.be.dto.request.reader.UpdateReaderProfileRequest;
import com.capstone.be.dto.response.reader.ReaderProfileResponse;
import com.capstone.be.service.ReaderService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

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
   * @param authentication Spring Security authentication
   * @return ReaderProfileResponse
   */
  @GetMapping("/profile")
  @PreAuthorize("hasRole('READER')")
  public ResponseEntity<ReaderProfileResponse> getProfile(Authentication authentication) {
    UUID userId = UUID.fromString(authentication.getName());
    log.info("Get profile request for reader user ID: {}", userId);

    ReaderProfileResponse response = readerService.getProfile(userId);

    return ResponseEntity.ok(response);
  }

  /**
   * Update reader profile PUT /api/v1/reader/profile
   *
   * @param authentication Spring Security authentication
   * @param request        Update profile request
   * @return Updated ReaderProfileResponse
   */
  @PutMapping("/profile")
  @PreAuthorize("hasRole('READER')")
  public ResponseEntity<ReaderProfileResponse> updateProfile(
      Authentication authentication,
      @Valid @RequestBody UpdateReaderProfileRequest request) {
    UUID userId = UUID.fromString(authentication.getName());
    log.info("Update profile request for reader user ID: {}", userId);

    ReaderProfileResponse response = readerService.updateProfile(userId, request);

    return ResponseEntity.ok(response);
  }

  /**
   * Upload avatar for reader POST /api/v1/reader/profile/avatar
   *
   * @param authentication Spring Security authentication
   * @param file           Avatar image file
   * @return Updated ReaderProfileResponse with new avatar URL
   */
  @PostMapping("/profile/avatar")
  @PreAuthorize("hasRole('READER')")
  public ResponseEntity<ReaderProfileResponse> uploadAvatar(
      Authentication authentication,
      @RequestParam(value = "file", required = true) MultipartFile file) {
    UUID userId = UUID.fromString(authentication.getName());
    log.info("Upload avatar request for reader user ID: {}", userId);

    ReaderProfileResponse response = readerService.uploadAvatar(userId, file);

    return ResponseEntity.ok(response);
  }
}
