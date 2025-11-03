package com.capstone.be.dto.request.orgAdmin;

import lombok.Data;

import java.util.UUID;

@Data
public class ChangeAccessRequest {
    private UUID userId;
    private boolean enable;
}
