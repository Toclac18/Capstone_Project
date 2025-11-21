package com.capstone.be.repository;

import com.capstone.be.domain.entity.DocumentTagLink;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DocumentTagLinkRepository extends JpaRepository<DocumentTagLink, UUID> {

}
