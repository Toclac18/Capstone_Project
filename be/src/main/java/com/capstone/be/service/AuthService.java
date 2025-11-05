package com.capstone.be.service;

import com.capstone.be.domain.enums.UserRole;
import com.capstone.be.dto.request.auth.ChangePasswordRequest;
import com.capstone.be.dto.request.auth.LoginRequest;
import com.capstone.be.dto.request.auth.RegisterOrganizationInfo;
import com.capstone.be.dto.request.auth.RegisterReaderRequest;
import com.capstone.be.dto.request.auth.RegisterReviewerInfo;
import com.capstone.be.dto.request.auth.VerifyEmailRequest;
import com.capstone.be.dto.response.auth.LoginResponse;
import com.capstone.be.dto.response.auth.RegisterOrganizationResponse;
import com.capstone.be.dto.response.auth.RegisterReaderResponse;
import com.capstone.be.dto.response.auth.RegisterReviewerResponse;
import java.util.List;
import java.util.UUID;
import org.springframework.web.multipart.MultipartFile;

public interface AuthService {

  RegisterReaderResponse registerReader(RegisterReaderRequest request);

  RegisterReviewerResponse registerReviewer(RegisterReviewerInfo info,
      List<MultipartFile> files);

  RegisterOrganizationResponse registerOrganization(RegisterOrganizationInfo info,
      List<MultipartFile> files);

  void verifyEmail(VerifyEmailRequest request);

  LoginResponse login(LoginRequest request);

  void changePassword(UUID subjectId, UserRole role, ChangePasswordRequest request);

}
