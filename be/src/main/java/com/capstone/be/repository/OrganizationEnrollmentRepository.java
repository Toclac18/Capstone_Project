package com.capstone.be.repository;

import com.capstone.be.domain.entity.OrganizationEnrollment;
import com.capstone.be.domain.enums.ReaderStatus;
import com.capstone.be.dto.response.orgAdmin.ReaderResponse;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface OrganizationEnrollmentRepository
    extends JpaRepository<OrganizationEnrollment, UUID> {

  @Query("""
        SELECT e FROM OrganizationEnrollment e
        JOIN FETCH e.organization o
        WHERE e.reader.id = :readerId
        AND o.status = ACTIVE
      """)
  Page<OrganizationEnrollment> findJoinedOrganizationByReaderId(
      @Param("readerId") UUID readerId, Pageable pageable);

  @Query("""
      select oe.reader.id as id,
             oe.reader.fullName as fullName,
             oe.reader.email as email,
             oe.reader.avatarUrl as avatarUrl,
             oe.reader.status as status
      from OrganizationEnrollment oe
      where oe.organization.id = :orgId
        and (:status is null or oe.status = :status)
        and (:q is null or lower(oe.reader.fullName) like lower(concat('%', :q, '%')))
      """)
  Page<ReaderResponse> findMembersByOrganization(
      @Param("orgId") UUID orgId,
      @Param("status") ReaderStatus status,
      @Param("q") String q,
      Pageable pageable
  );

}
