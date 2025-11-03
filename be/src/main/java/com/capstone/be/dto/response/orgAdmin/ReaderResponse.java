package com.capstone.be.dto.response.orgAdmin;

import com.capstone.be.domain.enums.ReaderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReaderResponse {
    private UUID id;
    private String fullName;
    private String username;
    private LocalDate dateOfBirth;
    private String email;
    private String avatarUrl;
    private Integer coinBalance;
    private ReaderStatus status;
}
