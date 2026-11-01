package com.capstone.be.dto.common;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

/**
 * Chốt hình dạng JSON của ApiResponse.
 *
 * <p>Mục đích chính: chứng minh ApiResponse.page(...) sinh ra JSON GIỐNG HỆT
 * PagedResponse cũ, nên 39 endpoint đổi sang nó không làm vỡ frontend.
 */
class ApiResponseContractTest {

  private final ObjectMapper mapper = new ObjectMapper().registerModule(new JavaTimeModule());

  private JsonNode json(Object o) throws Exception {
    return mapper.readTree(mapper.writeValueAsString(o));
  }

  @Test
  @DisplayName("Phân trang: data là mảng, pageInfo ở cấp ngoài — giống PagedResponse cũ")
  void pagedShapeMatchesOldPagedResponse() throws Exception {
    var page = new PageImpl<>(List.of("a", "b"), PageRequest.of(1, 2), 7);

    JsonNode n = json(ApiResponse.page(page));

    assertThat(n.get("success").asBoolean()).isTrue();
    assertThat(n.get("data").isArray()).isTrue();
    assertThat(n.get("data")).hasSize(2);
    assertThat(n.get("data").get(0).asText()).isEqualTo("a");

    JsonNode p = n.get("pageInfo");
    assertThat(p).isNotNull();
    assertThat(p.get("page").asInt()).isEqualTo(1);
    assertThat(p.get("size").asInt()).isEqualTo(2);
    assertThat(p.get("totalElements").asLong()).isEqualTo(7);
    assertThat(p.get("totalPages").asInt()).isEqualTo(4);
    assertThat(p.get("first").asBoolean()).isFalse();
    assertThat(p.get("last").asBoolean()).isFalse();
    assertThat(p.get("hasNext").asBoolean()).isTrue();
    assertThat(p.get("hasPrevious").asBoolean()).isTrue();

    assertThat(n.has("timestamp")).isTrue();
    // Không rò field của Spring Data Page ra ngoài
    assertThat(n.has("content")).isFalse();
    assertThat(n.has("pageable")).isFalse();
    assertThat(n.has("numberOfElements")).isFalse();
  }

  @Test
  @DisplayName("Không phân trang: không có pageInfo, không có errorCode")
  void successShapeOmitsOptionalFields() throws Exception {
    JsonNode n = json(ApiResponse.success(Map.of("id", "x1")));

    assertThat(n.get("success").asBoolean()).isTrue();
    assertThat(n.get("data").get("id").asText()).isEqualTo("x1");
    assertThat(n.has("pageInfo")).isFalse();
    assertThat(n.has("errorCode")).isFalse();
    assertThat(n.has("fieldErrors")).isFalse();
    assertThat(n.has("message")).isFalse();
  }

  @Test
  @DisplayName("Lỗi: errorCode ở cấp ngoài, KHÔNG nằm trong data")
  void errorShapeHasTopLevelErrorCode() throws Exception {
    JsonNode n = json(ApiResponse.failure("Document not found", "3001"));

    assertThat(n.get("success").asBoolean()).isFalse();
    assertThat(n.get("message").asText()).isEqualTo("Document not found");
    assertThat(n.get("errorCode").asText()).isEqualTo("3001");
    // Trước đây mã lỗi bị nhét vào data dưới dạng {"errorCode": "..."}
    assertThat(n.has("data")).isFalse();
  }

  @Test
  @DisplayName("Lỗi validation: fieldErrors ở cấp ngoài")
  void validationShapeHasFieldErrors() throws Exception {
    JsonNode n = json(
        ApiResponse.failure("Validation error", "1002", Map.of("email", "không hợp lệ")));

    assertThat(n.get("success").asBoolean()).isFalse();
    assertThat(n.get("errorCode").asText()).isEqualTo("1002");
    assertThat(n.get("fieldErrors").get("email").asText()).isEqualTo("không hợp lệ");
  }

  @Test
  @DisplayName("Trang rỗng vẫn có data là mảng rỗng, không phải null")
  void emptyPageStillHasArray() throws Exception {
    var page = new PageImpl<String>(List.of(), PageRequest.of(0, 10), 0);

    JsonNode n = json(ApiResponse.page(page));

    assertThat(n.get("data").isArray()).isTrue();
    assertThat(n.get("data")).isEmpty();
    assertThat(n.get("pageInfo").get("totalElements").asLong()).isZero();
  }

  @Test
  @DisplayName("Chỉ có message, không có data")
  void messageOnlyShape() throws Exception {
    JsonNode n = json(ApiResponse.success("Đã xoá"));

    assertThat(n.get("success").asBoolean()).isTrue();
    assertThat(n.get("message").asText()).isEqualTo("Đã xoá");
    assertThat(n.has("data")).isFalse();
  }
}
