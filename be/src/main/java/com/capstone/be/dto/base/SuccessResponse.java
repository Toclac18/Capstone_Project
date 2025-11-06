package com.capstone.be.dto.base;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record SuccessResponse<T>(T data, PageMeta meta // For Paging
) {

    public static <T> SuccessResponse<T> of(T data) {
        return new SuccessResponse<>(data, null);
    }

    public static <T> SuccessResponse<T> of(T data, PageMeta meta) {
        return new SuccessResponse<>(data, meta);
    }
}
