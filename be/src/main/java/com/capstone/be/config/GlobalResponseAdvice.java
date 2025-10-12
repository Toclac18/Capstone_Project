package com.capstone.be.config;

import com.capstone.be.dto.base.SuccessResponse;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.ByteArrayHttpMessageConverter;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.ResourceHttpMessageConverter;
import org.springframework.http.converter.ResourceRegionHttpMessageConverter;
import org.springframework.http.converter.StringHttpMessageConverter;
import org.springframework.http.converter.support.AllEncompassingFormHttpMessageConverter;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

@ControllerAdvice
public class GlobalResponseAdvice implements ResponseBodyAdvice<Object> {

  @Override
  public boolean supports(MethodParameter returnType,
      Class<? extends HttpMessageConverter<?>> converterType) {
    // Skip non-JSON converter
    if (StringHttpMessageConverter.class.isAssignableFrom(converterType)) {
      return false;
    }
    if (ByteArrayHttpMessageConverter.class.isAssignableFrom(converterType)) {
      return false;
    }
    if (ResourceHttpMessageConverter.class.isAssignableFrom(converterType)) {
      return false;
    }
    if (ResourceRegionHttpMessageConverter.class.isAssignableFrom(converterType)) {
      return false;
    }
    return !AllEncompassingFormHttpMessageConverter.class.isAssignableFrom(converterType);
  }

  @Override
  public Object beforeBodyWrite(Object body,
      MethodParameter returnType,
      MediaType selectedContentType,
      Class<? extends HttpMessageConverter<?>> selectedConverterType,
      ServerHttpRequest request,
      ServerHttpResponse response) {

    // Skip already-wrap
    if (body instanceof SuccessResponse<?> ||
        body instanceof ProblemDetail) {
      return body;
    }

    // Skip file/download (octet-stream), byte[]
    if (MediaType.APPLICATION_OCTET_STREAM.equals(selectedContentType) || body instanceof byte[]) {
      return body;
    }

    return SuccessResponse.of(body);
  }
}
