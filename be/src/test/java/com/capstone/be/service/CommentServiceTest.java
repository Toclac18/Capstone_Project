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

import com.capstone.be.domain.entity.Comment;
import com.capstone.be.domain.entity.Document;
import com.capstone.be.domain.entity.User;
import com.capstone.be.dto.common.PagedResponse;
import com.capstone.be.dto.request.comment.CreateCommentRequest;
import com.capstone.be.dto.request.comment.UpdateCommentRequest;
import com.capstone.be.dto.response.comment.CommentResponse;
import com.capstone.be.exception.ForbiddenException;
import com.capstone.be.exception.ResourceNotFoundException;
import com.capstone.be.exception.UnauthorizedException;
import com.capstone.be.mapper.CommentMapper;
import com.capstone.be.repository.CommentRepository;
import com.capstone.be.repository.DocumentRepository;
import com.capstone.be.repository.UserRepository;
import com.capstone.be.service.DocumentAccessService;
import com.capstone.be.service.impl.CommentServiceImpl;
import java.time.Instant;
import java.util.Arrays;
import java.util.Optional;
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

@ExtendWith(MockitoExtension.class)
@DisplayName("CommentService Unit Tests")
class CommentServiceTest {

  @Mock
  private CommentRepository commentRepository;

  @Mock
  private DocumentRepository documentRepository;

  @Mock
  private UserRepository userRepository;

  @Mock
  private CommentMapper commentMapper;

  @Mock
  private DocumentAccessService documentAccessService;

  @InjectMocks
  private CommentServiceImpl commentService;

  private User user;
  private Document document;
  private Comment comment;
  private UUID userId;
  private UUID documentId;
  private UUID commentId;

  @BeforeEach
  void setUp() {
    userId = UUID.randomUUID();
    documentId = UUID.randomUUID();
    commentId = UUID.randomUUID();

    user = User.builder()
        .id(userId)
        .email("user@example.com")
        .fullName("Test User")
        .build();

    document = Document.builder()
        .id(documentId)
        .title("Test Document")
        .build();

    comment = Comment.builder()
        .id(commentId)
        .user(user)
        .document(document)
        .content("Test comment")
        .isDeleted(false)
        .createdAt(Instant.now())
        .updatedAt(Instant.now())
        .build();
  }

  // test createComment should create comment successfully
  @Test
  @DisplayName("createComment should create comment successfully")
  void createComment_ShouldCreateComment() {
    CreateCommentRequest request = CreateCommentRequest.builder()
        .documentId(documentId)
        .content("New comment")
        .build();

    Comment newComment = Comment.builder()
        .id(commentId)
        .user(user)
        .document(document)
        .content("New comment")
        .isDeleted(false)
        .build();

    CommentResponse response = CommentResponse.builder()
        .id(commentId)
        .content("New comment")
        .build();

    when(documentRepository.findById(documentId)).thenReturn(Optional.of(document));
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(documentAccessService.hasAccess(userId, documentId)).thenReturn(true);
    when(commentRepository.save(any(Comment.class))).thenReturn(newComment);
    when(commentMapper.toResponse(newComment)).thenReturn(response);

    CommentResponse result = commentService.createComment(request, userId);

    assertNotNull(result);
    assertEquals("New comment", result.getContent());
    verify(commentRepository, times(1)).save(any(Comment.class));
  }

  // test createComment should throw exception when document not found
  @Test
  @DisplayName("createComment should throw exception when document not found")
  void createComment_ShouldThrowException_WhenDocumentNotFound() {
    CreateCommentRequest request = CreateCommentRequest.builder()
        .documentId(documentId)
        .content("New comment")
        .build();

    when(documentRepository.findById(documentId)).thenReturn(Optional.empty());

    assertThrows(ResourceNotFoundException.class,
        () -> commentService.createComment(request, userId));
    verify(commentRepository, never()).save(any());
  }

  // test createComment should throw exception when user not found
  @Test
  @DisplayName("createComment should throw exception when user not found")
  void createComment_ShouldThrowException_WhenUserNotFound() {
    CreateCommentRequest request = CreateCommentRequest.builder()
        .documentId(documentId)
        .content("New comment")
        .build();

    when(documentRepository.findById(documentId)).thenReturn(Optional.of(document));
    when(userRepository.findById(userId)).thenReturn(Optional.empty());

    assertThrows(ResourceNotFoundException.class,
        () -> commentService.createComment(request, userId));
    verify(commentRepository, never()).save(any());
  }

  // test createComment should throw exception when no access
  @Test
  @DisplayName("createComment should throw exception when no access")
  void createComment_ShouldThrowException_WhenNoAccess() {
    CreateCommentRequest request = CreateCommentRequest.builder()
        .documentId(documentId)
        .content("New comment")
        .build();

    when(documentRepository.findById(documentId)).thenReturn(Optional.of(document));
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(documentAccessService.hasAccess(userId, documentId)).thenReturn(false);

    assertThrows(UnauthorizedException.class,
        () -> commentService.createComment(request, userId));
    verify(commentRepository, never()).save(any());
  }

  // test updateComment should update comment successfully
  @Test
  @DisplayName("updateComment should update comment successfully")
  void updateComment_ShouldUpdateComment() {
    UpdateCommentRequest request = UpdateCommentRequest.builder()
        .content("Updated comment")
        .build();

    Comment updatedComment = Comment.builder()
        .id(commentId)
        .user(user)
        .document(document)
        .content("Updated comment")
        .isDeleted(false)
        .build();

    CommentResponse response = CommentResponse.builder()
        .id(commentId)
        .content("Updated comment")
        .build();

    when(commentRepository.findByIdAndNotDeleted(commentId)).thenReturn(Optional.of(comment));
    when(commentRepository.save(any(Comment.class))).thenReturn(updatedComment);
    when(commentMapper.toResponse(updatedComment)).thenReturn(response);

    CommentResponse result = commentService.updateComment(commentId, request, userId);

    assertEquals("Updated comment", result.getContent());
    verify(commentRepository, times(1)).save(any(Comment.class));
  }

  // test updateComment should throw exception when comment not found
  @Test
  @DisplayName("updateComment should throw exception when comment not found")
  void updateComment_ShouldThrowException_WhenCommentNotFound() {
    UpdateCommentRequest request = UpdateCommentRequest.builder()
        .content("Updated comment")
        .build();

    when(commentRepository.findByIdAndNotDeleted(commentId)).thenReturn(Optional.empty());

    assertThrows(ResourceNotFoundException.class,
        () -> commentService.updateComment(commentId, request, userId));
    verify(commentRepository, never()).save(any());
  }

  // test updateComment should throw exception when not owner
  @Test
  @DisplayName("updateComment should throw exception when not owner")
  void updateComment_ShouldThrowException_WhenNotOwner() {
    UUID otherUserId = UUID.randomUUID();
    UpdateCommentRequest request = UpdateCommentRequest.builder()
        .content("Updated comment")
        .build();

    when(commentRepository.findByIdAndNotDeleted(commentId)).thenReturn(Optional.of(comment));

    assertThrows(ForbiddenException.class,
        () -> commentService.updateComment(commentId, request, otherUserId));
    verify(commentRepository, never()).save(any());
  }

  // test deleteComment should delete comment successfully
  @Test
  @DisplayName("deleteComment should delete comment successfully")
  void deleteComment_ShouldDeleteComment() {
    when(commentRepository.findByIdAndNotDeleted(commentId)).thenReturn(Optional.of(comment));

    commentService.deleteComment(commentId, userId);

    verify(commentRepository, times(1)).save(any(Comment.class));
  }

  // test deleteComment should throw exception when not owner
  @Test
  @DisplayName("deleteComment should throw exception when not owner")
  void deleteComment_ShouldThrowException_WhenNotOwner() {
    UUID otherUserId = UUID.randomUUID();
    when(commentRepository.findByIdAndNotDeleted(commentId)).thenReturn(Optional.of(comment));

    assertThrows(ForbiddenException.class,
        () -> commentService.deleteComment(commentId, otherUserId));
    verify(commentRepository, never()).save(any());
  }

  // test getCommentsByDocument should return paginated comments
  @Test
  @DisplayName("getCommentsByDocument should return paginated comments")
  void getCommentsByDocument_ShouldReturnPaginatedComments() {
    Pageable pageable = PageRequest.of(0, 10);
    Page<Comment> commentPage = new PageImpl<>(Arrays.asList(comment), pageable, 1);

    CommentResponse response = CommentResponse.builder()
        .id(commentId)
        .content("Test comment")
        .build();

    when(documentRepository.existsById(documentId)).thenReturn(true);
    when(commentRepository.findByDocumentIdAndNotDeleted(documentId, pageable))
        .thenReturn(commentPage);
    when(commentMapper.toResponse(comment)).thenReturn(response);

    PagedResponse<CommentResponse> result = commentService.getCommentsByDocument(documentId, pageable);

    assertNotNull(result);
    assertEquals(1, result.getData().size());
    verify(commentRepository, times(1))
        .findByDocumentIdAndNotDeleted(eq(documentId), any(Pageable.class));
  }

  // test getCommentById should return comment
  @Test
  @DisplayName("getCommentById should return comment")
  void getCommentById_ShouldReturnComment() {
    CommentResponse response = CommentResponse.builder()
        .id(commentId)
        .content("Test comment")
        .build();

    when(commentRepository.findByIdAndNotDeleted(commentId)).thenReturn(Optional.of(comment));
    when(commentMapper.toResponse(comment)).thenReturn(response);

    CommentResponse result = commentService.getCommentById(commentId);

    assertNotNull(result);
    assertEquals(commentId, result.getId());
    verify(commentRepository, times(1)).findByIdAndNotDeleted(commentId);
  }

  // test getCommentById should throw exception when not found
  @Test
  @DisplayName("getCommentById should throw exception when not found")
  void getCommentById_ShouldThrowException_WhenNotFound() {
    when(commentRepository.findByIdAndNotDeleted(commentId)).thenReturn(Optional.empty());

    assertThrows(ResourceNotFoundException.class,
        () -> commentService.getCommentById(commentId));
    verify(commentMapper, never()).toResponse(any());
  }
}

