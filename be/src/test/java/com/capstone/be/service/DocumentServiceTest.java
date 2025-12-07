package com.capstone.be.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isA;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.capstone.be.config.constant.FileStorage;
import com.capstone.be.domain.entity.DocType;
import com.capstone.be.domain.entity.Document;
import com.capstone.be.domain.entity.DocumentReadHistory;
import com.capstone.be.domain.entity.DocumentRedemption;
import com.capstone.be.domain.entity.OrganizationProfile;
import com.capstone.be.domain.entity.ReaderProfile;
import com.capstone.be.domain.entity.Specialization;
import com.capstone.be.domain.entity.Tag;
import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.DocStatus;
import com.capstone.be.domain.enums.DocVisibility;
import com.capstone.be.domain.enums.TagStatus;
import com.capstone.be.dto.request.document.DocumentLibraryFilter;
import com.capstone.be.dto.request.document.DocumentSearchFilter;
import com.capstone.be.dto.request.document.DocumentUploadHistoryFilter;
import com.capstone.be.dto.request.document.UpdateDocumentRequest;
import com.capstone.be.dto.request.document.UploadDocumentInfoRequest;
import com.capstone.be.dto.response.document.DocumentDetailResponse;
import com.capstone.be.dto.response.document.DocumentLibraryResponse;
import com.capstone.be.dto.response.document.DocumentPresignedUrlResponse;
import com.capstone.be.dto.response.document.DocumentReadHistoryResponse;
import com.capstone.be.dto.response.document.DocumentSearchResponse;
import com.capstone.be.dto.response.document.DocumentUploadResponse;
import com.capstone.be.exception.BusinessException;
import com.capstone.be.exception.ForbiddenException;
import com.capstone.be.exception.ResourceNotFoundException;
import com.capstone.be.mapper.DocumentMapper;
import com.capstone.be.repository.DocTypeRepository;
import com.capstone.be.repository.DocumentReadHistoryRepository;
import com.capstone.be.repository.DocumentRedemptionRepository;
import com.capstone.be.repository.DocumentRepository;
import com.capstone.be.repository.DocumentTagLinkRepository;
import com.capstone.be.repository.OrganizationProfileRepository;
import com.capstone.be.repository.ReaderProfileRepository;
import com.capstone.be.repository.SpecializationRepository;
import com.capstone.be.repository.TagRepository;
import com.capstone.be.repository.UserRepository;
import com.capstone.be.service.DocumentAccessService;
import com.capstone.be.service.DocumentThumbnailService;
import com.capstone.be.service.FileStorageService;
import com.capstone.be.service.impl.DocumentServiceImpl;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

@ExtendWith(MockitoExtension.class)
@DisplayName("DocumentService Unit Tests")
class DocumentServiceTest {

  @Mock
  private UserRepository userRepository;

  @Mock
  private ReaderProfileRepository readerProfileRepository;

  @Mock
  private OrganizationProfileRepository organizationProfileRepository;

  @Mock
  private SpecializationRepository specializationRepository;

  @Mock
  private DocTypeRepository docTypeRepository;

  @Mock
  private TagRepository tagRepository;

  @Mock
  private DocumentRepository documentRepository;

  @Mock
  private DocumentTagLinkRepository documentTagLinkRepository;

  @Mock
  private DocumentRedemptionRepository documentRedemptionRepository;

  @Mock
  private DocumentReadHistoryRepository documentReadHistoryRepository;

  @Mock
  private FileStorageService fileStorageService;

  @Mock
  private DocumentThumbnailService documentThumbnailService;

  @Mock
  private DocumentMapper documentMapper;

  @Mock
  private DocumentAccessService documentAccessService;

  @Mock
  private com.capstone.be.repository.OrgEnrollmentRepository orgEnrollmentRepository;

  @Mock
  private com.capstone.be.repository.ReviewRequestRepository reviewRequestRepository;

  @InjectMocks
  private DocumentServiceImpl documentService;

  private User uploader;
  private Document document;
  private DocType docType;
  private Specialization specialization;
  private UUID uploaderId;
  private UUID documentId;
  private MultipartFile pdfFile;

  @BeforeEach
  void setUp() {
    uploaderId = UUID.randomUUID();
    documentId = UUID.randomUUID();

    uploader = User.builder()
        .id(uploaderId)
        .email("uploader@example.com")
        .fullName("Test Uploader")
        .build();

    docType = DocType.builder()
        .id(UUID.randomUUID())
        .name("Research Paper")
        .build();

    com.capstone.be.domain.entity.Domain domain = com.capstone.be.domain.entity.Domain.builder()
        .id(UUID.randomUUID())
        .name("Technology")
        .build();

    specialization = Specialization.builder()
        .id(UUID.randomUUID())
        .name("Computer Science")
        .domain(domain)
        .build();

    document = Document.builder()
        .id(documentId)
        .title("Test Document")
        .description("Test Description")
        .uploader(uploader)
        .docType(docType)
        .specialization(specialization)
        .visibility(DocVisibility.PUBLIC)
        .status(DocStatus.ACTIVE)
        .isPremium(false)
        .fileKey("file-key")
        .viewCount(0)
        .upvoteCount(0)
        .voteScore(0)
        .build();

    pdfFile = new MockMultipartFile("file", "test.pdf", "application/pdf", "pdf content".getBytes());
  }

  // test uploadDocument should upload document successfully
  @Test
  @DisplayName("uploadDocument should upload document successfully")
  void uploadDocument_ShouldUploadDocument() {
    UploadDocumentInfoRequest request = UploadDocumentInfoRequest.builder()
        .title("Test Document")
        .description("Test Description")
        .docTypeId(docType.getId())
        .specializationId(specialization.getId())
        .build();

    DocumentUploadResponse response = DocumentUploadResponse.builder()
        .id(documentId)
        .title("Test Document")
        .build();

    when(userRepository.findById(uploaderId)).thenReturn(Optional.of(uploader));
    when(docTypeRepository.findById(docType.getId())).thenReturn(Optional.of(docType));
    when(specializationRepository.findById(specialization.getId()))
        .thenReturn(Optional.of(specialization));
    when(fileStorageService.uploadFile(pdfFile, FileStorage.DOCUMENT_FOLDER, null))
        .thenReturn("file-key");
    when(documentThumbnailService.generateAndUploadThumbnail(
        pdfFile, FileStorage.DOCUMENT_THUMB_FOLDER)).thenReturn("thumbnail-key");
    when(documentRepository.save(any(Document.class))).thenReturn(document);
    when(documentMapper.toUploadResponse(any(Document.class), any(Set.class))).thenReturn(response);

    DocumentUploadResponse result = documentService.uploadDocument(uploaderId, request, pdfFile);

    assertNotNull(result);
    verify(documentRepository, times(1)).save(any(Document.class));
  }

  // test uploadDocument should throw exception when file is null
  @Test
  @DisplayName("uploadDocument should throw exception when file is null")
  void uploadDocument_ShouldThrowException_WhenFileIsNull() {
    UploadDocumentInfoRequest request = UploadDocumentInfoRequest.builder()
        .title("Test Document")
        .build();

    assertThrows(BusinessException.class,
        () -> documentService.uploadDocument(uploaderId, request, null));
    verify(documentRepository, never()).save(any());
  }

  // test uploadDocument should throw exception when file is not PDF
  @Test
  @DisplayName("uploadDocument should throw exception when file is not PDF")
  void uploadDocument_ShouldThrowException_WhenFileIsNotPdf() {
    MultipartFile txtFile = new MockMultipartFile("file", "test.txt", "text/plain", "content".getBytes());
    UploadDocumentInfoRequest request = UploadDocumentInfoRequest.builder()
        .title("Test Document")
        .build();

    assertThrows(BusinessException.class,
        () -> documentService.uploadDocument(uploaderId, request, txtFile));
    verify(documentRepository, never()).save(any());
  }

  // test redeemDocument should redeem document successfully
  @Test
  @DisplayName("redeemDocument should redeem document successfully")
  void redeemDocument_ShouldRedeemDocument() {
    UUID readerId = UUID.randomUUID();
    ReaderProfile reader = ReaderProfile.builder()
        .id(UUID.randomUUID())
        .user(User.builder().id(readerId).build())
        .point(200)
        .build();

    document.setIsPremium(true);
    document.setPrice(100);

    when(readerProfileRepository.findByUserId(readerId)).thenReturn(Optional.of(reader));
    when(documentRepository.findById(documentId)).thenReturn(Optional.of(document));
    when(documentRedemptionRepository.existsByReader_IdAndDocument_Id(reader.getId(), documentId))
        .thenReturn(false);
    when(documentRedemptionRepository.save(any(DocumentRedemption.class)))
        .thenReturn(DocumentRedemption.builder().build());
    when(readerProfileRepository.save(any(ReaderProfile.class))).thenReturn(reader);

    documentService.redeemDocument(readerId, documentId);

    verify(documentRedemptionRepository, times(1)).save(any(DocumentRedemption.class));
    verify(readerProfileRepository, times(1)).save(any(ReaderProfile.class));
  }

  // test redeemDocument should throw exception when already redeemed
  @Test
  @DisplayName("redeemDocument should throw exception when already redeemed")
  void redeemDocument_ShouldThrowException_WhenAlreadyRedeemed() {
    UUID readerId = UUID.randomUUID();
    ReaderProfile reader = ReaderProfile.builder()
        .id(UUID.randomUUID())
        .user(User.builder().id(readerId).build())
        .point(200)
        .build();

    document.setIsPremium(true);
    document.setPrice(100);

    when(readerProfileRepository.findByUserId(readerId)).thenReturn(Optional.of(reader));
    when(documentRepository.findById(documentId)).thenReturn(Optional.of(document));
    when(documentRedemptionRepository.existsByReader_IdAndDocument_Id(reader.getId(), documentId))
        .thenReturn(true);

    assertThrows(BusinessException.class,
        () -> documentService.redeemDocument(readerId, documentId));
    verify(documentRedemptionRepository, never()).save(any());
  }

  // test redeemDocument should throw exception when insufficient points
  @Test
  @DisplayName("redeemDocument should throw exception when insufficient points")
  void redeemDocument_ShouldThrowException_WhenInsufficientPoints() {
    UUID readerId = UUID.randomUUID();
    ReaderProfile reader = ReaderProfile.builder()
        .id(UUID.randomUUID())
        .user(User.builder().id(readerId).build())
        .point(50)
        .build();

    document.setIsPremium(true);
    document.setPrice(100);

    when(readerProfileRepository.findByUserId(readerId)).thenReturn(Optional.of(reader));
    when(documentRepository.findById(documentId)).thenReturn(Optional.of(document));
    when(documentRedemptionRepository.existsByReader_IdAndDocument_Id(reader.getId(), documentId))
        .thenReturn(false);

    assertThrows(BusinessException.class,
        () -> documentService.redeemDocument(readerId, documentId));
    verify(documentRedemptionRepository, never()).save(any());
  }

  // test getDocumentDetail should return document detail
  @Test
  @DisplayName("getDocumentDetail should return document detail")
  void getDocumentDetail_ShouldReturnDetail() {
    DocumentDetailResponse response = DocumentDetailResponse.builder()
        .id(documentId)
        .title("Test Document")
        .build();

    when(documentRepository.findById(documentId)).thenReturn(Optional.of(document));
    lenient().when(documentTagLinkRepository.findByDocument(any(Document.class))).thenReturn(Arrays.asList());
    when(documentAccessService.hasAccess(uploaderId, documentId)).thenReturn(true);
    lenient().when(documentMapper.toDetailResponse(any(Document.class))).thenReturn(response);
    lenient().when(userRepository.findById(uploaderId)).thenReturn(Optional.of(uploader));
    lenient().when(documentRedemptionRepository.existsByReader_IdAndDocument_Id(uploaderId, documentId))
        .thenReturn(false);
    lenient().when(orgEnrollmentRepository.findByOrganizationAndMember(any(), any()))
        .thenReturn(Optional.empty());
    lenient().when(reviewRequestRepository.findByDocument_IdAndReviewer_Id(any(), any()))
        .thenReturn(Optional.empty());
    org.springframework.test.util.ReflectionTestUtils.setField(documentService, "presignedUrlExpirationMinutes", 60);

    DocumentDetailResponse result = documentService.getDocumentDetail(uploaderId, documentId);

    assertNotNull(result);
    assertEquals(documentId, result.getId());
    verify(documentRepository, times(1)).findById(documentId);
  }

  // test getDocumentPresignedUrl should return presigned URL
  @Test
  @DisplayName("getDocumentPresignedUrl should return presigned URL")
  void getDocumentPresignedUrl_ShouldReturnUrl() {
    String presignedUrl = "https://s3.amazonaws.com/presigned-url";
    DocumentPresignedUrlResponse response = DocumentPresignedUrlResponse.builder()
        .presignedUrl(presignedUrl)
        .expiresInMinutes(60)
        .build();

    when(documentRepository.findById(documentId)).thenReturn(Optional.of(document));
    when(documentAccessService.hasAccess(uploaderId, documentId)).thenReturn(true);
    when(userRepository.findById(uploaderId)).thenReturn(Optional.of(uploader));
    when(documentReadHistoryRepository.findByUser_IdAndDocument_Id(uploaderId, documentId))
        .thenReturn(Arrays.asList());
    when(fileStorageService.generatePresignedUrl(FileStorage.DOCUMENT_FOLDER, document.getFileKey(), 60))
        .thenReturn(presignedUrl);
    when(documentReadHistoryRepository.save(any(DocumentReadHistory.class)))
        .thenReturn(DocumentReadHistory.builder()
            .user(uploader)
            .document(document)
            .build());
    org.springframework.test.util.ReflectionTestUtils.setField(documentService, "presignedUrlExpirationMinutes", 60);

    DocumentPresignedUrlResponse result =
        documentService.getDocumentPresignedUrl(uploaderId, documentId);

    assertNotNull(result);
    assertEquals(presignedUrl, result.getPresignedUrl());
  }

  // test getDocumentPresignedUrl should throw exception when no access
  @Test
  @DisplayName("getDocumentPresignedUrl should throw exception when no access")
  void getDocumentPresignedUrl_ShouldThrowException_WhenNoAccess() {
    UUID userId = UUID.randomUUID();
    when(documentRepository.findById(documentId)).thenReturn(Optional.of(document));
    when(documentAccessService.hasAccess(userId, documentId)).thenReturn(false);

    assertThrows(ForbiddenException.class,
        () -> documentService.getDocumentPresignedUrl(userId, documentId));
    verify(fileStorageService, never()).generatePresignedUrl(any(), any(), anyInt());
  }

  // test updateDocument should update document successfully
  @Test
  @DisplayName("updateDocument should update document successfully")
  void updateDocument_ShouldUpdateDocument() {
    UpdateDocumentRequest request = UpdateDocumentRequest.builder()
        .title("Updated Title")
        .description("Updated Description")
        .docTypeId(docType.getId())
        .specializationId(specialization.getId())
        .visibility(DocVisibility.PUBLIC)
        .isPremium(false)
        .build();

    DocumentUploadResponse response = DocumentUploadResponse.builder()
        .id(documentId)
        .title("Updated Title")
        .build();

    when(documentRepository.findById(documentId)).thenReturn(Optional.of(document));
    when(userRepository.findById(uploaderId)).thenReturn(Optional.of(uploader));
    lenient().when(docTypeRepository.findById(docType.getId())).thenReturn(Optional.of(docType));
    lenient().when(specializationRepository.findById(specialization.getId()))
        .thenReturn(Optional.of(specialization));
    lenient().when(tagRepository.findAllByStatusAndCodeIn(any(), any())).thenReturn(new HashSet<>());
    lenient().when(tagRepository.findAllByNormalizedNameIn(any())).thenReturn(new HashSet<>());
    when(documentRepository.save(any(Document.class))).thenReturn(document);
    when(documentMapper.toUploadResponse(any(Document.class), any(Set.class))).thenReturn(response);
    
    DocumentUploadResponse result = documentService.updateDocument(uploaderId, documentId, request);

    assertNotNull(result);
    verify(documentRepository, times(1)).save(any(Document.class));
    verify(documentTagLinkRepository, times(1)).deleteAllByDocumentId(documentId);
  }

  // test updateDocument should throw exception when not uploader
  @Test
  @DisplayName("updateDocument should throw exception when not uploader")
  void updateDocument_ShouldThrowException_WhenNotUploader() {
    UUID otherUserId = UUID.randomUUID();
    UpdateDocumentRequest request = UpdateDocumentRequest.builder()
        .title("Updated Title")
        .build();

    when(documentRepository.findById(documentId)).thenReturn(Optional.of(document));

    assertThrows(ForbiddenException.class,
        () -> documentService.updateDocument(otherUserId, documentId, request));
    verify(documentRepository, never()).save(any());
  }

  // test deleteDocument should delete document successfully
  @Test
  @DisplayName("deleteDocument should delete document successfully")
  void deleteDocument_ShouldDeleteDocument() {
    when(documentRepository.findById(documentId)).thenReturn(Optional.of(document));
    when(documentRepository.save(any(Document.class))).thenReturn(document);

    documentService.deleteDocument(uploaderId, documentId);

    verify(documentRepository, times(1)).save(any(Document.class));
  }

  // test getUploadHistory should return upload history
  @Test
  @DisplayName("getUploadHistory should return upload history")
  void getUploadHistory_ShouldReturnHistory() {
    Pageable pageable = PageRequest.of(0, 10);
    Page<Document> documentPage = new PageImpl<>(Arrays.asList(document), pageable, 1);
    DocumentUploadHistoryFilter filter = DocumentUploadHistoryFilter.builder().build();

    when(userRepository.existsById(uploaderId)).thenReturn(true);
    when(documentRepository.findAll(isA(Specification.class), eq(pageable)))
        .thenReturn(documentPage);

    Page<com.capstone.be.dto.response.document.DocumentUploadHistoryResponse> result =
        documentService.getUploadHistory(uploaderId, filter, pageable);

    assertEquals(1, result.getTotalElements());
    verify(documentRepository, times(1))
        .findAll(isA(Specification.class), eq(pageable));
  }

  // test getLibrary should return library
  @Test
  @DisplayName("getLibrary should return library")
  void getLibrary_ShouldReturnLibrary() {
    Pageable pageable = PageRequest.of(0, 10);
    Page<Document> documentPage = new PageImpl<>(Arrays.asList(document), pageable, 1);
    DocumentLibraryFilter filter = DocumentLibraryFilter.builder().build();

    when(userRepository.existsById(uploaderId)).thenReturn(true);
    when(documentRepository.findAll(isA(Specification.class), eq(pageable)))
        .thenReturn(documentPage);
    when(documentMapper.toLibraryResponse(any(Document.class))).thenReturn(DocumentLibraryResponse.builder()
        .id(documentId)
        .build());
    when(documentTagLinkRepository.findByDocument(any(Document.class))).thenReturn(Arrays.asList());
    when(documentRedemptionRepository.findByReader_IdAndDocument_Id(uploaderId, documentId))
        .thenReturn(Optional.empty());

    Page<DocumentLibraryResponse> result = documentService.getLibrary(uploaderId, filter, pageable);

    assertEquals(1, result.getTotalElements());
    verify(documentRepository, times(1))
        .findAll(isA(Specification.class), eq(pageable));
  }

  // test getReadHistory should return read history
  @Test
  @DisplayName("getReadHistory should return read history")
  void getReadHistory_ShouldReturnHistory() {
    Pageable pageable = PageRequest.of(0, 10);
    DocumentReadHistory readHistory = DocumentReadHistory.builder()
        .id(UUID.randomUUID())
        .user(uploader)
        .document(document)
        .build();
    Page<DocumentReadHistory> historyPage = new PageImpl<>(Arrays.asList(readHistory), pageable, 1);

    when(userRepository.existsById(uploaderId)).thenReturn(true);
    when(documentReadHistoryRepository.findByUser_Id(uploaderId, pageable))
        .thenReturn(historyPage);

    Page<DocumentReadHistoryResponse> result = documentService.getReadHistory(uploaderId, pageable);

    assertEquals(1, result.getTotalElements());
    verify(documentReadHistoryRepository, times(1)).findByUser_Id(uploaderId, pageable);
  }

  // test searchPublicDocuments should return search results
  @Test
  @DisplayName("searchPublicDocuments should return search results")
  void searchPublicDocuments_ShouldReturnResults() {
    Pageable pageable = PageRequest.of(0, 10);
    Page<Document> documentPage = new PageImpl<>(Arrays.asList(document), pageable, 1);
    DocumentSearchFilter filter = DocumentSearchFilter.builder().build();

    when(documentRepository.findAll(isA(Specification.class), eq(pageable)))
        .thenReturn(documentPage);
    when(documentTagLinkRepository.findByDocument_Id(any(UUID.class))).thenReturn(Arrays.asList());

    Page<DocumentSearchResponse> result =
        documentService.searchPublicDocuments(filter, pageable);

    assertEquals(1, result.getTotalElements());
    verify(documentRepository, times(1))
        .findAll(isA(Specification.class), eq(pageable));
  }

  // test activateDocument should activate document
  @Test
  @DisplayName("activateDocument should activate document")
  void activateDocument_ShouldActivateDocument() {
    document.setStatus(DocStatus.INACTIVE);
    when(documentRepository.findById(documentId)).thenReturn(Optional.of(document));
    when(documentRepository.save(any(Document.class))).thenReturn(document);

    documentService.activateDocument(documentId);

    assertEquals(DocStatus.ACTIVE, document.getStatus());
    verify(documentRepository, times(1)).save(any(Document.class));
  }

  // test deactivateDocument should deactivate document
  @Test
  @DisplayName("deactivateDocument should deactivate document")
  void deactivateDocument_ShouldDeactivateDocument() {
    when(documentRepository.findById(documentId)).thenReturn(Optional.of(document));
    when(documentRepository.save(any(Document.class))).thenReturn(document);

    documentService.deactivateDocument(documentId);

    assertEquals(DocStatus.INACTIVE, document.getStatus());
    verify(documentRepository, times(1)).save(any(Document.class));
  }
}

