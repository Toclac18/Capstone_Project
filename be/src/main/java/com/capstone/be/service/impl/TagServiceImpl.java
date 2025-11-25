package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.Tag;
import com.capstone.be.domain.enums.TagStatus;
import com.capstone.be.repository.TagRepository;
import com.capstone.be.service.TagService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class TagServiceImpl implements TagService {

  private final TagRepository tagRepository;

  @Override
  public List<Tag> addUserTag(String string) {

    return List.of();
  }

  @Override
  @Transactional(readOnly = true)
  public List<Tag> getActiveTags() {
    log.info("Fetching all active tags");

    List<Tag> tags = tagRepository.findAllByStatus(TagStatus.ACTIVE);

    log.info("Retrieved {} active tags", tags.size());
    return tags;
  }

  @Override
  @Transactional(readOnly = true)
  public List<Tag> getAllTags() {
    log.info("Fetching all tags (including pending)");

    List<Tag> tags = tagRepository.findAll();

    log.info("Retrieved {} tags (all statuses)", tags.size());
    return tags;
  }
}
