package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.Document;
import com.capstone.be.domain.entity.ReaderProfile;
import com.capstone.be.domain.entity.SavedList;
import com.capstone.be.domain.entity.SavedListDocument;
import com.capstone.be.dto.request.savedlist.AddDocumentToSavedListRequest;
import com.capstone.be.dto.request.savedlist.CreateSavedListRequest;
import com.capstone.be.dto.request.savedlist.UpdateSavedListRequest;
import com.capstone.be.dto.response.document.DocumentLibraryResponse;
import com.capstone.be.dto.response.savedlist.SavedListDetailResponse;
import com.capstone.be.dto.response.savedlist.SavedListResponse;
import com.capstone.be.exception.DuplicateResourceException;
import com.capstone.be.exception.ForbiddenException;
import com.capstone.be.exception.ResourceNotFoundException;
import com.capstone.be.mapper.DocumentMapper;
import com.capstone.be.mapper.SavedListMapper;
import com.capstone.be.repository.DocumentRepository;
import com.capstone.be.repository.ReaderProfileRepository;
import com.capstone.be.repository.SavedListDocumentRepository;
import com.capstone.be.repository.SavedListRepository;
import com.capstone.be.service.SavedListService;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Implementation of SavedListService for SavedList management
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SavedListServiceImpl implements SavedListService {

  private final SavedListRepository savedListRepository;
  private final SavedListDocumentRepository savedListDocumentRepository;
  private final ReaderProfileRepository readerProfileRepository;
  private final DocumentRepository documentRepository;
  private final SavedListMapper savedListMapper;
  private final DocumentMapper documentMapper;

  @Override
  @Transactional(readOnly = true)
  public List<SavedListResponse> getSavedLists(UUID readerId) {
    log.debug("Getting all SavedLists for reader: {}", readerId);

    // Verify reader exists
    ReaderProfile reader = readerProfileRepository.findByUserId(readerId)
        .orElseThrow(() -> new ResourceNotFoundException("ReaderProfile", "userId", readerId));

    List<SavedList> savedLists = savedListRepository.findByReaderId(reader.getId());

    return savedLists.stream()
        .map(savedListMapper::toResponse)
        .collect(Collectors.toList());
  }

  @Override
  @Transactional(readOnly = true)
  public SavedListDetailResponse getSavedListDetail(UUID savedListId, UUID readerId) {
    log.debug("Getting SavedList detail: {} for reader: {}", savedListId, readerId);

    // Verify reader exists
    ReaderProfile reader = readerProfileRepository.findByUserId(readerId)
        .orElseThrow(() -> new ResourceNotFoundException("ReaderProfile", "userId", readerId));

    // Get SavedList and verify ownership
    SavedList savedList = savedListRepository.findById(savedListId)
        .orElseThrow(() -> new ResourceNotFoundException("SavedList", savedListId));

    if (!savedList.getReader().getId().equals(reader.getId())) {
      throw new ForbiddenException("You don't have permission to access this SavedList");
    }

    // Map to response
    SavedListDetailResponse response = savedListMapper.toDetailResponse(savedList);

    // Get all documents in this SavedList
    List<DocumentLibraryResponse> documents = savedList.getSavedListDocuments().stream()
        .map(SavedListDocument::getDocument)
        .map(documentMapper::toLibraryResponse)
        .collect(Collectors.toList());

    response.setDocuments(documents);

    return response;
  }

  @Override
  @Transactional
  public SavedListResponse createSavedList(UUID readerId, CreateSavedListRequest request) {
    log.debug("Creating new SavedList for reader: {}", readerId);

    // Verify reader exists
    ReaderProfile reader = readerProfileRepository.findByUserId(readerId)
        .orElseThrow(() -> new ResourceNotFoundException("ReaderProfile", "userId", readerId));

    // Check for duplicate name
    String trimmedName = request.getName().trim();
    if (savedListRepository.existsByReaderIdAndName(reader.getId(), trimmedName)) {
      log.warn("SavedList with name '{}' already exists for reader: {}", trimmedName, readerId);
      throw new DuplicateResourceException("SavedList", "name", trimmedName);
    }

    // Create SavedList
    SavedList savedList = SavedList.builder()
        .reader(reader)
        .name(trimmedName)
        .build();

    SavedList createdList = savedListRepository.save(savedList);
    log.info("Created SavedList: {} for reader: {}", createdList.getId(), readerId);

    // If documentId is provided, add it to the list
    if (request.getDocumentId() != null) {
      UUID docId = request.getDocumentId();
      Document document = documentRepository.findById(docId)
          .orElseThrow(() -> new ResourceNotFoundException("Document", docId));

      SavedListDocument savedListDocument = SavedListDocument.builder()
          .savedList(createdList)
          .document(document)
          .build();

      savedListDocumentRepository.save(savedListDocument);
      log.info("Added document: {} to SavedList: {}", docId, createdList.getId());
    }

    // Refresh to get updated savedListDocuments
    UUID savedListId = createdList.getId();
    SavedList refreshedList = savedListRepository.findById(savedListId)
        .orElseThrow(() -> new ResourceNotFoundException("SavedList", savedListId));

    return savedListMapper.toResponse(refreshedList);
  }

  @Override
  @Transactional
  public SavedListResponse addDocumentToSavedList(UUID savedListId, UUID readerId,
      AddDocumentToSavedListRequest request) {
    log.debug("Adding document: {} to SavedList: {}", request.getDocumentId(), savedListId);

    // Verify reader exists
    ReaderProfile reader = readerProfileRepository.findByUserId(readerId)
        .orElseThrow(() -> new ResourceNotFoundException("ReaderProfile", "userId", readerId));

    // Get SavedList and verify ownership
    SavedList savedList = savedListRepository.findById(savedListId)
        .orElseThrow(() -> new ResourceNotFoundException("SavedList", savedListId));

    if (!savedList.getReader().getId().equals(reader.getId())) {
      throw new ForbiddenException("You don't have permission to modify this SavedList");
    }

    // Verify document exists
    UUID docId = request.getDocumentId();
    Document document = documentRepository.findById(docId)
        .orElseThrow(() -> new ResourceNotFoundException("Document", docId));

    // Check if document already exists in SavedList
    if (savedListDocumentRepository.existsBySavedListIdAndDocumentId(savedListId, docId)) {
      throw new DuplicateResourceException(
          "Document already exists in this SavedList");
    }

    // Add document to SavedList
    SavedListDocument savedListDocument = SavedListDocument.builder()
        .savedList(savedList)
        .document(document)
        .build();

    savedListDocumentRepository.save(savedListDocument);
    log.info("Added document: {} to SavedList: {}", docId, savedListId);

    // Refresh to get updated savedListDocuments
    SavedList refreshedList = savedListRepository.findById(savedListId)
        .orElseThrow(() -> new ResourceNotFoundException("SavedList", savedListId));

    return savedListMapper.toResponse(refreshedList);
  }

  @Override
  @Transactional
  public SavedListResponse updateSavedList(UUID savedListId, UUID readerId,
      UpdateSavedListRequest request) {
    log.debug("Updating SavedList: {} for reader: {}", savedListId, readerId);

    // Verify reader exists
    ReaderProfile reader = readerProfileRepository.findByUserId(readerId)
        .orElseThrow(() -> new ResourceNotFoundException("ReaderProfile", "userId", readerId));

    // Get SavedList and verify ownership
    SavedList savedList = savedListRepository.findById(savedListId)
        .orElseThrow(() -> new ResourceNotFoundException("SavedList", savedListId));

    if (!savedList.getReader().getId().equals(reader.getId())) {
      throw new ForbiddenException("You don't have permission to modify this SavedList");
    }

    // Check if name is different
    String trimmedName = request.getName().trim();
    if (!savedList.getName().equals(trimmedName)) {
      // Check for duplicate name (excluding current list)
      if (savedListRepository.existsByReaderIdAndNameAndIdNot(reader.getId(), trimmedName, savedListId)) {
        log.warn("SavedList with name '{}' already exists for reader: {}", trimmedName, readerId);
        throw new DuplicateResourceException("SavedList", "name", trimmedName);
      }

      // Update name
      savedList.setName(trimmedName);
    }

    savedList = savedListRepository.save(savedList);
    log.info("Updated SavedList: {} with new name: {}", savedListId, trimmedName);

    return savedListMapper.toResponse(savedList);
  }

  @Override
  @Transactional
  public void removeDocumentFromSavedList(UUID savedListId, UUID documentId, UUID readerId) {
    log.debug("Removing document: {} from SavedList: {}", documentId, savedListId);

    // Verify reader exists
    ReaderProfile reader = readerProfileRepository.findByUserId(readerId)
        .orElseThrow(() -> new ResourceNotFoundException("ReaderProfile", "userId", readerId));

    // Get SavedList and verify ownership
    SavedList savedList = savedListRepository.findById(savedListId)
        .orElseThrow(() -> new ResourceNotFoundException("SavedList", savedListId));

    if (!savedList.getReader().getId().equals(reader.getId())) {
      throw new ForbiddenException("You don't have permission to modify this SavedList");
    }

    // Find and delete SavedListDocument
    SavedListDocument savedListDocument = savedListDocumentRepository
        .findBySavedListIdAndDocumentId(savedListId, documentId)
        .orElseThrow(() -> new ResourceNotFoundException(
            "Document not found in this SavedList"));

    savedListDocumentRepository.delete(savedListDocument);
    log.info("Removed document: {} from SavedList: {}", documentId, savedListId);
  }

  @Override
  @Transactional
  public void deleteSavedList(UUID savedListId, UUID readerId) {
    log.debug("Deleting SavedList: {}", savedListId);

    // Verify reader exists
    ReaderProfile reader = readerProfileRepository.findByUserId(readerId)
        .orElseThrow(() -> new ResourceNotFoundException("ReaderProfile", "userId", readerId));

    // Get SavedList and verify ownership
    SavedList savedList = savedListRepository.findById(savedListId)
        .orElseThrow(() -> new ResourceNotFoundException("SavedList", savedListId));

    if (!savedList.getReader().getId().equals(reader.getId())) {
      throw new ForbiddenException("You don't have permission to delete this SavedList");
    }

    // Delete SavedList (cascade will delete SavedListDocuments)
    savedListRepository.delete(savedList);
    log.info("Deleted SavedList: {}", savedListId);
  }
}
