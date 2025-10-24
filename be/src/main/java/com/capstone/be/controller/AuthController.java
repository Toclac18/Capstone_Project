package com.capstone.be.controller;

import com.capstone.be.domain.entity.Reader;
import com.capstone.be.dto.request.auth.ChangePasswordRequest;
import com.capstone.be.dto.request.auth.LoginRequest;
import com.capstone.be.dto.request.auth.ReaderRegisterRequest;
import com.capstone.be.dto.response.auth.LoginResponse;
import com.capstone.be.security.model.UserPrincipal;
import com.capstone.be.service.AuthService;
import com.capstone.be.service.ReaderService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  @Autowired
  ReaderService readerService;

  @Autowired
  AuthService authService;

  //SAMPLE API
  @GetMapping("/hello")
  public String Hello() {
    return "Hello world!";
  }

  @PostMapping("/reader/register")
  public Reader readerRegister(
      @Valid @RequestBody ReaderRegisterRequest request) {
    return readerService.register(request);
  }

  @GetMapping("/reader/verify-email")
  public String verifyReaderEmail(@RequestParam("token") String token) {
    readerService.verifyEmail(token);
    return "Email has been verified successfully";
  }

  @PostMapping("/login")
  public LoginResponse login(@Valid @RequestBody LoginRequest request) {
    return authService.login(request);
  }

  @PostMapping("/change-password")
  @PreAuthorize("isAuthenticated()")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void changePassword(@Valid @RequestBody ChangePasswordRequest request,
      @AuthenticationPrincipal UserPrincipal principal) {
    authService.changePassword(principal.getId(), principal.getRole(), request);
  }

}
