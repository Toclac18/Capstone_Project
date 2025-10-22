package com.capstone.be.controller;

import com.capstone.be.dto.response.ProfileResponse;
import com.capstone.be.security.model.UserPrincipal;
import com.capstone.be.service.ProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

  @Autowired
  private ProfileService profileService;

  @GetMapping
  public ProfileResponse getProfile(@AuthenticationPrincipal UserPrincipal principal) {
    if (principal == null) {
      throw new IllegalStateException("User principal is null - authentication required");
    }
    return profileService.getProfile(principal.getId(), principal.getRole());
  }
}
