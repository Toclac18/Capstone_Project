package com.capstone.be.security.model;

import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.UserStatus;
import java.util.Collection;
import java.util.Collections;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

@Getter
@AllArgsConstructor
public class UserPrincipal implements UserDetails {

  private UUID id;
  private String email;
  private String password;
  private String fullName;
  private String role;
  private UserStatus status;

  public static UserPrincipal fromUser(User user) {
    return new UserPrincipal(
        user.getId(),
        user.getEmail(),
        user.getPasswordHash(),
        user.getFullName(),
        user.getRole().name(),
        user.getStatus()
    );
  }

  @Override
  public Collection<? extends GrantedAuthority> getAuthorities() {
    return Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role));
  }

  @Override
  public String getPassword() {
    return password;
  }

  @Override
  public String getUsername() {
    return id.toString();  // Return UUID instead of email for consistency with JWT subject
  }

  @Override
  public boolean isAccountNonExpired() {
    return true;
  }

  @Override
  public boolean isAccountNonLocked() {
    return status != UserStatus.INACTIVE && status != UserStatus.DELETED;
  }

  @Override
  public boolean isCredentialsNonExpired() {
    return true;
  }

  @Override
  public boolean isEnabled() {
    // Return true for ACTIVE, PENDING_EMAIL_VERIFY, and PENDING_APPROVE
    // so Spring Security doesn't block authentication before our custom logic runs
    // We handle status-specific errors in AuthServiceImpl.login()
    return status == UserStatus.ACTIVE 
        || status == UserStatus.PENDING_EMAIL_VERIFY 
        || status == UserStatus.PENDING_APPROVE;
  }
}
