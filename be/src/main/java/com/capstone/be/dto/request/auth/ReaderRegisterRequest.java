package com.capstone.be.dto.request.auth;


import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReaderRegisterRequest {

  @NotBlank
  private String username;

  @Email
  @NotBlank
  private String email;

  @NotBlank
  @Size(min = 8, max = 64)
  private String password;

}
