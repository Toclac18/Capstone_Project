package com.capstone.be.dto.base;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record SuccessResponse<T>(
    String message,
    T data,
    PageMeta meta //For Paging
) {

  public static <T> SuccessResponse<T> of(T data) {
    return new SuccessResponse<>(null, data, null);
  }

  public static <T> SuccessResponse<T> of(T data, PageMeta meta) {
    return new SuccessResponse<>(null, data, meta);
  }

  public static <Void> SuccessResponse<Void> ofMessage(String message) {
    return new SuccessResponse<>(message, null, null);
  }


}
