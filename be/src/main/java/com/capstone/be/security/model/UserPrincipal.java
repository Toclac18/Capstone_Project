package com.capstone.be.security.model;

import com.capstone.be.domain.entity.BusinessAdmin;
import com.capstone.be.domain.entity.Organization;
import com.capstone.be.domain.entity.Reader;
import com.capstone.be.domain.entity.Reviewer;
import com.capstone.be.domain.entity.SystemAdmin;
import com.capstone.be.domain.enums.OrganizationStatus;
import com.capstone.be.domain.enums.ReaderStatus;
import com.capstone.be.domain.enums.ReviewerStatus;
import com.capstone.be.domain.enums.UserRole;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

public class UserPrincipal implements UserDetails {

  @Getter
  private final UUID id;
  @Getter
  private final UserRole role;
  private final String email;
  @Getter
  private final String displayName;
  private final String passwordHash;
  private final boolean accountNonLocked;
  private final boolean enabled;
  private final List<GrantedAuthority> authorities;

  private UserPrincipal(UUID id,
      UserRole role,
      String email,
      String displayName,
      String passwordHash,
      boolean accountNonLocked,
      boolean enabled) {
    this.id = id;
    this.role = role;
    this.email = email;
    this.displayName = displayName;
    this.passwordHash = passwordHash;
    this.accountNonLocked = accountNonLocked;
    this.enabled = enabled;
    this.authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
  }

  public static UserPrincipal fromReader(Reader reader) {
    boolean locked = ReaderStatus.DEACTIVE.equals(reader.getStatus());
    boolean enabled = ReaderStatus.PENDING_VERIFICATION.equals(reader.getStatus());
    return new UserPrincipal(
        reader.getId(),
        UserRole.READER,
        reader.getEmail(),
        reader.getUsername(),
        reader.getPasswordHash(),
        !locked,
        enabled
    );
  }

  public static UserPrincipal fromReviewer(Reviewer reviewer) {
    boolean locked = ReviewerStatus.DEACTIVE.equals(reviewer.getStatus());
    boolean enabled = ReviewerStatus.PENDING_VERIFICATION.equals(reviewer.getStatus());
    return new UserPrincipal(
        reviewer.getId(),
        UserRole.REVIEWER,
        reviewer.getEmail(),
        reviewer.getName(),
        reviewer.getPasswordHash(),
        !locked,
        enabled
    );
  }

  public static UserPrincipal fromOrganization(Organization org) {
    boolean locked = OrganizationStatus.DEACTIVE.equals(org.getStatus());
    boolean enabled = OrganizationStatus.PENDING_VERIFICATION.equals(org.getStatus());
    return new UserPrincipal(
        org.getId(),
        UserRole.ORGANIZATION,
        org.getAdminEmail(),
        org.getAdminName(),
        org.getAdminPassword(),
        !locked,
        enabled
    );
  }

  //#Temp: Admins are not Locked or Disabled
  public static UserPrincipal fromBusinessAdmin(BusinessAdmin admin) {
    return new UserPrincipal(
        admin.getId(),
        UserRole.BUSINESS_ADMIN,
        admin.getEmail(),
        admin.getFullName(),
        admin.getPasswordHash(),
        true,
        true
    );
  }

  public static UserPrincipal fromSystemAdmin(SystemAdmin admin) {
    return new UserPrincipal(
        admin.getId(),
        UserRole.SYSTEM_ADMIN,
        admin.getEmail(),
        admin.getFullName(),
        admin.getPasswordHash(),
        true,
        true
    );
  }

  @Override
  public Collection<? extends GrantedAuthority> getAuthorities() {
    return authorities;
  }

  @Override
  public String getPassword() {
    return passwordHash;
  }

  @Override
  public String getUsername() {
    return email;
  }

  @Override
  public boolean isAccountNonExpired() {
    return true;
  }

  @Override
  public boolean isAccountNonLocked() {
    return accountNonLocked;
  }

  @Override
  public boolean isCredentialsNonExpired() {
    return true;
  }

  @Override
  public boolean isEnabled() {
    return enabled;
  }
}
