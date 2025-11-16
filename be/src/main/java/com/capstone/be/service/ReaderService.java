package com.capstone.be.service;

import com.capstone.be.dto.request.reader.UpdateReaderProfileRequest;
import com.capstone.be.dto.response.reader.ReaderProfileResponse;
import java.util.UUID;
import org.springframework.web.multipart.MultipartFile;

public interface ReaderService {

  /**
   * Get reader profile by user ID
   *
   * @param userId User ID
   * @return ReaderProfileResponse
   */
  ReaderProfileResponse getProfile(UUID userId);

  /**
   * Update reader profile
   *
   * @param userId  User ID
   * @param request Update profile request
   * @return Updated ReaderProfileResponse
   */
  ReaderProfileResponse updateProfile(UUID userId, UpdateReaderProfileRequest request);

  /**
   * Upload avatar for reader
   *
   * @param userId User ID
   * @param file   Avatar image file
   * @return Updated ReaderProfileResponse with new avatar URL
   */
  ReaderProfileResponse uploadAvatar(UUID userId, MultipartFile file);
}
