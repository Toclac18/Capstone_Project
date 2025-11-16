package com.capstone.be.controller;

import com.capstone.be.dto.response.reader.ReaderProfileResponse;
import com.capstone.be.service.ReaderService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
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
}
