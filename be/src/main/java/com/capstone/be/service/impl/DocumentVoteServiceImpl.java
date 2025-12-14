package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.Document;
import com.capstone.be.domain.entity.DocumentVote;
import com.capstone.be.domain.entity.User;
import com.capstone.be.dto.request.document.VoteDocumentRequest;
import com.capstone.be.dto.response.document.VoteDocumentResponse;
import com.capstone.be.exception.ResourceNotFoundException;
import com.capstone.be.repository.DocumentRepository;
import com.capstone.be.repository.DocumentVoteRepository;
import com.capstone.be.repository.UserRepository;
import com.capstone.be.service.DocumentVoteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentVoteServiceImpl implements DocumentVoteService {

    private final DocumentVoteRepository documentVoteRepository;
    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public VoteDocumentResponse voteDocument(UUID userId, UUID docId, VoteDocumentRequest request ) {
        log.info("User {} voting on document {} with value {}", userId, docId, request.getVoteValue());

        // Validate document exists
        Document document = documentRepository.findById(docId)
                .orElseThrow(() -> ResourceNotFoundException.document(docId));

        // Validate user exists
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ResourceNotFoundException.user(userId));

        // Find existing vote
        Optional<DocumentVote> existingVoteOpt = documentVoteRepository
                .findByDocumentIdAndUserId(docId, userId);

        Integer newValue = request.getVoteValue();
        int oldValue = existingVoteOpt.map(DocumentVote::getVoteValue).orElse(0);

        if (!existingVoteOpt.isPresent()){
            DocumentVote toSave = DocumentVote.builder()
                .voteValue(newValue)
                .document(document)
                .user(user)
                .build();
            documentVoteRepository.save(toSave);
        } else {
            //if present, update value
            existingVoteOpt.get().setVoteValue(newValue);
            documentVoteRepository.save(existingVoteOpt.get());
        }

        //Update vote count (in Document entity)

        document.setVoteScore(document.getVoteScore() + newValue - oldValue);
        if (oldValue < 1 && newValue==1) {
            document.setUpvoteCount(document.getUpvoteCount() + 1);
        } else if (oldValue == 1 && newValue < 1){
            document.setUpvoteCount(document.getUpvoteCount()  -1);
        }
        documentRepository.save(document);

        // Build response
        return buildVoteResponse(document, newValue);
    }

    @Override
    @Transactional(readOnly = true)
    public VoteDocumentResponse getUserVote(UUID documentId, UUID userId) {
        log.info("Fetching vote for user {} on document {}", userId, documentId);

        // Validate document exists
        Document doc = documentRepository.findById(documentId)
            .orElseThrow(()-> ResourceNotFoundException.document(documentId));

        // Get user's vote
        DocumentVote vote = documentVoteRepository.findByDocumentIdAndUserId(documentId, userId)
            .orElseThrow(()-> new ResourceNotFoundException(""));

        return buildVoteResponse(doc, vote.getVoteValue());
    }

    /**
     * Build vote response with current vote statistics
     */
    private VoteDocumentResponse buildVoteResponse(Document doc, int voteValue) {
        long upvotes = doc.getUpvoteCount();
        long voteScore = doc.getVoteScore();
        long downvotes = upvotes - voteScore;

        return VoteDocumentResponse.builder()
                .documentId(doc.getId())
                .userVote(voteValue)
                .upvoteCount((int) upvotes)
                .downvoteCount((int) downvotes)
                .voteScore((int) voteScore)
                .build();
    }
}
