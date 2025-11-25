package com.capstone.be.service;

import com.capstone.be.domain.entity.Tag;
import com.capstone.be.domain.enums.TagStatus;
import com.capstone.be.dto.request.tag.CreateTagRequest;
import com.capstone.be.dto.request.tag.ReviewTagRequest;
import com.capstone.be.dto.request.tag.UpdateTagRequest;
import com.capstone.be.dto.response.tag.TagResponse;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface TagService {

//  List<Tag> getTags(TagStatus status);
//  Tag getByCode(int code);

  /**
  * @return list Of Added Tags (with PENDING status)
   * **/
  List<Tag> addUserTag(String string);

  /**
   * Get all active tags
   *
   * @return List of active tags
   */
  List<Tag> getActiveTags();

  /**
   * Get all tags (including pending)
   *
   * @return List of all tags
   */
  List<Tag> getAllTags();

  // ===== ADMIN METHODS =====

  /**
   * Get all tags with optional filters (paginated)
   * For Business Admin to view and manage tags
   *
   * @param status Tag status filter (optional)
   * @param name   Tag name filter (optional)
   * @param pageable Pagination parameters
   * @return Page of TagResponse
   */
  Page<TagResponse> getAllTagsForAdmin(TagStatus status, String name, Pageable pageable);

  /**
   * Get tag by ID
   * For Business Admin to view tag details
   *
   * @param tagId Tag ID
   * @return TagResponse
   */
  TagResponse getTagById(UUID tagId);

  /**
   * Create a new tag with ACTIVE status
   * For Business Admin to manually create tags
   *
   * @param request CreateTagRequest
   * @return Created TagResponse
   */
  TagResponse createTag(CreateTagRequest request);

  /**
   * Update an existing tag
   * For Business Admin to edit tag name
   *
   * @param tagId   Tag ID (from path parameter)
   * @param request UpdateTagRequest
   * @return Updated TagResponse
   */
  TagResponse updateTag(UUID tagId, UpdateTagRequest request);

  /**
   * Review (accept/reject) a pending tag
   * For Business Admin to approve or reject user-created tags
   *
   * @param tagId   Tag ID (from path parameter)
   * @param request ReviewTagRequest
   */
  void reviewTag(UUID tagId, ReviewTagRequest request);

  /**
   * Delete a tag
   * For Business Admin to remove tags
   *
   * @param tagId Tag ID
   */
  void deleteTag(UUID tagId);
}
