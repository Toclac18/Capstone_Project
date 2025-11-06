package com.capstone.be.service;

import com.capstone.be.dto.request.user.UpdateUserStatusRequest;
import com.capstone.be.dto.request.user.UserQueryRequest;
import com.capstone.be.dto.response.user.UserListResponse;
import java.util.UUID;

public interface UserManagementService {

  UserListResponse getUsers(UserQueryRequest request);

  void updateUserStatus(UUID userId, UpdateUserStatusRequest request);
}

