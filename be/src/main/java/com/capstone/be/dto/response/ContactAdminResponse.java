package com.capstone.be.dto.response;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ContactAdminResponse {
    private String ticketId;
    private String ticketCode;
    private String status;
    private String message;
}