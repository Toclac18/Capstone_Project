package com.capstone.be.service;

import java.time.OffsetDateTime;

public interface InvitationVerifyService {
    /**
     * @return true nếu user đã tồn tại; false nếu chưa (để controller quyết định redirect)
     */
    boolean handleVerification(String orgId, String email, String token, OffsetDateTime verifiedAt);
}
