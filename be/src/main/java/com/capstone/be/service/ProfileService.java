package com.capstone.be.service;

import com.capstone.be.domain.enums.UserRole;
import com.capstone.be.dto.response.ProfileResponse;
import java.util.UUID;

public interface ProfileService {

  ProfileResponse getProfile(UUID subjectId, UserRole role);
}
