package com.capstone.be.config;

import com.capstone.be.config.annotation.NoResponseWrapping;
import com.capstone.be.dto.common.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.MethodParameter;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

/**
 * Bọc response của controller vào {@link ApiResponse} — hình dạng duy nhất của API.
 *
 * <p>Để nguyên khi: đã là {@code ApiResponse}; có {@code @NoResponseWrapping};
 * là {@code ProblemDetail}; không phải JSON; hoặc là endpoint Swagger.
 *
 * <p>{@code Page<T>} thô thì KHÔNG để nguyên nữa mà bọc qua
 * {@link ApiResponse#page} và ghi log cảnh báo — trước đây advice bỏ qua nó,
 * nên hình dạng phân trang của Spring Data lọt thẳng ra API.
 */
@Slf4j
@ControllerAdvice
public class ResponseWrapperAdvice implements ResponseBodyAdvice<Object> {

  @Override
  public boolean supports(MethodParameter returnType,
      Class<? extends HttpMessageConverter<?>> converterType) {

    // Only apply to JSON responses
    if (!MappingJackson2HttpMessageConverter.class.isAssignableFrom(converterType)) {
      return false;
    }

    // Check if method or class has @NoResponseWrapping annotation
    return !returnType.hasMethodAnnotation(NoResponseWrapping.class) &&
        (!returnType.getDeclaringClass().isAnnotationPresent(NoResponseWrapping.class));
  }

  @Override
  public Object beforeBodyWrite(Object body,
      MethodParameter returnType,
      MediaType selectedContentType,
      Class<? extends HttpMessageConverter<?>> selectedConverterType,
      ServerHttpRequest request,
      ServerHttpResponse response) {

    // Đã bọc rồi thì để nguyên
    if (body instanceof ApiResponse<?>) {
      return body;
    }

    // Page<T> thô là một trong ba hình dạng mà Phase 1 xoá bỏ: JSON của nó
    // (content, pageable, totalElements…) khác hoàn toàn ApiResponse, nên frontend
    // phải đoán. Trước đây advice này BỎ QUA Page<?> và để nó lọt ra ngoài.
    // Giờ bọc lại, để dù controller nào sót cũng không rò hình dạng cũ ra API.
    if (body instanceof Page<?> page) {
      log.warn("Controller trả Page<T> thô — hãy dùng ApiResponse.page(...). Đường dẫn: {}",
          request.getURI().getPath());
      return ApiResponse.page(page);
    }

    // Skip error responses (handled by GlobalExceptionHandler)
    if (body instanceof ProblemDetail) {
      return body;
    }

    // Skip Swagger/OpenAPI responses
    String path = request.getURI().getPath();
    if (path.contains("/v3/api-docs") || path.contains("/swagger-ui")) {
      return body;
    }

    // Skip non-JSON content types
    if (selectedContentType != null &&
        !selectedContentType.includes(MediaType.APPLICATION_JSON)) {
      return body;
    }

    // Wrap the response
    return ApiResponse.success(body);
  }
}
