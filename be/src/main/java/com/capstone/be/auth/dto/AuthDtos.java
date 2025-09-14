package com.capstone.be.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthDtos {
    public record RegisterRequest(@Email @NotBlank String email,
                                  @Size(min = 6) String password) {}
    public record LoginRequest(@Email @NotBlank String email,
                               @NotBlank String password) {}
    public record AuthResponse(String accessToken, String tokenType, long expiresInMs) {}
}