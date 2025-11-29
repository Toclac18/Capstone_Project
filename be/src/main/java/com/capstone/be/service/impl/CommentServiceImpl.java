package com.capstone.be.service.impl;

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
import com.capstone.be.service.CommentService;
import com.capstone.be.service.DocumentAccessService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CommentServiceImpl implements CommentService {

    private final DocumentAccessService documentAccessService;

    private final CommentRepository commentRepository;
    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final CommentMapper commentMapper;

    @Override
    @Transactional
    public CommentResponse createComment(CreateCommentRequest request, UUID userId) {
        log.info("Creating comment for document {} by user {}", request.getDocumentId(), userId);

        // Validate document exists
        Document document = documentRepository.findById(request.getDocumentId())
                .orElseThrow(() -> ResourceNotFoundException.document(request.getDocumentId()));

        // Validate user exists
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ResourceNotFoundException.user(userId));

        //Validate user's permission to leave a comment
        if (!documentAccessService.hasAccess(user.getId(), document.getId())){
            throw UnauthorizedException.unauthorized();
        }

        // Create comment
        Comment comment = Comment.builder()
                .document(document)
                .user(user)
                .content(request.getContent().trim())
                .isDeleted(false)
                .build();

        Comment savedComment = commentRepository.save(comment);
        log.info("Comment created successfully with id: {}", savedComment.getId());

        return commentMapper.toResponse(savedComment);
    }

    @Override
    @Transactional
    public CommentResponse updateComment(UUID commentId, UpdateCommentRequest request, UUID userId) {
        log.info("Updating comment {} by user {}", commentId, userId);

        // Find comment
        Comment comment = commentRepository.findByIdAndNotDeleted(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment", commentId));

        // Check ownership
        if (!comment.getUser().getId().equals(userId)) {
            throw ForbiddenException.insufficientPermission("update this comment");
        }

        // Update content
        comment.setContent(request.getContent().trim());
        Comment updatedComment = commentRepository.save(comment);

        log.info("Comment updated successfully: {}", commentId);
        return commentMapper.toResponse(updatedComment);
    }

    @Override
    @Transactional
    public void deleteComment(UUID commentId, UUID userId) {
        log.info("Deleting comment {} by user {}", commentId, userId);

        // Find comment
        Comment comment = commentRepository.findByIdAndNotDeleted(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment", commentId));

        // Check ownership
        if (!comment.getUser().getId().equals(userId)) {
            throw ForbiddenException.insufficientPermission("delete this comment");
        }

        // Soft delete
        comment.setIsDeleted(true);
        commentRepository.save(comment);

        log.info("Comment deleted successfully: {}", commentId);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<CommentResponse> getCommentsByDocument(UUID documentId, Pageable pageable) {
        log.info("Fetching comments for document: {}", documentId);

        // Validate document exists
        if (!documentRepository.existsById(documentId)) {
            throw ResourceNotFoundException.document(documentId);
        }

        // Fetch comments
        Page<Comment> commentPage = commentRepository.findByDocumentIdAndNotDeleted(documentId, pageable);

        // Map to response
        Page<CommentResponse> responsePage = commentPage.map(commentMapper::toResponse);

        return PagedResponse.of(responsePage);
    }

    @Override
    @Transactional(readOnly = true)
    public CommentResponse getCommentById(UUID commentId) {
        log.info("Fetching comment by id: {}", commentId);

        Comment comment = commentRepository.findByIdAndNotDeleted(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment", commentId));

        return commentMapper.toResponse(comment);
    }
}
