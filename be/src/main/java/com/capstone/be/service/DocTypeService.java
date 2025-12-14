package com.capstone.be.service;

import com.capstone.be.domain.entity.DocType;
import com.capstone.be.dto.request.doctype.CreateDocTypeRequest;
import com.capstone.be.dto.request.doctype.UpdateDocTypeRequest;
import com.capstone.be.dto.response.doctype.DocTypeDetailResponse;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Service interface for Document Type resources
 */
public interface DocTypeService {

  /**
   * Get all document types
   *
   * @return List of all document types
   */
  List<DocType> getAllDocTypes();

  // ===== ADMIN METHODS =====

  /**
   * Get all document types (paginated)
   * For Business Admin
   *
   * @param name     Filter by name (optional)
   * @param dateFrom Filter by creation date from (optional)
   * @param dateTo   Filter by creation date to (optional)
   * @param pageable Pagination parameters
   * @return Page of DocTypeDetailResponse
   */
  Page<DocTypeDetailResponse> getAllDocTypesForAdmin(String name, java.time.Instant dateFrom, java.time.Instant dateTo, Pageable pageable);

  /**
   * Get document type by ID
   * For Business Admin
   *
   * @param docTypeId DocType ID
   * @return DocTypeDetailResponse
   */
  DocTypeDetailResponse getDocTypeById(UUID docTypeId);

  /**
   * Create a new document type
   * For Business Admin
   *
   * @param request CreateDocTypeRequest
   * @return Created DocTypeDetailResponse
   */
  DocTypeDetailResponse createDocType(CreateDocTypeRequest request);

  /**
   * Update an existing document type
   * For Business Admin
   *
   * @param docTypeId DocType ID (from path parameter)
   * @param request   UpdateDocTypeRequest
   * @return Updated DocTypeDetailResponse
   */
  DocTypeDetailResponse updateDocType(UUID docTypeId, UpdateDocTypeRequest request);

  /**
   * Delete a document type
   * For Business Admin
   *
   * @param docTypeId DocType ID
   */
  void deleteDocType(UUID docTypeId);
}
