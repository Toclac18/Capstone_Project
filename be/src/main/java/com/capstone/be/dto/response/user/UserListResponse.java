package com.capstone.be.dto.response.user;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserListResponse {
  private List<UserResponse> users;
  private Integer total;
  private Integer page;
  private Integer limit;
}
