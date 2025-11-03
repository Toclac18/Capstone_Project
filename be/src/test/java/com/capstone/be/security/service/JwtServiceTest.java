package com.capstone.be.security.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.capstone.be.domain.entity.Reader;
import com.capstone.be.domain.enums.ReaderStatus;
import com.capstone.be.domain.enums.UserRole;
import com.capstone.be.security.model.UserPrincipal;
import com.capstone.be.security.util.JwtUtil;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

@ExtendWith(MockitoExtension.class)
class JwtServiceTest {

  @Mock
  private JwtUtil jwtUtil;
  @Mock
  private AccountDetailsService accountDetailsService;

  private JwtService jwtService;

  @BeforeEach
  void setUp() {
    jwtService = new JwtService(jwtUtil, accountDetailsService);
  }

  @Test
  void generateToken_delegatesToUtil() {
    UUID subjectId = UUID.randomUUID();
    when(jwtUtil.generateToken(subjectId, UserRole.READER, "user@example.com")).thenReturn("token");

    String token = jwtService.generateToken(subjectId, UserRole.READER, "user@example.com");

    assertEquals("token", token);
    verify(jwtUtil).generateToken(subjectId, UserRole.READER, "user@example.com");
  }

  @Test
  void getExpirationMs_delegatesToUtil() {
    when(jwtUtil.getExpirationMs()).thenReturn(1234L);

    assertEquals(1234L, jwtService.getExpirationMs());
    verify(jwtUtil).getExpirationMs();
  }

  @Test
  void buildAuthentication_returnsUsernamePasswordToken() {
    String token = "jwt-token";
    UUID subjectId = UUID.randomUUID();
    Claims claims = Jwts.claims().setSubject(subjectId.toString());

    when(jwtUtil.parseClaims(token)).thenReturn(claims);
    when(jwtUtil.extractRole(claims)).thenReturn(UserRole.READER);

    Reader reader = new Reader();
    reader.setId(subjectId);
    reader.setEmail("reader@example.com");
    reader.setUsername("reader");
    reader.setPasswordHash("hash");
    reader.setStatus(ReaderStatus.PENDING_VERIFICATION);

    UserPrincipal principal = UserPrincipal.fromReader(reader);
    when(accountDetailsService.loadPrincipal(UserRole.READER, subjectId)).thenReturn(principal);

    Authentication authentication = jwtService.buildAuthentication(token);

    assertEquals(UsernamePasswordAuthenticationToken.class, authentication.getClass());
    assertSame(principal, authentication.getPrincipal());
    assertEquals(token, authentication.getCredentials());
    assertEquals(principal.getAuthorities(), authentication.getAuthorities());
  }

  @Test
  void buildAuthentication_invalidSubjectThrows() {
    String token = "jwt-token";
    Claims claims = Jwts.claims().setSubject("not-a-number");

    when(jwtUtil.parseClaims(token)).thenReturn(claims);

    assertThrows(IllegalArgumentException.class, () -> jwtService.buildAuthentication(token));
    verify(accountDetailsService, never()).loadPrincipal(any(), any());
  }
}
