package com.capstone.be.security.config;

import com.capstone.be.security.jwt.JwtAuthenticationFilter;
import com.capstone.be.security.webhook.AiWebhookSignatureFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.firewall.HttpFirewall;
import org.springframework.security.web.firewall.StrictHttpFirewall;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

  @Bean
  public HttpFirewall allowAsyncDispatch() {
    StrictHttpFirewall firewall = new StrictHttpFirewall();
    firewall.setAllowSemicolon(true);
    return firewall;
  }

  private final JwtAuthenticationFilter jwtAuthenticationFilter;
  private final UserDetailsService userDetailsService;
  private final PasswordEncoder passwordEncoder;

  @Bean
  public DaoAuthenticationProvider authenticationProvider() {
    DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
    authProvider.setUserDetailsService(userDetailsService);
    authProvider.setPasswordEncoder(passwordEncoder);
    return authProvider;
  }

  @Bean
  public AuthenticationManager authenticationManager(AuthenticationConfiguration config)
      throws Exception {
    return config.getAuthenticationManager();
  }

  @Bean
  public SecurityFilterChain filterChain(
      HttpSecurity http,
      @Value("${app.ai.webhook.secret:}") String aiWebhookSecret,
      @Value("${app.ai.webhook.toleranceSeconds:300}") long aiWebhookToleranceSeconds)
      throws Exception {

    // Đăng ký trực tiếp trong chain (không @Component) để filter chạy SAU
    // SecurityContextHolderFilter — đặt Authentication trước đó sẽ bị ghi đè.
    AiWebhookSignatureFilter aiWebhookSignatureFilter =
        new AiWebhookSignatureFilter(aiWebhookSecret, aiWebhookToleranceSeconds);

    http
        .csrf(AbstractHttpConfigurer::disable)
        .cors(AbstractHttpConfigurer::disable)
        .sessionManagement(session ->
            session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
        )
        .securityContext(context -> context.requireExplicitSave(false))
        .authorizeHttpRequests(auth -> auth
            // Public endpoints
            .requestMatchers(
                "/documents/homepage/**",
                "/documents/search/**",
                "/documents/search-meta/**",
                "/auth/**",
                "/statistics/homepage/**", // Public endpoints for trending documents and reviewers
                "/policies/active", // Public endpoint for viewing active policy (for sign up)

                "/v3/api-docs/**",
                "/swagger-ui/**",
                "/swagger-ui.html",

                "/public/**",
                "/contact-tickets/**", // Public endpoint for ticket creation, auth handled in controller
                "/error", // Error page
                "/api/error" // API error page
            ).permitAll()
            // Callback từ AI service: xác thực bằng HMAC trong AiWebhookSignatureFilter,
            // filter đó cấp quyền ROLE_AI_SERVICE khi chữ ký hợp lệ.
            .requestMatchers("/v1/ai/webhook").hasRole(AiWebhookSignatureFilter.ROLE)
            // All other requests need authentication
            .anyRequest().authenticated()
        )
        .authenticationProvider(authenticationProvider())
        .addFilterBefore(aiWebhookSignatureFilter, UsernamePasswordAuthenticationFilter.class)
        .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

    return http.build();
  }
}
