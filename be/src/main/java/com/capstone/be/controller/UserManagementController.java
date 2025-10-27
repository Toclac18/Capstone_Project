package com.capstone.be.controller;

import com.capstone.be.dto.base.SuccessResponse;
import com.capstone.be.dto.request.user.UpdateUserStatusRequest;
import com.capstone.be.dto.request.user.UserQueryRequest;
import com.capstone.be.dto.response.user.UserListResponse;
import com.capstone.be.service.UserManagementService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserManagementController {

  private final UserManagementService userManagementService;

  @PostMapping
  public ResponseEntity<SuccessResponse<UserListResponse>> getUsers(
      @RequestBody @Valid UserQueryRequest request) {
    UserListResponse response = userManagementService.getUsers(request);
    return ResponseEntity.status(HttpStatus.OK)
        .body(SuccessResponse.of(response));
  }

  @PatchMapping("/{userId}/status")
  public ResponseEntity<SuccessResponse<Void>> updateUserStatus(
      @PathVariable UUID userId,
      @RequestBody @Valid UpdateUserStatusRequest request) {
    userManagementService.updateUserStatus(userId, request);
    return ResponseEntity.status(HttpStatus.OK)
        .body(SuccessResponse.of(null));
  }
}

