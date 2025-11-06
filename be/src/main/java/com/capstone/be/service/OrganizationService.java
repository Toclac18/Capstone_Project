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

  void delete(UUID id);
}


