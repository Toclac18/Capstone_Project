package com.capstone.be.repository;

import com.capstone.be.domain.entity.ReviewerSpecLink;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReviewerSpecLinkRepository extends JpaRepository<ReviewerSpecLink, UUID> {

  void deleteAllByReviewerId(UUID reviewerId);
}
