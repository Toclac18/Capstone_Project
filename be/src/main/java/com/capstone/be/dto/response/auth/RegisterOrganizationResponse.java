package com.capstone.be.dto.response.auth;

import com.capstone.be.domain.enums.OrganizationStatus;
import com.capstone.be.domain.enums.OrganizationType;
import lombok.Data;

@Data
public class RegisterOrganizationResponse {

  private String name;

  private OrganizationType type;

  private String email;

  private String hotline;

  private String address;

  private String registrationNumber;

  private OrganizationStatus status;

  private String adminName;
  private String adminEmail;
}
