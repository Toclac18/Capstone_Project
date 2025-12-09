package com.capstone.be.controller;

import com.capstone.be.domain.entity.DocType;
import com.capstone.be.security.model.UserPrincipal;
import com.capstone.be.service.DocTypeService;
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
 * Controller for Document Type resources
 * Requires authentication
 */
@Slf4j
@RestController
@RequestMapping("/doc-types")
@RequiredArgsConstructor
public class DocTypeController {

  private final DocTypeService docTypeService;

  /**
   * Get all document types
   * Requires authentication
   *
   * @param userPrincipal Authenticated user
   * @return List of all document types
   */
  @GetMapping
  @PreAuthorize("hasAnyRole('READER', 'ORGANIZATION_ADMIN', 'REVIEWER')")
  public ResponseEntity<List<DocType>> getDocTypes(
      @AuthenticationPrincipal UserPrincipal userPrincipal) {
    log.info("User {} requesting all document types", userPrincipal.getId());

    List<DocType> docTypes = docTypeService.getAllDocTypes();

    log.info("Retrieved {} document types", docTypes.size());
    return ResponseEntity.ok(docTypes);
  }
}
