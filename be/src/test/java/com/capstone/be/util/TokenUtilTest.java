package com.capstone.be.util;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashSet;
import java.util.Set;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Token đặt lại mật khẩu và cách băm nó.
 *
 * <p>{@code sha256Hex} là thứ thay cho bcrypt ở đường tra token, nên tính chất quan
 * trọng nhất là nó TIỀN ĐỊNH: cùng token phải cho cùng chuỗi, nếu không thì lại không
 * tra được bằng truy vấn — đúng vấn đề của bcrypt.
 */
class TokenUtilTest {

  @Test
  @DisplayName("sha256Hex tiền định: băm hai lần cùng một token ra cùng kết quả")
  void sha256IsDeterministic() {
    String token = TokenUtil.generateResetToken();
    assertThat(TokenUtil.sha256Hex(token)).isEqualTo(TokenUtil.sha256Hex(token));
  }

  @Test
  @DisplayName("sha256Hex khớp giá trị chuẩn")
  void sha256MatchesKnownVector() {
    // Vector chuẩn của SHA-256("abc") — chốt rằng cách ghi hex không bị sai
    // (thiếu số 0 ở đầu byte là lỗi kinh điển của vòng lặp tự viết).
    assertThat(TokenUtil.sha256Hex("abc"))
        .isEqualTo("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  }

  @Test
  @DisplayName("sha256Hex luôn 64 ký tự hex thường, kể cả khi có byte đầu là 0")
  void sha256IsAlwaysSixtyFourHexChars() {
    // "" có digest bắt đầu bằng 0xe3; thử thêm vài chuỗi để chạm nhiều byte nhỏ.
    for (String input : new String[] {"", "a", "0", "x".repeat(1000), "tiếng Việt có dấu"}) {
      assertThat(TokenUtil.sha256Hex(input))
          .as("input=%s", input)
          .hasSize(64)
          .matches("[0-9a-f]{64}");
    }
  }

  @Test
  @DisplayName("Token khác nhau cho hash khác nhau")
  void differentTokensHashDifferently() {
    assertThat(TokenUtil.sha256Hex("token-a")).isNotEqualTo(TokenUtil.sha256Hex("token-b"));
  }

  @Test
  @DisplayName("generateResetToken: 64 ký tự base64url, không trùng nhau")
  void generatedTokensAreLongAndUnique() {
    Set<String> seen = new HashSet<>();
    for (int i = 0; i < 1000; i++) {
      String token = TokenUtil.generateResetToken();
      // 48 byte -> 64 ký tự base64url không padding
      assertThat(token).hasSize(64).matches("[A-Za-z0-9_-]{64}");
      assertThat(seen.add(token)).as("token trùng ở lần thứ %d", i).isTrue();
    }
  }

  @Test
  @DisplayName("Hash không để lộ token")
  void hashDoesNotContainTheToken() {
    String token = TokenUtil.generateResetToken();
    assertThat(TokenUtil.sha256Hex(token)).doesNotContain(token);
  }

  @Test
  @DisplayName("Hash vừa cột token_hash (length = 128)")
  void hashFitsTheColumn() {
    // PasswordResetToken.tokenHash khai @Column(length = 128). 64 ký tự thì vừa,
    // nhưng chốt lại để ai đổi sang thuật toán dài hơn thì thấy ngay.
    assertThat(TokenUtil.sha256Hex(TokenUtil.generateResetToken()).length())
        .isLessThanOrEqualTo(128);
  }
}
