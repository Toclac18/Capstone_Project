package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.Tag;
import com.capstone.be.service.TagService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class TagServiceImpl implements TagService {

  @Override
  public List<Tag> addUserTag(String string) {

    return List.of();
  }
}
