package com.capstone.be.dto.response.document;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class VoteDocumentResponse {

    private UUID documentId;
    private Integer userVote;        // Current user's vote: -1, 0, or 1
    private Integer upvoteCount;     // Total upvotes
    private Integer downvoteCount;   // Total downvotes
    private Integer voteScore;       // upvoteCount - downvoteCount
}
