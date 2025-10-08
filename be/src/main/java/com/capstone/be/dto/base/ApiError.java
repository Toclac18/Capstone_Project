package com.capstone.be.dto.base;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiError(
    int status,
    String error,
    String details,
    List<FieldViolation> violations
) {

}