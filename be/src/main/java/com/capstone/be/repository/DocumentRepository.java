package com.capstone.be.repository;

import com.capstone.be.domain.entity.DocType;
import com.capstone.be.domain.entity.Document;
import com.capstone.be.domain.entity.Domain;
import com.capstone.be.domain.entity.OrganizationProfile;
import com.capstone.be.domain.entity.Specialization;
import com.capstone.be.domain.entity.Tag;
import com.capstone.be.domain.enums.DocStatus;
import com.capstone.be.domain.enums.DocVisibility;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface DocumentRepository extends JpaRepository<Document, UUID>,
    JpaSpecificationExecutor<Document> {

  long countByOrganizationId(UUID organizationId);

  Page<Document> findByUploader_Id(UUID uploaderId, Pageable pageable);

  Page<Document> findByStatusAndVisibility(
          DocStatus status,
          DocVisibility visibility,
          Pageable pageable
  );

  @Query("""
      select distinct d.organization
      from Document d
      where d.visibility = com.capstone.be.domain.enums.DocVisibility.PUBLIC
        and d.status = com.capstone.be.domain.enums.DocStatus.ACTIVE
        and d.organization is not null
      """)
  List<OrganizationProfile> findOrganizationsForPublicSearch();

  @Query("""
      select distinct s.domain
      from Document d
        join d.specialization s
      where d.visibility = com.capstone.be.domain.enums.DocVisibility.PUBLIC
        and d.status = com.capstone.be.domain.enums.DocStatus.ACTIVE
      """)
  List<Domain> findDomainsForPublicSearch();

  @Query("""
      select distinct s
      from Document d
        join d.specialization s
      where d.visibility = com.capstone.be.domain.enums.DocVisibility.PUBLIC
        and d.status = com.capstone.be.domain.enums.DocStatus.ACTIVE
      """)
  List<Specialization> findSpecializationsForPublicSearch();

  @Query("""
      select distinct d.docType
      from Document d
      where d.visibility = com.capstone.be.domain.enums.DocVisibility.PUBLIC
        and d.status = com.capstone.be.domain.enums.DocStatus.ACTIVE
        and d.docType is not null
      """)
  List<DocType> findDocTypesForPublicSearch();

  @Query("""
      select distinct l.tag
      from DocumentTagLink l
        join l.document d
      where d.visibility = com.capstone.be.domain.enums.DocVisibility.PUBLIC
        and d.status = com.capstone.be.domain.enums.DocStatus.ACTIVE
        and l.tag is not null
      """)
  List<Tag> findTagsForPublicSearch();

  @Query("""
    select distinct YEAR(d.createdAt) 
    from Document d 
    where d.visibility = com.capstone.be.domain.enums.DocVisibility.PUBLIC 
      and d.status = com.capstone.be.domain.enums.DocStatus.ACTIVE
    order by YEAR(d.createdAt) desc
    """)
  List<Integer> findYearsForPublicSearch();

  @Query("""
      select min(d.price)
      from Document d
      where d.visibility = com.capstone.be.domain.enums.DocVisibility.PUBLIC
        and d.status = com.capstone.be.domain.enums.DocStatus.ACTIVE
        and d.isPremium = true
      """)
  Integer findMinPremiumPriceForPublicSearch();

  @Query("""
      select max(d.price)
      from Document d
      where d.visibility = com.capstone.be.domain.enums.DocVisibility.PUBLIC
        and d.status = com.capstone.be.domain.enums.DocStatus.ACTIVE
        and d.isPremium = true
      """)
  Integer findMaxPremiumPriceForPublicSearch();

  @Query("""
      select d
      from Document d
        left join fetch d.docType
        left join fetch d.specialization
        left join fetch d.uploader
      where d.visibility = com.capstone.be.domain.enums.DocVisibility.PUBLIC
        and d.status = com.capstone.be.domain.enums.DocStatus.ACTIVE
        and d.createdAt >= :sevenDaysAgo
      order by (d.viewCount + d.upvoteCount * 3) desc
      """)
  Page<Document> findTopDocumentsLast7Days(
      @Param("sevenDaysAgo") Instant sevenDaysAgo,
      Pageable pageable
  );
}
