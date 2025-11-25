package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.Tag;
import com.capstone.be.domain.enums.TagStatus;
import com.capstone.be.dto.request.tag.CreateTagRequest;
import com.capstone.be.dto.request.tag.ReviewTagRequest;
import com.capstone.be.dto.request.tag.UpdateTagRequest;
import com.capstone.be.dto.response.tag.TagResponse;
import com.capstone.be.exception.DuplicateResourceException;
import com.capstone.be.exception.InvalidRequestException;
import com.capstone.be.exception.ResourceNotFoundException;
import com.capstone.be.mapper.TagMapper;
import com.capstone.be.repository.TagRepository;
import com.capstone.be.repository.specification.TagSpecification;
import com.capstone.be.service.TagService;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class TagServiceImpl implements TagService {

  private final TagRepository tagRepository;
  private final TagMapper tagMapper;

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

  // ===== ADMIN METHODS =====

  @Override
  @Transactional(readOnly = true)
  public Page<TagResponse> getAllTagsForAdmin(TagStatus status, String name, Pageable pageable) {
    log.info("Admin fetching tags - status: {}, name: {}, page: {}, size: {}",
        status, name, pageable.getPageNumber(), pageable.getPageSize());

    Specification<Tag> spec = TagSpecification.withFilters(status, name);
    Page<Tag> tagPage = tagRepository.findAll(spec, pageable);

    log.info("Retrieved {} tags for admin", tagPage.getTotalElements());
    return tagPage.map(tagMapper::toResponse);
  }

  @Override
  @Transactional(readOnly = true)
  public TagResponse getTagById(UUID tagId) {
    log.info("Admin fetching tag by ID: {}", tagId);

    Tag tag = tagRepository.findById(tagId)
        .orElseThrow(() -> new ResourceNotFoundException("Tag", tagId));

    log.info("Retrieved tag: {}", tag.getName());
    return tagMapper.toResponse(tag);
  }

  @Override
  @Transactional
  public TagResponse createTag(CreateTagRequest request) {
    log.info("Admin creating new tag: {}", request.getName());

    // Check for duplicate tag name
    String normalizedName = normalizeTagName(request.getName());
    if (tagRepository.existsByNormalizedName(normalizedName)) {
      log.warn("Tag already exists with name: {}", request.getName());
      throw new DuplicateResourceException("Tag", "name", request.getName());
    }

    // Create new tag with ACTIVE status
    Tag tag = Tag.builder()
        .name(request.getName().trim())
        .status(TagStatus.ACTIVE)
        .build();

    tag = tagRepository.save(tag);

    log.info("Created tag with ID: {} and code: {}", tag.getId(), tag.getCode());
    return tagMapper.toResponse(tag);
  }

  @Override
  @Transactional
  public TagResponse updateTag(UUID tagId, UpdateTagRequest request) {
    log.info("Admin updating tag: {}", tagId);

    // Find existing tag
    Tag tag = tagRepository.findById(tagId)
        .orElseThrow(() -> new ResourceNotFoundException("Tag", tagId));

    String oldName = tag.getName();

    // Check if new name is different
    if (!tag.getName().equals(request.getName().trim())) {
      // Check for duplicate tag name
      String normalizedName = normalizeTagName(request.getName());
      if (tagRepository.existsByNormalizedName(normalizedName)) {
        log.warn("Tag already exists with name: {}", request.getName());
        throw new DuplicateResourceException("Tag", "name", request.getName());
      }

      // Update name
      tag.setName(request.getName().trim());
    }

    tag = tagRepository.save(tag);

    log.info("Updated tag from '{}' to '{}'", oldName, tag.getName());
    return tagMapper.toResponse(tag);
  }

  @Override
  @Transactional
  public void reviewTag(UUID tagId, ReviewTagRequest request) {
    log.info("Admin reviewing tag: {}, approved: {}", tagId, request.getApproved());

    // Find tag
    Tag tag = tagRepository.findById(tagId)
        .orElseThrow(() -> new ResourceNotFoundException("Tag", tagId));

    // Validate tag is in PENDING status
    if (tag.getStatus() != TagStatus.PENDING) {
      log.warn("Cannot review tag with status: {}", tag.getStatus());
      throw new InvalidRequestException(
          String.format("Cannot review tag with status: %s. Only PENDING tags can be reviewed.",
              tag.getStatus().getDisplayName())
      );
    }

    // Update status
    if (Boolean.TRUE.equals(request.getApproved())) {
      tag.setStatus(TagStatus.ACTIVE);
      log.info("Tag '{}' approved and set to ACTIVE", tag.getName());
    } else {
      tag.setStatus(TagStatus.REJECTED);
      log.info("Tag '{}' rejected", tag.getName());
    }

    tagRepository.save(tag);
  }

  @Override
  @Transactional
  public void deleteTag(UUID tagId) {
    log.info("Admin deleting tag: {}", tagId);

    // Find tag
    Tag tag = tagRepository.findById(tagId)
        .orElseThrow(() -> new ResourceNotFoundException("Tag", tagId));

    // TODO: Check if tag is used by any documents
    // If tag is used, we might want to prevent deletion or soft delete

    tagRepository.delete(tag);

    log.info("Deleted tag: {}", tag.getName());
  }

  /**
   * Normalize tag name (lowercase, remove special characters)
   */
  private String normalizeTagName(String name) {
    return name.toLowerCase().replaceAll("[^a-z0-9]", "");
  }
}
