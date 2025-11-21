package com.capstone.be.repository;

import com.capstone.be.domain.entity.Tag;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TagRepository extends JpaRepository<Tag, UUID> {

  Optional<Tag> findByName(String name);

  List<Tag> findAllByIdIn(List<UUID> ids);

  List<Tag> findAllByNameIn(List<String> names);
}
