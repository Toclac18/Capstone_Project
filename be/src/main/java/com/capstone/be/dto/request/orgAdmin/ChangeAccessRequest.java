package com.capstone.be.dto.request.orgAdmin;

import java.util.UUID;
import lombok.Data;

@Data
public class ChangeAccessRequest {

  private UUID userId;
  private boolean enable;
}
