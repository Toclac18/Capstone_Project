package com.capstone.be.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isA;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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
import com.capstone.be.service.impl.TagServiceImpl;
import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

@ExtendWith(MockitoExtension.class)
@DisplayName("TagService Unit Tests")
class TagServiceTest {

  @Mock
  private TagRepository tagRepository;

  @Mock
  private TagMapper tagMapper;

  @InjectMocks
  private TagServiceImpl tagService;

  private Tag tag1;
  private Tag tag2;
  private Tag pendingTag;
  private UUID tagId1;
  private UUID tagId2;
  private UUID pendingTagId;

  @BeforeEach
  void setUp() {
    tagId1 = UUID.randomUUID();
    tagId2 = UUID.randomUUID();
    pendingTagId = UUID.randomUUID();

    tag1 = Tag.builder()
        .id(tagId1)
        .code(1L)
        .name("Java")
        .normalizedName("java")
        .status(TagStatus.ACTIVE)
        .createdAt(Instant.now())
        .updatedAt(Instant.now())
        .build();

    tag2 = Tag.builder()
        .id(tagId2)
        .code(2L)
        .name("Python")
        .normalizedName("python")
        .status(TagStatus.ACTIVE)
        .createdAt(Instant.now())
        .updatedAt(Instant.now())
        .build();

    pendingTag = Tag.builder()
        .id(pendingTagId)
        .code(3L)
        .name("React")
        .normalizedName("react")
        .status(TagStatus.PENDING)
        .createdAt(Instant.now())
        .updatedAt(Instant.now())
        .build();
  }

  // test getActiveTags should return only active tags
  @Test
  @DisplayName("getActiveTags should return only active tags")
  void getActiveTags_ShouldReturnActiveTags() {
    List<Tag> activeTags = Arrays.asList(tag1, tag2);
    when(tagRepository.findAllByStatus(TagStatus.ACTIVE)).thenReturn(activeTags);

    List<Tag> result = tagService.getActiveTags();

    assertNotNull(result);
    assertEquals(2, result.size());
    assertTrue(result.stream().allMatch(t -> t.getStatus() == TagStatus.ACTIVE));
    verify(tagRepository, times(1)).findAllByStatus(TagStatus.ACTIVE);
  }

  // test getActiveTags should return empty list when no active tags
  @Test
  @DisplayName("getActiveTags should return empty list when no active tags")
  void getActiveTags_ShouldReturnEmptyList() {
    when(tagRepository.findAllByStatus(TagStatus.ACTIVE)).thenReturn(Collections.emptyList());

    List<Tag> result = tagService.getActiveTags();

    assertNotNull(result);
    assertTrue(result.isEmpty());
  }

  // test getAllTags should return all tags including pending
  @Test
  @DisplayName("getAllTags should return all tags including pending")
  void getAllTags_ShouldReturnAllTags() {
    List<Tag> allTags = Arrays.asList(tag1, tag2, pendingTag);
    when(tagRepository.findAll()).thenReturn(allTags);

    List<Tag> result = tagService.getAllTags();

    assertNotNull(result);
    assertEquals(3, result.size());
    verify(tagRepository, times(1)).findAll();
  }

  // test getAllTagsForAdmin should return paginated tags
  @Test
  @DisplayName("getAllTagsForAdmin should return paginated tags")
  void getAllTagsForAdmin_ShouldReturnPaginatedTags() {
    Pageable pageable = PageRequest.of(0, 10);
    List<Tag> tags = Arrays.asList(tag1, tag2);
    Page<Tag> tagPage = new PageImpl<>(tags, pageable, 2);

    TagResponse response1 = TagResponse.builder()
        .id(tagId1)
        .code(1L)
        .name("Java")
        .status(TagStatus.ACTIVE)
        .build();
    TagResponse response2 = TagResponse.builder()
        .id(tagId2)
        .code(2L)
        .name("Python")
        .status(TagStatus.ACTIVE)
        .build();

    when(tagRepository.findAll(isA(Specification.class), eq(pageable))).thenReturn(tagPage);
    when(tagMapper.toResponse(tag1)).thenReturn(response1);
    when(tagMapper.toResponse(tag2)).thenReturn(response2);

    Page<TagResponse> result = tagService.getAllTagsForAdmin(null, null, pageable);

    assertNotNull(result);
    assertEquals(2, result.getTotalElements());
    verify(tagRepository, times(1)).findAll(isA(Specification.class), eq(pageable));
  }

  // test getAllTagsForAdmin should filter by status
  @Test
  @DisplayName("getAllTagsForAdmin should filter by status")
  void getAllTagsForAdmin_ShouldFilterByStatus() {
    Pageable pageable = PageRequest.of(0, 10);
    List<Tag> pendingTags = Collections.singletonList(pendingTag);
    Page<Tag> tagPage = new PageImpl<>(pendingTags, pageable, 1);

    TagResponse response = TagResponse.builder()
        .id(pendingTagId)
        .code(3L)
        .name("React")
        .status(TagStatus.PENDING)
        .build();

    when(tagRepository.findAll(isA(Specification.class), eq(pageable))).thenReturn(tagPage);
    when(tagMapper.toResponse(pendingTag)).thenReturn(response);

    Page<TagResponse> result = tagService.getAllTagsForAdmin(TagStatus.PENDING, null, pageable);

    assertEquals(1, result.getTotalElements());
    assertEquals(TagStatus.PENDING, result.getContent().get(0).getStatus());
  }

  // test getAllTagsForAdmin should filter by name
  @Test
  @DisplayName("getAllTagsForAdmin should filter by name")
  void getAllTagsForAdmin_ShouldFilterByName() {
    Pageable pageable = PageRequest.of(0, 10);
    String nameFilter = "Java";
    List<Tag> filteredTags = Collections.singletonList(tag1);
    Page<Tag> tagPage = new PageImpl<>(filteredTags, pageable, 1);

    TagResponse response = TagResponse.builder()
        .id(tagId1)
        .code(1L)
        .name("Java")
        .status(TagStatus.ACTIVE)
        .build();

    when(tagRepository.findAll(isA(Specification.class), eq(pageable))).thenReturn(tagPage);
    when(tagMapper.toResponse(tag1)).thenReturn(response);

    Page<TagResponse> result = tagService.getAllTagsForAdmin(null, nameFilter, pageable);

    assertEquals(1, result.getTotalElements());
    assertEquals("Java", result.getContent().get(0).getName());
  }

  // test getTagById should return tag when exists
  @Test
  @DisplayName("getTagById should return tag when exists")
  void getTagById_ShouldReturnTag() {
    TagResponse expectedResponse = TagResponse.builder()
        .id(tagId1)
        .code(1L)
        .name("Java")
        .status(TagStatus.ACTIVE)
        .build();

    when(tagRepository.findById(tagId1)).thenReturn(Optional.of(tag1));
    when(tagMapper.toResponse(tag1)).thenReturn(expectedResponse);

    TagResponse result = tagService.getTagById(tagId1);

    assertNotNull(result);
    assertEquals(tagId1, result.getId());
    assertEquals("Java", result.getName());
    verify(tagRepository, times(1)).findById(tagId1);
  }

  // test getTagById should throw exception when not found
  @Test
  @DisplayName("getTagById should throw exception when not found")
  void getTagById_ShouldThrowException_WhenNotFound() {
    UUID nonExistentId = UUID.randomUUID();
    when(tagRepository.findById(nonExistentId)).thenReturn(Optional.empty());

    assertThrows(ResourceNotFoundException.class,
        () -> tagService.getTagById(nonExistentId));
    verify(tagMapper, never()).toResponse(any());
  }

  // test createTag should create new tag with ACTIVE status
  @Test
  @DisplayName("createTag should create new tag with ACTIVE status")
  void createTag_ShouldCreateTag() {
    CreateTagRequest request = CreateTagRequest.builder()
        .name("JavaScript")
        .build();

    Tag newTag = Tag.builder()
        .id(UUID.randomUUID())
        .code(4L)
        .name("JavaScript")
        .normalizedName("javascript")
        .status(TagStatus.ACTIVE)
        .createdAt(Instant.now())
        .updatedAt(Instant.now())
        .build();

    TagResponse expectedResponse = TagResponse.builder()
        .id(newTag.getId())
        .code(4L)
        .name("JavaScript")
        .status(TagStatus.ACTIVE)
        .build();

    when(tagRepository.existsByNormalizedName("javascript")).thenReturn(false);
    when(tagRepository.save(any(Tag.class))).thenReturn(newTag);
    when(tagMapper.toResponse(newTag)).thenReturn(expectedResponse);

    TagResponse result = tagService.createTag(request);

    assertNotNull(result);
    assertEquals("JavaScript", result.getName());
    assertEquals(TagStatus.ACTIVE, result.getStatus());
    verify(tagRepository, times(1)).save(any(Tag.class));
  }

  // test createTag should throw exception when duplicate name
  @Test
  @DisplayName("createTag should throw exception when duplicate name")
  void createTag_ShouldThrowException_WhenDuplicate() {
    CreateTagRequest request = CreateTagRequest.builder()
        .name("Java")
        .build();

    when(tagRepository.existsByNormalizedName("java")).thenReturn(true);

    assertThrows(DuplicateResourceException.class,
        () -> tagService.createTag(request));
    verify(tagRepository, never()).save(any());
  }

  // test updateTag should update tag name
  @Test
  @DisplayName("updateTag should update tag name")
  void updateTag_ShouldUpdateTag() {
    UpdateTagRequest request = UpdateTagRequest.builder()
        .name("Java 17")
        .build();

    Tag updatedTag = Tag.builder()
        .id(tagId1)
        .code(1L)
        .name("Java 17")
        .normalizedName("java17")
        .status(TagStatus.ACTIVE)
        .build();

    TagResponse expectedResponse = TagResponse.builder()
        .id(tagId1)
        .code(1L)
        .name("Java 17")
        .status(TagStatus.ACTIVE)
        .build();

    when(tagRepository.findById(tagId1)).thenReturn(Optional.of(tag1));
    when(tagRepository.existsByNormalizedName("java17")).thenReturn(false);
    when(tagRepository.save(any(Tag.class))).thenReturn(updatedTag);
    when(tagMapper.toResponse(updatedTag)).thenReturn(expectedResponse);

    TagResponse result = tagService.updateTag(tagId1, request);

    assertEquals("Java 17", result.getName());
    verify(tagRepository, times(1)).save(any(Tag.class));
  }

  // test updateTag should throw exception when duplicate name
  @Test
  @DisplayName("updateTag should throw exception when duplicate name")
  void updateTag_ShouldThrowException_WhenDuplicate() {
    UpdateTagRequest request = UpdateTagRequest.builder()
        .name("Python")
        .build();

    when(tagRepository.findById(tagId1)).thenReturn(Optional.of(tag1));
    when(tagRepository.existsByNormalizedName("python")).thenReturn(true);

    assertThrows(DuplicateResourceException.class,
        () -> tagService.updateTag(tagId1, request));
    verify(tagRepository, never()).save(any());
  }

  // test updateTag should not update when name unchanged
  @Test
  @DisplayName("updateTag should not update when name unchanged")
  void updateTag_ShouldNotUpdate_WhenNameUnchanged() {
    UpdateTagRequest request = UpdateTagRequest.builder()
        .name("Java")
        .build();

    TagResponse expectedResponse = TagResponse.builder()
        .id(tagId1)
        .code(1L)
        .name("Java")
        .status(TagStatus.ACTIVE)
        .build();

    when(tagRepository.findById(tagId1)).thenReturn(Optional.of(tag1));
    when(tagRepository.save(any(Tag.class))).thenReturn(tag1);
    when(tagMapper.toResponse(tag1)).thenReturn(expectedResponse);

    TagResponse result = tagService.updateTag(tagId1, request);

    assertEquals("Java", result.getName());
    verify(tagRepository, never()).existsByNormalizedName(any());
  }

  // test updateTag should throw exception when not found
  @Test
  @DisplayName("updateTag should throw exception when not found")
  void updateTag_ShouldThrowException_WhenNotFound() {
    UUID nonExistentId = UUID.randomUUID();
    UpdateTagRequest request = UpdateTagRequest.builder()
        .name("New Tag")
        .build();

    when(tagRepository.findById(nonExistentId)).thenReturn(Optional.empty());

    assertThrows(ResourceNotFoundException.class,
        () -> tagService.updateTag(nonExistentId, request));
    verify(tagRepository, never()).save(any());
  }

  // test reviewTag should approve pending tag
  @Test
  @DisplayName("reviewTag should approve pending tag")
  void reviewTag_ShouldApproveTag() {
    ReviewTagRequest request = ReviewTagRequest.builder()
        .approved(true)
        .build();

    Tag approvedTag = Tag.builder()
        .id(pendingTagId)
        .code(3L)
        .name("React")
        .normalizedName("react")
        .status(TagStatus.ACTIVE)
        .build();

    when(tagRepository.findById(pendingTagId)).thenReturn(Optional.of(pendingTag));
    when(tagRepository.save(any(Tag.class))).thenReturn(approvedTag);

    tagService.reviewTag(pendingTagId, request);

    verify(tagRepository, times(1)).findById(pendingTagId);
    verify(tagRepository, times(1)).save(any(Tag.class));
  }

  // test reviewTag should reject pending tag
  @Test
  @DisplayName("reviewTag should reject pending tag")
  void reviewTag_ShouldRejectTag() {
    ReviewTagRequest request = ReviewTagRequest.builder()
        .approved(false)
        .build();

    Tag rejectedTag = Tag.builder()
        .id(pendingTagId)
        .code(3L)
        .name("React")
        .normalizedName("react")
        .status(TagStatus.REJECTED)
        .build();

    when(tagRepository.findById(pendingTagId)).thenReturn(Optional.of(pendingTag));
    when(tagRepository.save(any(Tag.class))).thenReturn(rejectedTag);

    tagService.reviewTag(pendingTagId, request);

    verify(tagRepository, times(1)).save(any(Tag.class));
  }

  // test reviewTag should throw exception when tag not pending
  @Test
  @DisplayName("reviewTag should throw exception when tag not pending")
  void reviewTag_ShouldThrowException_WhenNotPending() {
    ReviewTagRequest request = ReviewTagRequest.builder()
        .approved(true)
        .build();

    when(tagRepository.findById(tagId1)).thenReturn(Optional.of(tag1));

    assertThrows(InvalidRequestException.class,
        () -> tagService.reviewTag(tagId1, request));
    verify(tagRepository, never()).save(any());
  }

  // test reviewTag should throw exception when tag not found
  @Test
  @DisplayName("reviewTag should throw exception when tag not found")
  void reviewTag_ShouldThrowException_WhenNotFound() {
    UUID nonExistentId = UUID.randomUUID();
    ReviewTagRequest request = ReviewTagRequest.builder()
        .approved(true)
        .build();

    when(tagRepository.findById(nonExistentId)).thenReturn(Optional.empty());

    assertThrows(ResourceNotFoundException.class,
        () -> tagService.reviewTag(nonExistentId, request));
    verify(tagRepository, never()).save(any());
  }

  // test deleteTag should delete tag
  @Test
  @DisplayName("deleteTag should delete tag")
  void deleteTag_ShouldDeleteTag() {
    when(tagRepository.findById(tagId1)).thenReturn(Optional.of(tag1));

    tagService.deleteTag(tagId1);

    verify(tagRepository, times(1)).findById(tagId1);
    verify(tagRepository, times(1)).delete(tag1);
  }

  // test deleteTag should throw exception when not found
  @Test
  @DisplayName("deleteTag should throw exception when not found")
  void deleteTag_ShouldThrowException_WhenNotFound() {
    UUID nonExistentId = UUID.randomUUID();
    when(tagRepository.findById(nonExistentId)).thenReturn(Optional.empty());

    assertThrows(ResourceNotFoundException.class,
        () -> tagService.deleteTag(nonExistentId));
    verify(tagRepository, never()).delete(any(Tag.class));
  }
}


