package com.capstone.be.mock;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class TestVerifyController {
    @GetMapping("/test-verify")
    public Map<String, String> verify(@RequestParam String token) {
        if (token.startsWith("ey")) {
            return Map.of("message", "Token valid: invitation verified successfully!");
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid token");
        }
    }
}