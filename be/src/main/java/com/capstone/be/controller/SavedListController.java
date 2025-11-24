package com.capstone.be.controller;

import com.capstone.be.dto.request.savedlist.AddDocumentToSavedListRequest;
import com.capstone.be.dto.request.savedlist.CreateSavedListRequest;
import com.capstone.be.dto.response.savedlist.SavedListDetailResponse;
import com.capstone.be.dto.response.savedlist.SavedListResponse;
import com.capstone.be.security.model.UserPrincipal;
import com.capstone.be.service.SavedListService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller for SavedList management
 */
@Slf4j
@RestController
@RequestMapping("/save-lists")
@RequiredArgsConstructor
public class SavedListController {

  private final SavedListService savedListService;

  /**
   * Get all SavedLists for the authenticated reader
   * GET /api/save-lists
   *
   * @param userPrincipal Authenticated user
   * @return List of SavedListResponse
   */
  @GetMapping
  @PreAuthorize("hasAnyRole('READER', 'ORGANIZATION_ADMIN')")
  public ResponseEntity<List<SavedListResponse>> getSavedLists(
      @AuthenticationPrincipal UserPrincipal userPrincipal) {
    UUID readerId = userPrincipal.getId();
    log.info("User {} getting all SavedLists", readerId);

    List<SavedListResponse> savedLists = savedListService.getSavedLists(readerId);

    return ResponseEntity.ok(savedLists);
  }

  /**
   * Get a SavedList by ID with full document details
   * GET /api/save-lists/{id}
   *
   * @param userPrincipal Authenticated user
   * @param id            SavedList ID
   * @return SavedListDetailResponse
   */
  @GetMapping("/{id}")
  @PreAuthorize("hasAnyRole('READER', 'ORGANIZATION_ADMIN')")
  public ResponseEntity<SavedListDetailResponse> getSavedListDetail(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @PathVariable(name = "id") UUID id) {
    UUID readerId = userPrincipal.getId();
    log.info("User {} getting SavedList detail: {}", readerId, id);

    SavedListDetailResponse savedList = savedListService.getSavedListDetail(id, readerId);

    return ResponseEntity.ok(savedList);
  }

  /**
   * Create a new SavedList, optionally adding a document
   * POST /api/save-lists
   *
   * @param userPrincipal Authenticated user
   * @param request       CreateSavedListRequest
   * @return SavedListResponse
   */
  @PostMapping
  @PreAuthorize("hasAnyRole('READER', 'ORGANIZATION_ADMIN')")
  public ResponseEntity<SavedListResponse> createSavedList(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @Valid @RequestBody CreateSavedListRequest request) {
    UUID readerId = userPrincipal.getId();
    log.info("User {} creating new SavedList: {}", readerId, request.getName());

    SavedListResponse savedList = savedListService.createSavedList(readerId, request);

    return ResponseEntity.status(HttpStatus.CREATED).body(savedList);
  }

  /**
   * Add a document to an existing SavedList
   * POST /api/save-lists/{id}/documents
   *
   * @param userPrincipal Authenticated user
   * @param id            SavedList ID
   * @param request       AddDocumentToSavedListRequest
   * @return SavedListResponse
   */
  @PostMapping("/{id}/documents")
  @PreAuthorize("hasAnyRole('READER', 'ORGANIZATION_ADMIN')")
  public ResponseEntity<SavedListResponse> addDocumentToSavedList(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @PathVariable(name = "id") UUID id,
      @Valid @RequestBody AddDocumentToSavedListRequest request) {
    UUID readerId = userPrincipal.getId();
    log.info("User {} adding document {} to SavedList {}", readerId, request.getDocumentId(), id);

    SavedListResponse savedList = savedListService.addDocumentToSavedList(id, readerId, request);

    return ResponseEntity.ok(savedList);
  }

  /**
   * Remove a document from a SavedList
   * DELETE /api/save-lists/{id}/documents/{documentId}
   *
   * @param userPrincipal Authenticated user
   * @param id            SavedList ID
   * @param documentId    Document ID
   * @return No content
   */
  @DeleteMapping("/{id}/documents/{documentId}")
  @PreAuthorize("hasAnyRole('READER', 'ORGANIZATION_ADMIN')")
  public ResponseEntity<Void> removeDocumentFromSavedList(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @PathVariable(name = "id") UUID id,
      @PathVariable(name = "documentId") UUID documentId) {
    UUID readerId = userPrincipal.getId();
    log.info("User {} removing document {} from SavedList {}", readerId, documentId, id);

    savedListService.removeDocumentFromSavedList(id, documentId, readerId);

    return ResponseEntity.noContent().build();
  }

  /**
   * Delete a SavedList
   * DELETE /api/save-lists/{id}
   *
   * @param userPrincipal Authenticated user
   * @param id            SavedList ID
   * @return No content
   */
  @DeleteMapping("/{id}")
  @PreAuthorize("hasAnyRole('READER', 'ORGANIZATION_ADMIN')")
  public ResponseEntity<Void> deleteSavedList(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @PathVariable(name = "id") UUID id) {
    UUID readerId = userPrincipal.getId();
    log.info("User {} deleting SavedList {}", readerId, id);

    savedListService.deleteSavedList(id, readerId);

    return ResponseEntity.noContent().build();
  }
}
