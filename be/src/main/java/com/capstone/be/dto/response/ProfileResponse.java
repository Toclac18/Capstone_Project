package com.capstone.be.dto.response;

import com.capstone.be.domain.enums.ReaderStatus;
import com.capstone.be.domain.enums.UserRole;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class ProfileResponse {

  Long id;
  UserRole role;
  String email;
  String displayName;
  Integer coinBalance;
  ReaderStatus status;
  String organizationName;
  String organizationAddress;
  String organizationHotline;
  String organizationLogo;
  Boolean active;
  Boolean deleted;
}
