package com.capstone.be.service;

import com.capstone.be.dto.request.organization.OrganizationQueryRequest;
import com.capstone.be.dto.request.organization.UpdateOrganizationStatusRequest;
import com.capstone.be.dto.response.organization.OrganizationDetailResponse;
import com.capstone.be.dto.response.organization.OrganizationListResponse;

import java.util.UUID;

public interface OrganizationService {

    OrganizationDetailResponse getDetail(UUID id);

    OrganizationListResponse query(OrganizationQueryRequest request);

    OrganizationDetailResponse updateStatus(UUID id, UpdateOrganizationStatusRequest request);

    /**
     * Thêm reader (qua email) vào organization (orgId dạng UUID string).
     * - Idempotent: nếu đã là member thì bỏ qua;
     * - Nếu tồn tại bản ghi membership nhưng inactive/pending -> kích hoạt ACTIVE.
     */
    void addMemberByEmail(String orgId, String email);

    void delete(UUID id);

    OrganizationListResponse getAll();
}


