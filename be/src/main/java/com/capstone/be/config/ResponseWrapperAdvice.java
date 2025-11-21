package com.capstone.be.config;

import com.capstone.be.config.annotation.NoResponseWrapping;
import com.capstone.be.dto.common.ApiResponse;
import com.capstone.be.dto.common.PagedResponse;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

/**
 * Automatically wraps all controller responses in ApiResponse format unless:
 * 1. Already wrapped (ApiResponse or PagedResponse)
 * 2. Annotated with @NoResponseWrapping
 * 3. Error response (ProblemDetail)
 * 4. Non-JSON content (files, streams, etc.)
 * 5. Swagger/OpenAPI endpoints
 */
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

    // Skip if already wrapped
    if (body instanceof ApiResponse<?> || body instanceof PagedResponse<?>) {
      return body;
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
