package com.capstone.be.controller;

import com.capstone.be.security.util.JwtUtil;
import com.capstone.be.service.InvitationVerifyService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URI;
import java.time.OffsetDateTime;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/invitations")
@RequiredArgsConstructor
public class InvitationVerifyController {

  private static final String ORG_HOME_URL = "api/org/home";
  // Đích redirect khi user chưa có tài khoản
  private static final String REGISTER_URL = "api/auth/register";
  private final JwtUtil jwtUtil;
  private final InvitationVerifyService invitationVerifyService;

  private static String urlEncode(String s) {
    try {
      return java.net.URLEncoder.encode(s, java.nio.charset.StandardCharsets.UTF_8);
    } catch (Exception e) {
      return s;
    }
  }

  /**
   * Verify invitation token. - Nếu user tồn tại: join org -> 302 Redirect tới api/org/home - Nếu
   * user chưa tồn tại: 302 Redirect tới api/auth/register?email=...&orgId=...&token=...
   */
  @GetMapping("/verify")
  public ResponseEntity<?> verify(@RequestParam("token") String token, HttpServletResponse resp)
      throws IOException {
    Objects.requireNonNull(token, "token must not be null");
    try {
      Claims claims = jwtUtil.parseClaims(token);
      String email = claims.get("email", String.class);
      String orgId = claims.get("orgId", String.class);

      if (email == null || orgId == null) {
        return ResponseEntity.badRequest().body("Invalid token payload");
      }

      boolean userExists = invitationVerifyService.handleVerification(orgId, email, token,
          OffsetDateTime.now());

      if (userExists) {
        return ResponseEntity.status(302).location(URI.create(ORG_HOME_URL)).build();
      } else {
        String registerUrl = String.format("%s?email=%s&orgId=%s&token=%s",
            REGISTER_URL, urlEncode(email), urlEncode(orgId), urlEncode(token));
        return ResponseEntity.status(302).location(URI.create(registerUrl)).build();
      }

    } catch (ExpiredJwtException e) {
      return ResponseEntity.status(410).body("Invitation token expired");
    } catch (JwtException e) {
      return ResponseEntity.badRequest().body("Invalid invitation token");
    }
  }
}
