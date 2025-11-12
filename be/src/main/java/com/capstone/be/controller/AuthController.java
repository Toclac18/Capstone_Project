package com.capstone.be.controller;

import com.capstone.be.dto.base.SuccessResponse;
import com.capstone.be.dto.request.auth.ChangePasswordRequest;
import com.capstone.be.dto.request.auth.DeleteAccountRequest;
import com.capstone.be.dto.request.auth.LoginRequest;
import com.capstone.be.dto.request.auth.RegisterOrganizationInfo;
import com.capstone.be.dto.request.auth.RegisterReaderRequest;
import com.capstone.be.dto.request.auth.RegisterReviewerInfo;
import com.capstone.be.dto.request.auth.VerifyEmailRequest;
import com.capstone.be.dto.response.auth.LoginResponse;
import com.capstone.be.dto.response.auth.RegisterOrganizationResponse;
import com.capstone.be.dto.response.auth.RegisterReaderResponse;
import com.capstone.be.dto.response.auth.RegisterReviewerResponse;
import com.capstone.be.security.model.UserPrincipal;
import com.capstone.be.service.AuthService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
@Slf4j

public class AuthController {

  private final AuthService authService;

  @PostMapping("/register-reader")
  public RegisterReaderResponse registerReader(
      @Valid @RequestBody RegisterReaderRequest request) {
    return authService.registerReader(request);
  }

  @PostMapping(value = "/register-reviewer", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public RegisterReviewerResponse registerReviewer(
      @Valid @RequestPart("info") RegisterReviewerInfo info,
      @RequestPart("backgroundUploads") List<MultipartFile> files
  ) {
    return authService.registerReviewer(info, files);
  }

  @PostMapping(value = "/register-organization", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public RegisterOrganizationResponse registerOrganization(
      @Valid @RequestPart("info") RegisterOrganizationInfo info,
      @RequestPart("certificateUploads") List<MultipartFile> files
  ) {
    return authService.registerOrganization(info, files);
  }

  @PreAuthorize("hasAnyRole('READER', 'REVIEWER', 'ORGANIZATION')")
  @DeleteMapping("/delete-account")
  public SuccessResponse<?> deleteAccount(@Valid @RequestBody DeleteAccountRequest request,
      @AuthenticationPrincipal UserPrincipal principal) {
    authService.deleteAccount(principal.getRole(), principal.getId(), principal.getPassword(),
        request);
    return SuccessResponse.ofMessage("Your account has been deleted");
  }

  @PostMapping("/verify-email")
  public void verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
    authService.verifyEmail(request);
  }

  @PostMapping("/login")
  public LoginResponse login(@Valid @RequestBody LoginRequest request) {
    return authService.login(request);
  }

  @PostMapping("/change-password")
  @PreAuthorize("isAuthenticated()")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void changePassword(@Valid @RequestBody ChangePasswordRequest request,
      @AuthenticationPrincipal UserPrincipal principal) {
    authService.changePassword(principal.getId(), principal.getRole(), request);
  }

}
