package com.capstone.be.dto.request.document;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoteDocumentRequest {

    /**
     * Vote value: -1 (downvote), 0 (neutral/remove vote), 1 (upvote)
     */
    @NotNull(message = "Vote value is required")
    @Min(value = -1, message = "Vote value must be -1, 0, or 1")
    @Max(value = 1, message = "Vote value must be -1, 0, or 1")
    private Integer voteValue;
}
