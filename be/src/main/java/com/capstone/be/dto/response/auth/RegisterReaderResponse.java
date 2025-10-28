package com.capstone.be.dto.response.auth;


import com.capstone.be.domain.enums.ReaderStatus;
import java.time.LocalDate;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RegisterReaderResponse {

  private String fullName;

  private String username;

  private LocalDate dateOfBirth;

  private String email;

  private String avatarUrl;

  private Integer coinBalance;

  private ReaderStatus status;

}
