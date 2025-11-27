package com.capstone.be.repository.specification;

import com.capstone.be.domain.entity.Comment;
import org.springframework.data.jpa.domain.Specification;

import java.util.UUID;

public class CommentSpecification {

    public static Specification<Comment> belongsToDocument(UUID documentId) {
        return (root, query, criteriaBuilder) -> {
            if (documentId == null) return null;
            return criteriaBuilder.equal(root.get("document").get("id"), documentId);
        };
    }

    public static Specification<Comment> isNotDeleted() {
        return (root, query, criteriaBuilder) ->
                criteriaBuilder.equal(root.get("isDeleted"), false);
    }

    public static Specification<Comment> belongsToUser(UUID userId) {
        return (root, query, criteriaBuilder) -> {
            if (userId == null) return null;
            return criteriaBuilder.equal(root.get("user").get("id"), userId);
        };
    }

    public static Specification<Comment> withFilters(UUID documentId, UUID userId) {
        return Specification
                .where(isNotDeleted())
                .and(belongsToDocument(documentId))
                .and(belongsToUser(userId));
    }
}
