package com.capstone.be.security.webhook;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.servlet.http.HttpServletResponse;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

class AiWebhookSignatureFilterTest {

  private static final String SECRET = "test-secret-do-not-use";
  private static final String URI = "/api/v1/ai/webhook";
  private static final String BODY = "{\"job_id\":\"job-abc\",\"status\":\"completed\"}";

  @AfterEach
  void clearContext() {
    SecurityContextHolder.clearContext();
  }

  /**
   * Vector sinh bởi Python (hmac/hashlib) ở phía AI service. Nếu test này đỏ thì hai đầu
   * đã lệch thuật toán — không phải lỗi của riêng Java.
   */
  @Test
  @DisplayName("HMAC khớp với vector sinh từ phía Python")
  void matchesPythonVector() throws Exception {
    String expected = "3d2afbed3d54973fb5f4167d37e26008c55f96138a07fe13dc485295d374fc90";

    Mac mac = Mac.getInstance("HmacSHA256");
    mac.init(new SecretKeySpec(SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
    byte[] digest = mac.doFinal(("1700000000." + BODY).getBytes(StandardCharsets.UTF_8));

    StringBuilder hex = new StringBuilder();
    for (byte b : digest) {
      hex.append(String.format("%02x", b));
    }
    assertThat(hex.toString()).isEqualTo(expected);
  }

  @Test
  @DisplayName("Chữ ký hợp lệ: cấp ROLE_AI_SERVICE và chuyển tiếp request")
  void acceptsValidSignature() throws Exception {
    long now = Instant.now().getEpochSecond();
    MockHttpServletRequest request = signedRequest(String.valueOf(now), sign(now, BODY), BODY);
    MockHttpServletResponse response = new MockHttpServletResponse();
    MockFilterChain chain = new MockFilterChain();

    filter().doFilter(request, response, chain);

    assertThat(response.getStatus()).isEqualTo(HttpServletResponse.SC_OK);
    assertThat(chain.getRequest()).isNotNull();
    assertThat(SecurityContextHolder.getContext().getAuthentication().getAuthorities())
        .extracting(Object::toString)
        .containsExactly("ROLE_AI_SERVICE");
  }

  @Test
  @DisplayName("Body vẫn đọc được sau khi filter đã đọc để verify")
  void bodyRemainsReadableDownstream() throws Exception {
    long now = Instant.now().getEpochSecond();
    MockHttpServletRequest request = signedRequest(String.valueOf(now), sign(now, BODY), BODY);
    MockFilterChain chain = new MockFilterChain();

    filter().doFilter(request, new MockHttpServletResponse(), chain);

    String downstream = new String(
        chain.getRequest().getInputStream().readAllBytes(), StandardCharsets.UTF_8);
    assertThat(downstream).isEqualTo(BODY);
  }

  @Test
  @DisplayName("Chữ ký sai: 401, không chuyển tiếp, không có Authentication")
  void rejectsWrongSignature() throws Exception {
    long now = Instant.now().getEpochSecond();
    MockHttpServletRequest request = signedRequest(
        String.valueOf(now), "sha256=" + "0".repeat(64), BODY);
    MockHttpServletResponse response = new MockHttpServletResponse();
    MockFilterChain chain = new MockFilterChain();

    filter().doFilter(request, response, chain);

    assertThat(response.getStatus()).isEqualTo(HttpServletResponse.SC_UNAUTHORIZED);
    assertThat(chain.getRequest()).isNull();
    assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
  }

  @Test
  @DisplayName("Body bị sửa sau khi ký: 401")
  void rejectsTamperedBody() throws Exception {
    long now = Instant.now().getEpochSecond();
    String tampered = "{\"job_id\":\"job-abc\",\"status\":\"failed\"}";
    MockHttpServletRequest request =
        signedRequest(String.valueOf(now), sign(now, BODY), tampered);
    MockHttpServletResponse response = new MockHttpServletResponse();
    MockFilterChain chain = new MockFilterChain();

    filter().doFilter(request, response, chain);

    assertThat(response.getStatus()).isEqualTo(HttpServletResponse.SC_UNAUTHORIZED);
    assertThat(chain.getRequest()).isNull();
  }

  @Test
  @DisplayName("Timestamp quá cũ: 401, chữ ký cũ không dùng lại được")
  void rejectsStaleTimestamp() throws Exception {
    long stale = Instant.now().getEpochSecond() - 1_000;
    MockHttpServletRequest request =
        signedRequest(String.valueOf(stale), sign(stale, BODY), BODY);
    MockHttpServletResponse response = new MockHttpServletResponse();
    MockFilterChain chain = new MockFilterChain();

    filter().doFilter(request, response, chain);

    assertThat(response.getStatus()).isEqualTo(HttpServletResponse.SC_UNAUTHORIZED);
    assertThat(chain.getRequest()).isNull();
  }

  @Test
  @DisplayName("Thiếu header chữ ký: 401")
  void rejectsMissingHeaders() throws Exception {
    MockHttpServletRequest request = new MockHttpServletRequest("POST", URI);
    request.setContent(BODY.getBytes(StandardCharsets.UTF_8));
    MockHttpServletResponse response = new MockHttpServletResponse();
    MockFilterChain chain = new MockFilterChain();

    filter().doFilter(request, response, chain);

    assertThat(response.getStatus()).isEqualTo(HttpServletResponse.SC_UNAUTHORIZED);
    assertThat(chain.getRequest()).isNull();
  }

  @Test
  @DisplayName("Backend chưa cấu hình secret: fail closed, không mở cửa")
  void rejectsWhenSecretNotConfigured() throws Exception {
    long now = Instant.now().getEpochSecond();
    MockHttpServletRequest request = signedRequest(String.valueOf(now), sign(now, BODY), BODY);
    MockHttpServletResponse response = new MockHttpServletResponse();
    MockFilterChain chain = new MockFilterChain();

    new AiWebhookSignatureFilter("", 300).doFilter(request, response, chain);

    assertThat(response.getStatus()).isEqualTo(HttpServletResponse.SC_UNAUTHORIZED);
    assertThat(chain.getRequest()).isNull();
  }

  @Test
  @DisplayName("Đường dẫn khác: filter không can thiệp")
  void ignoresOtherPaths() throws Exception {
    MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/documents");
    MockHttpServletResponse response = new MockHttpServletResponse();
    MockFilterChain chain = new MockFilterChain();

    filter().doFilter(request, response, chain);

    assertThat(chain.getRequest()).isNotNull();
    assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
  }

  // ── helpers ──

  private AiWebhookSignatureFilter filter() {
    return new AiWebhookSignatureFilter(SECRET, 300);
  }

  private MockHttpServletRequest signedRequest(String timestamp, String signature, String body) {
    MockHttpServletRequest request = new MockHttpServletRequest("POST", URI);
    request.setContentType("application/json");
    request.setContent(body.getBytes(StandardCharsets.UTF_8));
    request.addHeader("X-Readee-Timestamp", timestamp);
    request.addHeader("X-Readee-Signature", signature);
    return request;
  }

  private String sign(long timestamp, String body) throws Exception {
    Mac mac = Mac.getInstance("HmacSHA256");
    mac.init(new SecretKeySpec(SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
    byte[] digest = mac.doFinal((timestamp + "." + body).getBytes(StandardCharsets.UTF_8));
    StringBuilder hex = new StringBuilder();
    for (byte b : digest) {
      hex.append(String.format("%02x", b));
    }
    return "sha256=" + hex;
  }
}
