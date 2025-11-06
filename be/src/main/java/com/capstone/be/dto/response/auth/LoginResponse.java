package com.capstone.be.dto.response.auth;

import com.capstone.be.domain.enums.UserRole;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class LoginResponse {

    String accessToken;
    String tokenType;
    long expiresIn;
    String subjectId;
    UserRole role;
    String email;
    String displayName;
}
