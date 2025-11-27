package com.capstone.be.controller;

import com.capstone.be.dto.common.ApiResponse;
import com.capstone.be.dto.common.PagedResponse;
import com.capstone.be.dto.request.comment.CreateCommentRequest;
import com.capstone.be.dto.request.comment.UpdateCommentRequest;
import com.capstone.be.dto.response.comment.CommentResponse;
import com.capstone.be.security.model.UserPrincipal;
import com.capstone.be.service.CommentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Controller for comment operations on documents
 */
@Slf4j
@RestController
@RequestMapping("/comments")
@RequiredArgsConstructor
@Tag(name = "Comments", description = "APIs for document comments management")
public class CommentController {

    private final CommentService commentService;

    /**
     * Create a comment on a document
     * POST /api/comments
     *
     * @param request   Comment creation request
     * @param principal Current authenticated user
     * @return Created comment response
     */
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Create a comment", description = "Add a comment to a document")
    public ResponseEntity<CommentResponse> createComment(
            @Valid @RequestBody CreateCommentRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {

        UUID userId = principal.getId();
        log.info("User {} creating comment on document {}", userId, request.getDocumentId());

        CommentResponse response = commentService.createComment(request, userId);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Update a comment
     * PUT /api/comments/{commentId}
     *
     * @param commentId Comment ID
     * @param request   Comment update request
     * @param principal Current authenticated user
     * @return Updated comment response
     */
    @PutMapping("/{commentId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Update a comment", description = "Update content of an existing comment (only owner)")
    public ResponseEntity<CommentResponse> updateComment(
            @PathVariable(name = "commentId") UUID commentId,
            @Valid @RequestBody UpdateCommentRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {

        UUID userId = principal.getId();
        log.info("User {} updating comment {}", userId, commentId);

        CommentResponse response = commentService.updateComment(commentId, request, userId);

        return ResponseEntity.ok(response);
    }

    /**
     * Delete a comment
     * DELETE /api/comments/{commentId}
     *
     * @param commentId Comment ID
     * @param principal Current authenticated user
     * @return No content
     */
    @DeleteMapping("/{commentId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Delete a comment (only owner)", description = "Delete a comment ")
    public ResponseEntity<ApiResponse<Void>> deleteComment(
            @PathVariable(name = "commentId") UUID commentId,
            @AuthenticationPrincipal UserPrincipal principal) {

        UUID userId = principal.getId();
        log.info("User {} deleting comment {}", userId, commentId);

        commentService.deleteComment(commentId, userId);

        return ResponseEntity.ok(ApiResponse.success("Comment deleted successfully"));
    }

    /**
     * Get comments for a document
     * GET /api/comments/document/{documentId}
     *
     * @param documentId Document ID
     * @param pageable   Pagination parameters
     * @return Page of comments
     */
    @GetMapping("/document/{documentId}")
    @Operation(summary = "Get comments by document",
               description = "Get all comments for a specific document with pagination")
    public ResponseEntity<PagedResponse<CommentResponse>> getCommentsByDocument(
            @PathVariable(name = "documentId") UUID documentId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        log.info("Fetching comments for document {}, page: {}, size: {}",
                 documentId, pageable.getPageNumber(), pageable.getPageSize());

        PagedResponse<CommentResponse> response = commentService.getCommentsByDocument(documentId, pageable);

        return ResponseEntity.ok(response);
    }

    /**
     * Get comment by ID
     * GET /api/comments/{commentId}
     *
     * @param commentId Comment ID
     * @return Comment details
     */
    @GetMapping("/{commentId}")
    @Operation(summary = "Get comment by ID", description = "Get a specific comment by its ID")
    public ResponseEntity<CommentResponse> getCommentById(
            @PathVariable(name = "commentId") UUID commentId) {

        log.info("Fetching comment by id: {}", commentId);

        CommentResponse response = commentService.getCommentById(commentId);

        return ResponseEntity.ok(response);
    }
}
