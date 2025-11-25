package com.capstone.be.service;

import com.capstone.be.domain.entity.Tag;
import java.util.List;

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

}
