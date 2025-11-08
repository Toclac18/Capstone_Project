package com.capstone.be.repository;

import com.capstone.be.domain.entity.Enrollment;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, UUID> {

  @Query("""
        SELECT e FROM Enrollment e
        JOIN FETCH e.organization o
        WHERE e.reader.id = :readerId
          AND o.deleted = false
          AND o.active = true
      """)
  Page<Enrollment> findJoinedOrganizationByReaderId(
      @Param("readerId") UUID readerId, Pageable pageable);
}
