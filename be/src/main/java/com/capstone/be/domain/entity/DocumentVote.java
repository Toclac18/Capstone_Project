package com.capstone.be.domain.entity;

import com.capstone.be.domain.entity.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

/**
 * Document vote entity - tracks user votes on documents
 * Vote value: -1 (downvote), 0 (neutral/removed), 1 (upvote)
 */
@Entity
@Table(name = "document_votes",
       uniqueConstraints = @UniqueConstraint(columnNames = {"document_id", "user_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class DocumentVote extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * Vote value: -1 (downvote), 0 (neutral/removed), 1 (upvote)
     */
    @Column(nullable = false)
    private Integer voteValue;
}
