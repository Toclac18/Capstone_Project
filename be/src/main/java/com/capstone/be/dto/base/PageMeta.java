package com.capstone.be.dto.base;

public record PageMeta(
    long totalElements,
    int totalPages,
    int page,
    int size,
    boolean first,
    boolean last
) {

}