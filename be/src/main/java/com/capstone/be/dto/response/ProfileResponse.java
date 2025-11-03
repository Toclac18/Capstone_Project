package com.capstone.be.dto.response;

import com.capstone.be.domain.enums.ReaderStatus;
import com.capstone.be.domain.enums.UserRole;

import java.time.LocalDate;
import java.util.UUID;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class ProfileResponse {

  UUID id;
    LocalDate dateOfBirth;
  UserRole role;
  String email;
  String fullName;
  String username;
  Integer coinBalance;
  ReaderStatus status;
  String ordid;
  String organizationName;
  String organizationEmail;
  String organizationHotline;
  String organizationLogo;
  String organizationAddress;
  Boolean active;
  Boolean deleted;
}
