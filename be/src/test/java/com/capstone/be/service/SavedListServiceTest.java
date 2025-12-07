package com.capstone.be.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.capstone.be.domain.entity.Document;
import com.capstone.be.domain.entity.ReaderProfile;
import com.capstone.be.domain.entity.SavedList;
import com.capstone.be.domain.entity.SavedListDocument;
import com.capstone.be.domain.entity.User;
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
import com.capstone.be.service.impl.SavedListServiceImpl;
import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("SavedListService Unit Tests")
class SavedListServiceTest {

  @Mock
  private SavedListRepository savedListRepository;

  @Mock
  private SavedListDocumentRepository savedListDocumentRepository;

  @Mock
  private ReaderProfileRepository readerProfileRepository;

  @Mock
  private DocumentRepository documentRepository;

  @Mock
  private SavedListMapper savedListMapper;

  @Mock
  private DocumentMapper documentMapper;

  @InjectMocks
  private SavedListServiceImpl savedListService;

  private User user;
  private ReaderProfile readerProfile;
  private SavedList savedList;
  private Document document;
  private UUID userId;
  private UUID readerId;
  private UUID savedListId;
  private UUID documentId;

  @BeforeEach
  void setUp() {
    userId = UUID.randomUUID();
    readerId = UUID.randomUUID();
    savedListId = UUID.randomUUID();
    documentId = UUID.randomUUID();

    user = User.builder()
        .id(userId)
        .email("reader@example.com")
        .fullName("Test Reader")
        .build();

    readerProfile = ReaderProfile.builder()
        .id(readerId)
        .user(user)
        .point(0)
        .build();

    document = Document.builder()
        .id(documentId)
        .title("Test Document")
        .build();

    savedList = SavedList.builder()
        .id(savedListId)
        .reader(readerProfile)
        .name("My List")
        .savedListDocuments(new HashSet<>())
        .createdAt(Instant.now())
        .updatedAt(Instant.now())
        .build();
  }

  // test getSavedLists should return all saved lists for reader
  @Test
  @DisplayName("getSavedLists should return all saved lists for reader")
  void getSavedLists_ShouldReturnSavedLists() {
    List<SavedList> savedLists = Arrays.asList(savedList);
    SavedListResponse response = SavedListResponse.builder()
        .id(savedListId)
        .name("My List")
        .build();

    when(readerProfileRepository.findByUserId(userId)).thenReturn(Optional.of(readerProfile));
    when(savedListRepository.findByReaderId(readerId)).thenReturn(savedLists);
    when(savedListMapper.toResponse(savedList)).thenReturn(response);

    List<SavedListResponse> result = savedListService.getSavedLists(userId);

    assertNotNull(result);
    assertEquals(1, result.size());
    assertEquals("My List", result.get(0).getName());
    verify(savedListRepository, times(1)).findByReaderId(readerId);
  }

  // test getSavedLists should throw exception when reader not found
  @Test
  @DisplayName("getSavedLists should throw exception when reader not found")
  void getSavedLists_ShouldThrowException_WhenReaderNotFound() {
    when(readerProfileRepository.findByUserId(userId)).thenReturn(Optional.empty());

    assertThrows(ResourceNotFoundException.class,
        () -> savedListService.getSavedLists(userId));
    verify(savedListRepository, never()).findByReaderId(any());
  }

  // test getSavedListDetail should return saved list detail
  @Test
  @DisplayName("getSavedListDetail should return saved list detail")
  void getSavedListDetail_ShouldReturnDetail() {
    SavedListDocument savedListDocument = SavedListDocument.builder()
        .document(document)
        .savedList(savedList)
        .build();
    savedList.getSavedListDocuments().add(savedListDocument);

    SavedListDetailResponse detailResponse = SavedListDetailResponse.builder()
        .id(savedListId)
        .name("My List")
        .build();

    DocumentLibraryResponse docResponse = DocumentLibraryResponse.builder()
        .id(documentId)
        .title("Test Document")
        .build();

    when(readerProfileRepository.findByUserId(userId)).thenReturn(Optional.of(readerProfile));
    when(savedListRepository.findById(savedListId)).thenReturn(Optional.of(savedList));
    when(savedListMapper.toDetailResponse(savedList)).thenReturn(detailResponse);
    when(documentMapper.toLibraryResponse(document)).thenReturn(docResponse);

    SavedListDetailResponse result = savedListService.getSavedListDetail(savedListId, userId);

    assertNotNull(result);
    assertEquals("My List", result.getName());
    verify(savedListRepository, times(1)).findById(savedListId);
  }

  // test getSavedListDetail should throw exception when not owner
  @Test
  @DisplayName("getSavedListDetail should throw exception when not owner")
  void getSavedListDetail_ShouldThrowException_WhenNotOwner() {
    UUID otherUserId = UUID.randomUUID();
    ReaderProfile otherReader = ReaderProfile.builder()
        .id(UUID.randomUUID())
        .user(User.builder().id(otherUserId).build())
        .build();

    when(readerProfileRepository.findByUserId(otherUserId)).thenReturn(Optional.of(otherReader));
    when(savedListRepository.findById(savedListId)).thenReturn(Optional.of(savedList));

    assertThrows(ForbiddenException.class,
        () -> savedListService.getSavedListDetail(savedListId, otherUserId));
  }

  // test createSavedList should create new saved list
  @Test
  @DisplayName("createSavedList should create new saved list")
  void createSavedList_ShouldCreateSavedList() {
    CreateSavedListRequest request = CreateSavedListRequest.builder()
        .name("New List")
        .build();

    SavedList newSavedList = SavedList.builder()
        .id(savedListId)
        .reader(readerProfile)
        .name("New List")
        .savedListDocuments(new HashSet<>())
        .build();

    SavedListResponse response = SavedListResponse.builder()
        .id(savedListId)
        .name("New List")
        .build();

    when(readerProfileRepository.findByUserId(userId)).thenReturn(Optional.of(readerProfile));
    when(savedListRepository.save(any(SavedList.class))).thenReturn(newSavedList);
    when(savedListRepository.findById(savedListId)).thenReturn(Optional.of(newSavedList));
    when(savedListMapper.toResponse(newSavedList)).thenReturn(response);

    SavedListResponse result = savedListService.createSavedList(userId, request);

    assertNotNull(result);
    assertEquals("New List", result.getName());
    verify(savedListRepository, times(1)).save(any(SavedList.class));
  }

  // test createSavedList should create saved list with document
  @Test
  @DisplayName("createSavedList should create saved list with document")
  void createSavedList_ShouldCreateWithDocument() {
    CreateSavedListRequest request = CreateSavedListRequest.builder()
        .name("New List")
        .documentId(documentId)
        .build();

    SavedList newSavedList = SavedList.builder()
        .id(savedListId)
        .reader(readerProfile)
        .name("New List")
        .savedListDocuments(new HashSet<>())
        .build();

    SavedListResponse response = SavedListResponse.builder()
        .id(savedListId)
        .name("New List")
        .build();

    when(readerProfileRepository.findByUserId(userId)).thenReturn(Optional.of(readerProfile));
    when(savedListRepository.save(any(SavedList.class))).thenReturn(newSavedList);
    when(documentRepository.findById(documentId)).thenReturn(Optional.of(document));
    when(savedListDocumentRepository.save(any(SavedListDocument.class)))
        .thenReturn(SavedListDocument.builder().build());
    when(savedListRepository.findById(savedListId)).thenReturn(Optional.of(newSavedList));
    when(savedListMapper.toResponse(newSavedList)).thenReturn(response);

    SavedListResponse result = savedListService.createSavedList(userId, request);

    assertNotNull(result);
    verify(savedListRepository, times(1)).save(any(SavedList.class));
    verify(savedListDocumentRepository, times(1)).save(any(SavedListDocument.class));
  }

  // test addDocumentToSavedList should add document
  @Test
  @DisplayName("addDocumentToSavedList should add document")
  void addDocumentToSavedList_ShouldAddDocument() {
    AddDocumentToSavedListRequest request = AddDocumentToSavedListRequest.builder()
        .documentId(documentId)
        .build();

    SavedListDocument savedListDocument = SavedListDocument.builder()
        .document(document)
        .savedList(savedList)
        .build();

    SavedListResponse response = SavedListResponse.builder()
        .id(savedListId)
        .name("My List")
        .build();

    when(readerProfileRepository.findByUserId(userId)).thenReturn(Optional.of(readerProfile));
    when(savedListRepository.findById(savedListId)).thenReturn(Optional.of(savedList));
    when(documentRepository.findById(documentId)).thenReturn(Optional.of(document));
    when(savedListDocumentRepository.existsBySavedListIdAndDocumentId(savedListId, documentId))
        .thenReturn(false);
    when(savedListDocumentRepository.save(any(SavedListDocument.class)))
        .thenReturn(savedListDocument);
    when(savedListMapper.toResponse(savedList)).thenReturn(response);

    SavedListResponse result = savedListService.addDocumentToSavedList(savedListId, userId, request);

    assertNotNull(result);
    verify(savedListDocumentRepository, times(1)).save(any(SavedListDocument.class));
  }

  // test addDocumentToSavedList should throw exception when document already exists
  @Test
  @DisplayName("addDocumentToSavedList should throw exception when document already exists")
  void addDocumentToSavedList_ShouldThrowException_WhenDocumentExists() {
    AddDocumentToSavedListRequest request = AddDocumentToSavedListRequest.builder()
        .documentId(documentId)
        .build();

    when(readerProfileRepository.findByUserId(userId)).thenReturn(Optional.of(readerProfile));
    when(savedListRepository.findById(savedListId)).thenReturn(Optional.of(savedList));
    when(documentRepository.findById(documentId)).thenReturn(Optional.of(document));
    when(savedListDocumentRepository.existsBySavedListIdAndDocumentId(savedListId, documentId))
        .thenReturn(true);

    assertThrows(DuplicateResourceException.class,
        () -> savedListService.addDocumentToSavedList(savedListId, userId, request));
    verify(savedListDocumentRepository, never()).save(any());
  }

  // test updateSavedList should update saved list name
  @Test
  @DisplayName("updateSavedList should update saved list name")
  void updateSavedList_ShouldUpdateName() {
    UpdateSavedListRequest request = UpdateSavedListRequest.builder()
        .name("Updated List")
        .build();

    SavedList updatedSavedList = SavedList.builder()
        .id(savedListId)
        .reader(readerProfile)
        .name("Updated List")
        .build();

    SavedListResponse response = SavedListResponse.builder()
        .id(savedListId)
        .name("Updated List")
        .build();

    when(readerProfileRepository.findByUserId(userId)).thenReturn(Optional.of(readerProfile));
    when(savedListRepository.findById(savedListId)).thenReturn(Optional.of(savedList));
    when(savedListRepository.save(any(SavedList.class))).thenReturn(updatedSavedList);
    when(savedListMapper.toResponse(updatedSavedList)).thenReturn(response);

    SavedListResponse result = savedListService.updateSavedList(savedListId, userId, request);

    assertEquals("Updated List", result.getName());
    verify(savedListRepository, times(1)).save(any(SavedList.class));
  }

  // test removeDocumentFromSavedList should remove document
  @Test
  @DisplayName("removeDocumentFromSavedList should remove document")
  void removeDocumentFromSavedList_ShouldRemoveDocument() {
    SavedListDocument savedListDocument = SavedListDocument.builder()
        .document(document)
        .savedList(savedList)
        .build();

    when(readerProfileRepository.findByUserId(userId)).thenReturn(Optional.of(readerProfile));
    when(savedListRepository.findById(savedListId)).thenReturn(Optional.of(savedList));
    when(savedListDocumentRepository.findBySavedListIdAndDocumentId(savedListId, documentId))
        .thenReturn(Optional.of(savedListDocument));

    savedListService.removeDocumentFromSavedList(savedListId, documentId, userId);

    verify(savedListDocumentRepository, times(1)).delete(savedListDocument);
  }

  // test deleteSavedList should delete saved list
  @Test
  @DisplayName("deleteSavedList should delete saved list")
  void deleteSavedList_ShouldDeleteSavedList() {
    when(readerProfileRepository.findByUserId(userId)).thenReturn(Optional.of(readerProfile));
    when(savedListRepository.findById(savedListId)).thenReturn(Optional.of(savedList));

    savedListService.deleteSavedList(savedListId, userId);

    verify(savedListRepository, times(1)).delete(savedList);
  }

  // test deleteSavedList should throw exception when not owner
  @Test
  @DisplayName("deleteSavedList should throw exception when not owner")
  void deleteSavedList_ShouldThrowException_WhenNotOwner() {
    UUID otherUserId = UUID.randomUUID();
    ReaderProfile otherReader = ReaderProfile.builder()
        .id(UUID.randomUUID())
        .user(User.builder().id(otherUserId).build())
        .build();

    when(readerProfileRepository.findByUserId(otherUserId)).thenReturn(Optional.of(otherReader));
    when(savedListRepository.findById(savedListId)).thenReturn(Optional.of(savedList));

    assertThrows(ForbiddenException.class,
        () -> savedListService.deleteSavedList(savedListId, otherUserId));
    verify(savedListRepository, never()).delete(any());
  }
}

