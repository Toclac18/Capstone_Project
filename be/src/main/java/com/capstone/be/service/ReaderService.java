package com.capstone.be.service;

import com.capstone.be.dto.response.reader.ReaderProfileResponse;
import java.util.UUID;

public interface ReaderService {

  /**
   * Get reader profile by user ID
   *
   * @param userId User ID
   * @return ReaderProfileResponse
   */
  ReaderProfileResponse getProfile(UUID userId);
}
