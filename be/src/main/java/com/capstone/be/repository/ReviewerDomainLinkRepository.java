package com.capstone.be.repository;

import com.capstone.be.domain.entity.ReviewerDomainLink;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReviewerDomainLinkRepository extends JpaRepository<ReviewerDomainLink, UUID> {

  void deleteAllByReviewerId(UUID reviewerId);
}
