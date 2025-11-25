package com.capstone.be.service;

import com.capstone.be.domain.entity.DocType;
import java.util.List;

/**
 * Service interface for Document Type resources
 */
public interface DocTypeService {

  /**
   * Get all document types
   *
   * @return List of all document types
   */
  List<DocType> getAllDocTypes();
}
