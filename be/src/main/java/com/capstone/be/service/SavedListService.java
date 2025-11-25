package com.capstone.be.service;

import com.capstone.be.dto.request.savedlist.AddDocumentToSavedListRequest;
import com.capstone.be.dto.request.savedlist.CreateSavedListRequest;
import com.capstone.be.dto.request.savedlist.UpdateSavedListRequest;
import com.capstone.be.dto.response.savedlist.SavedListDetailResponse;
import com.capstone.be.dto.response.savedlist.SavedListResponse;
import java.util.List;
import java.util.UUID;

/**
 * Service interface for SavedList management
 */
public interface SavedListService {

  /**
   * Get all SavedLists for a reader
   *
   * @param readerId Reader user ID
   * @return List of SavedListResponse
   */
  List<SavedListResponse> getSavedLists(UUID readerId);

  /**
   * Get a SavedList by ID with full document details
   *
   * @param savedListId SavedList ID
   * @param readerId    Reader user ID (for authorization)
   * @return SavedListDetailResponse
   */
  SavedListDetailResponse getSavedListDetail(UUID savedListId, UUID readerId);

  /**
   * Create a new SavedList for a reader, optionally adding a document
   *
   * @param readerId Reader user ID
   * @param request  CreateSavedListRequest
   * @return SavedListResponse
   */
  SavedListResponse createSavedList(UUID readerId, CreateSavedListRequest request);

  /**
   * Add a document to an existing SavedList
   *
   * @param savedListId SavedList ID
   * @param readerId    Reader user ID (for authorization)
   * @param request     AddDocumentToSavedListRequest
   * @return SavedListResponse
   */
  SavedListResponse addDocumentToSavedList(UUID savedListId, UUID readerId,
      AddDocumentToSavedListRequest request);

  /**
   * Update SavedList name
   *
   * @param savedListId SavedList ID
   * @param readerId    Reader user ID (for authorization)
   * @param request     UpdateSavedListRequest
   * @return SavedListResponse
   */
  SavedListResponse updateSavedList(UUID savedListId, UUID readerId,
      UpdateSavedListRequest request);

  /**
   * Remove a document from a SavedList
   *
   * @param savedListId SavedList ID
   * @param documentId  Document ID
   * @param readerId    Reader user ID (for authorization)
   */
  void removeDocumentFromSavedList(UUID savedListId, UUID documentId, UUID readerId);

  /**
   * Delete a SavedList
   *
   * @param savedListId SavedList ID
   * @param readerId    Reader user ID (for authorization)
   */
  void deleteSavedList(UUID savedListId, UUID readerId);
}
