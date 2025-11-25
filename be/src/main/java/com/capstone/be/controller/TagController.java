package com.capstone.be.controller;

import com.capstone.be.domain.entity.Tag;
import com.capstone.be.security.model.UserPrincipal;
import com.capstone.be.service.TagService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller for Tag resources
 * Requires authentication
 */
@Slf4j
@RestController
@RequestMapping("/tags")
@RequiredArgsConstructor
public class TagController {

  private final TagService tagService;

  /**
   * Get all active tags
   * Requires authentication
   * Only returns tags with ACTIVE status
   *
   * @param userPrincipal Authenticated user
   * @return List of active tags
   */
  @GetMapping
  @PreAuthorize("hasAnyRole('READER', 'ORGANIZATION_ADMIN')")
  public ResponseEntity<List<Tag>> getActiveTags(
      @AuthenticationPrincipal UserPrincipal userPrincipal) {
    log.info("User {} requesting active tags", userPrincipal.getId());

    List<Tag> tags = tagService.getActiveTags();

    log.info("Retrieved {} active tags", tags.size());
    return ResponseEntity.ok(tags);
  }

  /**
   * Get all tags (including pending)
   * Requires authentication
   * Returns all tags regardless of status
   *
   * @param userPrincipal Authenticated user
   * @return List of all tags
   */
  @GetMapping(value = "/all")
  @PreAuthorize("hasAnyRole('READER', 'ORGANIZATION_ADMIN')")
  public ResponseEntity<List<Tag>> getAllTags(
      @AuthenticationPrincipal UserPrincipal userPrincipal) {
    log.info("User {} requesting all tags (including pending)", userPrincipal.getId());

    List<Tag> tags = tagService.getAllTags();

    log.info("Retrieved {} tags (all statuses)", tags.size());
    return ResponseEntity.ok(tags);
  }
}
