package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.Invitation;
import com.capstone.be.repository.InvitationRepository;
import com.capstone.be.repository.ReaderRepository;
import com.capstone.be.security.util.JwtUtil;
import com.capstone.be.service.InvitationVerifyService;
import com.capstone.be.service.OrganizationService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Optional;

/**
 * Verify invitation token:
 * - Xác thực/giải mã token bằng JwtUtil (issuer + chữ ký + hạn dùng "exp").
 * - Nếu reader tồn tại -> join org + đánh dấu invitation accepted.
 * - Nếu chưa -> chỉ ghi nhận verifiedAt; controller sẽ redirect tới trang đăng ký.
 */
@Service
@RequiredArgsConstructor
public class InvitationVerifyServiceImpl implements InvitationVerifyService {

    private final InvitationRepository invitationRepository;
    private final ReaderRepository readerRepository;
    private final OrganizationService organizationService;
    private final JwtUtil jwtUtil;

    @Override
    @Transactional
    public boolean handleVerification(String orgIdFromUrl, String emailFromUrl, String token, OffsetDateTime verifiedAt) {
        Claims claims;
        try {
            claims = jwtUtil.parseClaims(token);
        } catch (ExpiredJwtException e) {
            Optional<Invitation> expInv = invitationRepository.findByToken(token);
            expInv.ifPresent(i -> {
                i.setVerifiedAt(verifiedAt);
                invitationRepository.save(i);
            });
            throw e;
        } catch (JwtException e) {
            throw e;
        }

        String email = claims.get("email", String.class);
        String orgId = claims.get("orgId", String.class);

        if (email == null || orgId == null) {
            throw new JwtException("Invalid token payload: missing email/orgId");
        }

        Optional<Invitation> optInv = invitationRepository.findByToken(token);
        Invitation inv = optInv.orElse(null);

        boolean userExists = readerRepository.existsByEmail(email);

        if (userExists) {
            organizationService.addMemberByEmail(orgId, email);

            if (inv != null) {
                inv.setAccepted(true);
                inv.setVerifiedAt(verifiedAt);
                invitationRepository.save(inv);
            }
            return true;
        } else {
            if (inv != null) {
                inv.setVerifiedAt(verifiedAt);
                invitationRepository.save(inv);
            }
            return false;
        }
    }
}
