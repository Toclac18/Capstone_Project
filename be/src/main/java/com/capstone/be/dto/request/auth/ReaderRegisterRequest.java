package com.capstone.be.dto.request.auth;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReaderRegisterRequest {

    @NotBlank
    private String fullName;

    @NotNull
    @Past
    private LocalDate dateOfBirth;

    @NotBlank
    private String username;

    @Email
    private String email;

    @NotBlank
    @Size(min = 8, max = 64, message = "Password's length must be between 8 and 64")
    @Pattern(
            regexp = "^(?=.*[a-zA-Z])(?=.*\\d).+$",
            message = "Password must contain digit and alphabet")
    private String password;
}
