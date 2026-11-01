package com.capstone.be.security.webhook;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.List;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StreamUtils;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Xác thực callback từ AI service bằng HMAC-SHA256 trên raw body.
 *
 * <p>AI service gửi kèm hai header:
 * <pre>
 *   X-Readee-Timestamp: &lt;unix seconds&gt;
 *   X-Readee-Signature: sha256=&lt;hex HMAC_SHA256(secret, "{timestamp}.{raw_body}")&gt;
 * </pre>
 *
 * <p>Timestamp nằm trong chuỗi được ký để chữ ký không dùng lại được sau khi hết hạn.
 *
 * <p>Fail closed: thiếu secret, thiếu header, lệch thời gian hay sai chữ ký đều trả 401
 * và không đặt Authentication, nên {@code hasRole('AI_SERVICE')} trong SecurityConfig
 * từ chối request. Trước đây endpoint này nằm trong {@code permitAll()}.
 */
@Slf4j
public class AiWebhookSignatureFilter extends OncePerRequestFilter {

  public static final String ROLE = "AI_SERVICE";

  private static final String PATH_SUFFIX = "/v1/ai/webhook";
  private static final String TIMESTAMP_HEADER = "X-Readee-Timestamp";
  private static final String SIGNATURE_HEADER = "X-Readee-Signature";
  private static final String SIGNATURE_PREFIX = "sha256=";
  private static final String HMAC_ALGORITHM = "HmacSHA256";

  private final String secret;
  private final long toleranceSeconds;

  public AiWebhookSignatureFilter(String secret, long toleranceSeconds) {
    this.secret = secret == null ? "" : secret.trim();
    this.toleranceSeconds = toleranceSeconds;
    if (this.secret.isEmpty()) {
      log.warn("AI_WEBHOOK_SECRET chưa được cấu hình — mọi callback từ AI service sẽ bị từ chối "
          + "(401). Đặt biến này ở cả BE và AI service rồi khởi động lại.");
    }
  }

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    String uri = request.getRequestURI();
    return uri == null || !uri.endsWith(PATH_SUFFIX);
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain chain)
      throws ServletException, IOException {

    byte[] body = StreamUtils.copyToByteArray(request.getInputStream());

    String rejection = verify(request, body);
    if (rejection != null) {
      log.warn("Từ chối callback AI từ {}: {}", request.getRemoteAddr(), rejection);
      reject(response, rejection);
      return;
    }

    UsernamePasswordAuthenticationToken authentication =
        new UsernamePasswordAuthenticationToken(
            "ai-service", null, List.of(new SimpleGrantedAuthority("ROLE_" + ROLE)));
    SecurityContextHolder.getContext().setAuthentication(authentication);

    chain.doFilter(new CachedBodyHttpServletRequest(request, body), response);
  }

  /** @return null nếu hợp lệ, ngược lại là lý do từ chối (không lộ chi tiết cho client). */
  private String verify(HttpServletRequest request, byte[] body) {
    if (secret.isEmpty()) {
      return "secret chưa được cấu hình ở backend";
    }

    String timestamp = request.getHeader(TIMESTAMP_HEADER);
    String signature = request.getHeader(SIGNATURE_HEADER);

    if (timestamp == null || timestamp.isBlank()) {
      return "thiếu header " + TIMESTAMP_HEADER;
    }
    if (signature == null || !signature.startsWith(SIGNATURE_PREFIX)) {
      return "thiếu hoặc sai định dạng header " + SIGNATURE_HEADER;
    }

    long sentAt;
    try {
      sentAt = Long.parseLong(timestamp.trim());
    } catch (NumberFormatException e) {
      return TIMESTAMP_HEADER + " không phải unix seconds";
    }

    long drift = Math.abs(Instant.now().getEpochSecond() - sentAt);
    if (drift > toleranceSeconds) {
      return "timestamp lệch " + drift + "s, vượt ngưỡng " + toleranceSeconds + "s";
    }

    String expected = hmacHex(timestamp.trim() + "." + new String(body, StandardCharsets.UTF_8));
    String provided = signature.substring(SIGNATURE_PREFIX.length()).trim();

    boolean matches = MessageDigest.isEqual(
        expected.getBytes(StandardCharsets.UTF_8), provided.getBytes(StandardCharsets.UTF_8));

    return matches ? null : "chữ ký không khớp";
  }

  private String hmacHex(String payload) {
    try {
      Mac mac = Mac.getInstance(HMAC_ALGORITHM);
      mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM));
      byte[] digest = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
      StringBuilder hex = new StringBuilder(digest.length * 2);
      for (byte b : digest) {
        hex.append(String.format("%02x", b));
      }
      return hex.toString();
    } catch (Exception e) {
      throw new IllegalStateException("Không tính được HMAC cho webhook", e);
    }
  }

  private void reject(HttpServletResponse response, String reason) throws IOException {
    SecurityContextHolder.clearContext();
    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
    response.setCharacterEncoding(StandardCharsets.UTF_8.name());
    response.getWriter().write(
        "{\"success\":false,\"message\":\"Webhook signature verification failed\"}");
    log.debug("Chi tiết từ chối: {}", reason);
  }
}
