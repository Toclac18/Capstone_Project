package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.DocType;
import com.capstone.be.repository.DocTypeRepository;
import com.capstone.be.service.DocTypeService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocTypeServiceImpl implements DocTypeService {

  private final DocTypeRepository docTypeRepository;

  @Override
  @Transactional(readOnly = true)
  public List<DocType> getAllDocTypes() {
    log.info("Fetching all document types");

    List<DocType> docTypes = docTypeRepository.findAll();

    log.info("Retrieved {} document types", docTypes.size());
    return docTypes;
  }
}
