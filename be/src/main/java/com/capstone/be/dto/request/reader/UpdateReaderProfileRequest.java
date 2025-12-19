package com.capstone.be.dto.request.reader;

import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateReaderProfileRequest {

  @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
  private String fullName;

  @Past(message = "Date of birth must be in the past")
  private LocalDate dob;
}
