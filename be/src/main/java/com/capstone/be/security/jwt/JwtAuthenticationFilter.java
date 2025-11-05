package com.capstone.be.security.jwt;

import com.capstone.be.security.config.SecurityConfig;
import com.capstone.be.security.service.JwtService;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

  private static final String BEARER_PREFIX = "Bearer ";

  private final JwtService jwtService;

  private final AntPathMatcher pathMatcher = new AntPathMatcher();

  public JwtAuthenticationFilter(JwtService jwtService) {
    this.jwtService = jwtService;
  }

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
      return true;
    }
    String path = request.getRequestURI();
    // Sử dụng danh sách public endpoints từ SecurityConfig
    for (String pattern : SecurityConfig.getPublicEndpoints()) {
      if (pathMatcher.match(pattern, path)) {
        return true;
      }
    }
    return false;
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {

    String header = request.getHeader(HttpHeaders.AUTHORIZATION);

    if (header == null
        || !header.startsWith(BEARER_PREFIX)
        || !(header.length() > BEARER_PREFIX.length())) {
      sendUnauthorized(response, "JwtFilter: Invalid Token or required"); // #dev
      return;
    }

    String token = header.substring(BEARER_PREFIX.length()).trim();

    if (SecurityContextHolder.getContext().getAuthentication() == null) {
      try {
        Authentication authentication = jwtService.buildAuthentication(token);
        SecurityContextHolder.getContext().setAuthentication(authentication);
      } catch (JwtException | IllegalArgumentException | UsernameNotFoundException ex) {
        sendUnauthorized(response, "Invalid or expired token");
        return;
      } catch (BadCredentialsException ex) {
        sendUnauthorized(response, "Invalid token");
        return;
      } catch (LockedException ex) {
        sendUnauthorized(response, "Account is banned");
        return;
      } catch (DisabledException ex) {
        sendUnauthorized(response, "Account is disabled");
        return;
      }
    }

    filterChain.doFilter(request, response);
  }

  private void sendUnauthorized(HttpServletResponse response, String message) throws IOException {
    if (!response.isCommitted()) {
      response.resetBuffer();
      response.setStatus(HttpStatus.UNAUTHORIZED.value());
      response.setContentType("application/json");
      String safeMessage = message.replace("\"", "\\\"");
      response.getWriter().write("{\"message\":\"" + safeMessage + "\"}");
      response.flushBuffer();
    }
  }
}
