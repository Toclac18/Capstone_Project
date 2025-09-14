package com.capstone.be.security;

import com.capstone.be.user.User;
import com.capstone.be.user.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.time.Instant;
import java.util.HashMap;

@Component
public class OAuth2SuccessHandler implements org.springframework.security.web.authentication.AuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtUtils jwtUtils;

    @Value("${app.oauth2.authorizedRedirectUri}")
    private String redirectUri;

    public OAuth2SuccessHandler(UserRepository userRepository, JwtUtils jwtUtils) {
        this.userRepository = userRepository;
        this.jwtUtils = jwtUtils;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException {
        if (!(authentication instanceof OAuth2AuthenticationToken token)) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Invalid auth type");
            return;
        }
        OAuth2User oauthUser = token.getPrincipal();
        String email = oauthUser.getAttribute("email");
        if (email == null) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Email not provided by provider");
            return;
        }

        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User u = User.builder()
                    .email(email)
                    .password("{noop}oauth2-user")
                    .provider(User.Provider.GOOGLE)
                    .enabled(true)
                    .createdAt(Instant.now())
                    .build();
            return userRepository.save(u);
        });

        var claims = new HashMap<String, Object>();
        claims.put("provider", user.getProvider().name());
        String jwt = jwtUtils.generateToken(user.getEmail(), claims);

        String target = UriComponentsBuilder.fromUriString(redirectUri)
                .queryParam("token", jwt)
                .build().toUriString();
        response.sendRedirect(target);
    }
}