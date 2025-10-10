package com.capstone.be.controller;

import com.capstone.be.domain.entity.Reader;
import com.capstone.be.dto.base.ApiResponse;
import com.capstone.be.dto.request.ReaderRegisterRequest;
import com.capstone.be.service.ReaderService;
import jakarta.validation.Valid;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  @Autowired
  ReaderService readerService;

  //SAMPLE API
  @GetMapping("/hello")
  public ApiResponse<String> Hello() {
    return ApiResponse.ok("Hello", "success", "hello/auth");
  }

  @GetMapping("/hello1")
  public String Hello1() {
    return "Hello 1";
  }

  //  @PostMapping("/register")
  @PostMapping("/reader/register")
  public ApiResponse<Reader> readerRegister(
      @Valid @RequestBody ReaderRegisterRequest request) {

    Reader newReader = readerService.register(request);
    return ApiResponse.created(newReader, "/reader/register");
  }

}
