package com.capstone.be.dto.response.orgAdmin;

import com.capstone.be.domain.enums.ReaderStatus;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReaderResponse {

  private UUID id;
  private String fullName;
  //  private String username;
//  private LocalDate dateOfBirth;
  private String email;
  private String avatarUrl;
  //  private Integer coinBalance;
  private ReaderStatus status;
}
