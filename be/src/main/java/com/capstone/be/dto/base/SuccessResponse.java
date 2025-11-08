package com.capstone.be.dto.base;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record SuccessResponse<T>(
    String message,
    T data
) {

  public static <T> SuccessResponse<T> of(T data) {
    return new SuccessResponse<>(null, data);
  }

  public static <Void> SuccessResponse<Void> ofMessage(String message) {
    return new SuccessResponse<>(message, null);
  }
}
