package com.capstone.be.dto.response.auth;

import com.capstone.be.domain.enums.ReaderStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class ReaderRegisterResponse {

    private String fullName;

    private String username;

    private LocalDate dateOfBirth;

    private String email;

    private String avatarUrl;

    private Integer coinBalance;

    private ReaderStatus status;
}
