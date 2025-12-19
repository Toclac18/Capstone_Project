package com.capstone.be.service;

import com.capstone.be.dto.request.document.VoteDocumentRequest;
import com.capstone.be.dto.response.document.VoteDocumentResponse;

import java.util.UUID;

public interface DocumentVoteService {

    /**
     * Vote or update vote on a document
     * If vote already exists, it will be updated
     * If voteValue is 0, the vote will be removed
     *
     * @param request Vote request with documentId and voteValue (-1, 0, 1)
     * @param userId  User ID
     * @return Vote response with updated vote counts
     */
    VoteDocumentResponse voteDocument( UUID userId, UUID docId, VoteDocumentRequest request);

    /**
     * Get current user's vote for a document
     *
     * @param documentId Document ID
     * @param userId     User ID
     * @return Vote response with user's vote and document vote stats
     */
    VoteDocumentResponse getUserVote(UUID documentId, UUID userId);
}
