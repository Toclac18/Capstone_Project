package com.capstone.be.security.service;

import com.capstone.be.domain.enums.UserRole;
import com.capstone.be.security.model.UserPrincipal;
import com.capstone.be.security.util.JwtUtil;
import io.jsonwebtoken.Claims;
import java.util.UUID;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

  private final JwtUtil jwtUtil;
  private final AccountDetailsService accountDetailsService;

  public JwtService(JwtUtil jwtUtil, AccountDetailsService accountDetailsService) {
    this.jwtUtil = jwtUtil;
    this.accountDetailsService = accountDetailsService;
  }

  public String generateToken(UUID subjectId, UserRole role, String email) {
    return jwtUtil.generateToken(subjectId, role, email);
  }

  public String generateEmailVerifyToken(String email){
    return jwtUtil.generateEmailVerifyToken(email);
  }

  public Authentication buildAuthentication(String token) {
    Claims claims = jwtUtil.parseClaims(token);
    UUID subjectId = parseSubjectId(claims);
    UserRole role = jwtUtil.extractRole(claims);

    UserPrincipal principal = accountDetailsService.loadPrincipal(role, subjectId);

    return new UsernamePasswordAuthenticationToken(principal, token, principal.getAuthorities());
  }

  public long getExpirationMs() {
    return jwtUtil.getExpirationMs();
  }

  private UUID parseSubjectId(Claims claims) {
    try {
      return UUID.fromString(claims.getSubject());
    } catch (NumberFormatException ex) {
      throw new BadCredentialsException("Invalid token subject");
    }
  }
}
