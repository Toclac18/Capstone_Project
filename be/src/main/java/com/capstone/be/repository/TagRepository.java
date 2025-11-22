package com.capstone.be.repository;

import com.capstone.be.domain.entity.Tag;
import com.capstone.be.domain.enums.TagStatus;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface TagRepository extends JpaRepository<Tag, UUID> {

  Optional<Tag> findByName(String name);

  Optional<Tag> findByNormalizedName(String normalizedName);

  Optional<Tag> findByNormalizedNameAndStatus(String normalizedName, TagStatus status);

  boolean existsByName(String name);

  boolean existsByNormalizedName(String normalizedName);

  boolean existsByNormalizedNameAndStatus(String normalizedName, TagStatus status);

  List<Tag> findAllByStatus(TagStatus status);

  Page<Tag> findAllByStatus(TagStatus status, Pageable pageable);

  Set<Tag> findAllByStatusAndCodeIn(TagStatus status, Collection<Long> codes);

  List<Tag> findAllByNameIn(Collection<String> names);

  @Query("select t.code from Tag t where t.code in :codes and t.status = ACTIVE")
  Set<Long> findValidActiveTagCodes(@Param("codes") List<Long> codes);
//
//  @Query("select t.code from Tag t where t.code in :codes and t.status = ACTIVE")
//  Set<Long> findValidCodeByStatus(@Param("codes") List<Long> codes);

  List<Tag> findAllByIdIn(List<UUID> ids);

  Set<Tag> findAllByNormalizedNameIn(Collection<String> normalizedNames);
}
