package com.capstone.be.controller;

import com.capstone.be.dto.base.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  //SAMPLE API
  @GetMapping("/hello")
  public ApiResponse<String> Hello() {
    return ApiResponse.ok("Hello", "success", "hello/auth");
  }

  @GetMapping("/hello1")
  public String Hello1() {
    return "Hello 1";
  }

}
