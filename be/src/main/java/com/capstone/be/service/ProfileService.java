package com.capstone.be.service;

import com.capstone.be.domain.enums.UserRole;
import com.capstone.be.dto.response.ProfileResponse;

public interface ProfileService {

  ProfileResponse getProfile(Long subjectId, UserRole role);
}
