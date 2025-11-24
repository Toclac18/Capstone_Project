package com.capstone.be.service;

import com.capstone.be.domain.entity.Tag;
import com.capstone.be.domain.enums.TagStatus;
import java.util.List;
import java.util.Set;

public interface TagService {

//  List<Tag> getTags(TagStatus status);
//  Tag getByCode(int code);

  /**
  * @return list Of Added Tags (with PENDING status)
   * **/
  List<Tag> addUserTag(String string);

}
