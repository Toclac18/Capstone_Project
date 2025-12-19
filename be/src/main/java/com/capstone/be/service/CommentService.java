package com.capstone.be.service;

import com.capstone.be.dto.common.PagedResponse;
import com.capstone.be.dto.request.comment.CreateCommentRequest;
import com.capstone.be.dto.request.comment.UpdateCommentRequest;
import com.capstone.be.dto.response.comment.CommentResponse;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface CommentService {

    CommentResponse createComment(CreateCommentRequest request, UUID userId);

    CommentResponse updateComment(UUID commentId, UpdateCommentRequest request, UUID userId);

    void deleteComment(UUID commentId, UUID userId);

    PagedResponse<CommentResponse> getCommentsByDocument(UUID documentId, Pageable pageable);

    CommentResponse getCommentById(UUID commentId);
}
