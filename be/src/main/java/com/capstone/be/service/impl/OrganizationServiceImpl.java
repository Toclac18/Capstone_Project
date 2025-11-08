package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.Organization;
import com.capstone.be.domain.enums.OrganizationStatus;
import com.capstone.be.dto.request.organization.OrganizationQueryRequest;
import com.capstone.be.dto.request.organization.UpdateOrganizationStatusRequest;
import com.capstone.be.dto.response.organization.OrganizationDetailResponse;
import com.capstone.be.dto.response.organization.OrganizationListResponse;
import com.capstone.be.dto.response.organization.OrganizationResponse;
import com.capstone.be.mapper.OrganizationMapper;
import com.capstone.be.repository.OrganizationRepository;
import com.capstone.be.repository.ReaderRepository;
import com.capstone.be.service.OrganizationService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.stream.Collectors;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OrganizationServiceImpl implements OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final OrganizationMapper organizationMapper;

    // ++ Inject thêm ReaderRepository để tìm reader qua email
    private final ReaderRepository readerRepository;

    // ++ Không tạo repository mới: dùng trực tiếp EntityManager cho bảng trung gian
    @PersistenceContext
    private EntityManager em;

    @Override
    @Transactional(readOnly = true)
    public OrganizationDetailResponse getDetail(UUID id) {
        Organization organization = organizationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Organization not found"));

        OrganizationDetailResponse detail = organizationMapper.toDetailResponse(organization);
        // Optional computed fields (set null for now or compute via other repositories if needed)
        detail.setTotalMembers(null);
        detail.setTotalDocuments(null);
        return detail;
    }

    @Override
    @Transactional(readOnly = true)
    public OrganizationListResponse query(OrganizationQueryRequest request) {
        List<Organization> all = organizationRepository.findAll();

        // Exclude deleted in list
        List<Organization> filtered = all.stream()
                .filter(org -> !Boolean.TRUE.equals(org.getDeleted()))
                .filter(org -> applySearch(org, request.getSearch()))
                .filter(org -> applyStatus(org, request.getStatus()))
                .filter(org -> applyDateRange(org, request.getDateFrom(), request.getDateTo()))
                .collect(Collectors.toList());

        // Sort
        Comparator<Organization> comparator = buildComparator(request.getSortBy());
        if (comparator != null) {
            if ("desc".equalsIgnoreCase(request.getSortOrder())) {
                comparator = comparator.reversed();
            }
            filtered = filtered.stream().sorted(comparator).collect(Collectors.toList());
        }

        // Pagination (page starts from 1)
        int page = Optional.ofNullable(request.getPage()).orElse(1);
        int limit = Optional.ofNullable(request.getLimit()).orElse(10);
        if (page < 1) {
            page = 1;
        }
        if (limit < 1) {
            limit = 10;
        }
        int fromIndex = Math.min((page - 1) * limit, filtered.size());
        int toIndex = Math.min(fromIndex + limit, filtered.size());

        List<OrganizationResponse> items = filtered.subList(fromIndex, toIndex).stream()
                .map(organizationMapper::toResponse)
                .collect(Collectors.toList());

        return OrganizationListResponse.builder()
                .organizations(items)
                .total(filtered.size())
                .page(page)
                .limit(limit)
                .build();
    }

    @Override
    @Transactional
    public OrganizationDetailResponse updateStatus(UUID id, UpdateOrganizationStatusRequest request) {
        if (request.getStatus() == null) {
            throw new RuntimeException("Status is required");
        }

        Organization organization = organizationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Organization not found"));

        OrganizationStatus status = request.getStatus();
        organization.setStatus(status);

        // Update active field based on status
        if (status == OrganizationStatus.ACTIVE) {
            organization.setActive(true);
        } else if (status == OrganizationStatus.DEACTIVE || status == OrganizationStatus.DELETED) {
            organization.setActive(false);
        }
        // PENDING_VERIFICATION can have active = true or false depending on business logic

        // updatedAt will be handled by auditing; touch entity to mark update
        organization.setUpdatedAt(LocalDateTime.now());
        Organization saved = organizationRepository.save(organization);
        return organizationMapper.toDetailResponse(saved);
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        Organization organization = organizationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Organization not found"));
        organization.setDeleted(true);
        organization.setUpdatedAt(LocalDateTime.now());
        organizationRepository.save(organization);
    }

    // =========================
    // = addMemberByEmail Impl =
    // =========================
    @Override
    @Transactional
    public void addMemberByEmail(String orgId, String email) {
        if (orgId == null || orgId.isBlank()) {
            throw new IllegalArgumentException("orgId is required");
        }
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("email is required");
        }

        UUID orgUuid;
        try {
            orgUuid = UUID.fromString(orgId);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("orgId must be a valid UUID");
        }

        // 1) Kiểm tra Organization tồn tại & chưa deleted
        Organization org = organizationRepository.findById(orgUuid)
                .orElseThrow(() -> new RuntimeException("Organization not found"));

        if (Boolean.TRUE.equals(org.getDeleted())) {
            throw new RuntimeException("Organization is deleted");
        }

        // 2) Tìm Reader qua email
        var readerOpt = readerRepository.findByEmail(email);
        var reader = readerOpt.orElseThrow(() -> new RuntimeException("Reader not found by email"));

        UUID readerId = reader.getId();

        // 3) Idempotent: nếu đã là member ACTIVE thì bỏ qua
        // Không tạo thêm repository: dùng native SQL qua EntityManager
        // Bảng trung gian: organization_reader_memberships (đã định nghĩa trong phần entity trước đó)
        // Các cột tối thiểu: id, organization_id, reader_id, status, joined_at, active, created_at, updated_at
        String existsSql = """
                SELECT id 
                FROM organization_reader_memberships 
                WHERE organization_id = :orgId 
                  AND reader_id = :readerId 
                LIMIT 1
                """;

        @SuppressWarnings("unchecked")
        List<Object> existing = em.createNativeQuery(existsSql)
                .setParameter("orgId", orgUuid)
                .setParameter("readerId", readerId)
                .getResultList();

        OffsetDateTime now = OffsetDateTime.now();

        if (!existing.isEmpty()) {
            // Đã có membership: cập nhật về ACTIVE + active=true, cập nhật updated_at
            String updateSql = """
                    UPDATE organization_reader_memberships
                       SET status = 'ACTIVE',
                           active = TRUE,
                           updated_at = NOW(),
                           joined_at = COALESCE(joined_at, NOW())
                     WHERE organization_id = :orgId
                       AND reader_id = :readerId
                    """;
            em.createNativeQuery(updateSql)
                    .setParameter("orgId", orgUuid)
                    .setParameter("readerId", readerId)
                    .executeUpdate();
            return;
        }

        // 4) Chưa có membership: chèn mới (ACTIVE)
        UUID membershipId = UUID.randomUUID();
        String insertSql = """
                INSERT INTO organization_reader_memberships
                  (id, organization_id, reader_id, status, joined_at, active, created_at, updated_at)
                VALUES
                  (:id, :orgId, :readerId, 'ACTIVE', NOW(), TRUE, NOW(), NOW())
                """;
        em.createNativeQuery(insertSql)
                .setParameter("id", membershipId)
                .setParameter("orgId", orgUuid)
                .setParameter("readerId", readerId)
                .executeUpdate();
    }

    // ----------------- helpers -----------------
    private boolean applySearch(Organization org, String search) {
        if (search == null || search.isBlank()) {
            return true;
        }
        String q = search.toLowerCase(Locale.ROOT);
        return contains(org.getName(), q)
                || contains(org.getEmail(), q)
                || contains(org.getHotline(), q)
                || contains(org.getAdminEmail(), q)
                || contains(org.getAddress(), q)
                || contains(org.getRegistrationNumber(), q);
    }

    @Override
    @Transactional(readOnly = true)
    public OrganizationListResponse getAll() {
        List<Organization> all = organizationRepository.findAll();

        // Only get ACTIVE organizations (exclude deleted, deactive, pending, etc.)
        List<Organization> filtered = all.stream()
                .filter(org -> !Boolean.TRUE.equals(org.getDeleted()))
                .filter(org -> org.getStatus() == OrganizationStatus.ACTIVE)
                .collect(Collectors.toList());

        // Sort by name
        filtered = filtered.stream()
                .sorted(Comparator.comparing(o -> nullSafeString(o.getName())))
                .collect(Collectors.toList());

        List<OrganizationResponse> items = filtered.stream()
                .map(organizationMapper::toResponse)
                .collect(Collectors.toList());

        return OrganizationListResponse.builder()
                .organizations(items)
                .total(filtered.size())
                .page(1)
                .limit(filtered.size())
                .build();
    }

    private boolean contains(String field, String q) {
        return field != null && field.toLowerCase(Locale.ROOT).contains(q);
    }

    private boolean applyStatus(Organization org, String status) {
        if (status == null || status.isBlank()) {
            return true;
        }
        try {
            OrganizationStatus filterStatus = OrganizationStatus.valueOf(status.toUpperCase());
            return org.getStatus() == filterStatus;
        } catch (IllegalArgumentException e) {
            // If status string doesn't match enum, try legacy logic
            if ("ACTIVE".equalsIgnoreCase(status)) {
                return org.getStatus() == OrganizationStatus.ACTIVE || Boolean.TRUE.equals(org.getActive());
            }
            if ("DEACTIVE".equalsIgnoreCase(status) || "INACTIVE".equalsIgnoreCase(status)) {
                return org.getStatus() == OrganizationStatus.DEACTIVE || Boolean.FALSE.equals(
                        org.getActive());
            }
            return true;
        }
    }

    private boolean applyDateRange(Organization org, String dateFrom, String dateTo) {
        LocalDateTime createdAt = org.getCreatedAt();
        if (createdAt == null) {
            return true;
        }
        try {
            if (dateFrom != null && !dateFrom.isBlank()) {
                LocalDate from = LocalDate.parse(dateFrom);
                if (createdAt.isBefore(from.atStartOfDay())) {
                    return false;
                }
            }
            if (dateTo != null && !dateTo.isBlank()) {
                LocalDate to = LocalDate.parse(dateTo);
                LocalDateTime endOfDay = to.plusDays(1).atStartOfDay().minusNanos(1);
                return !createdAt.isAfter(endOfDay);
            }
            return true;
        } catch (DateTimeParseException e) {
            return true;
        }
    }

    private Comparator<Organization> buildComparator(String sortBy) {
        if (sortBy == null || sortBy.isBlank()) {
            sortBy = "createdAt";
        }
        switch (sortBy) {
            case "name":
                return Comparator.comparing(o -> nullSafeString(o.getName()));
            case "email":
                return Comparator.comparing(o -> nullSafeString(o.getEmail()));
            case "hotline":
                return Comparator.comparing(o -> nullSafeString(o.getHotline()));
            case "status":
                return Comparator.comparing(o -> o.getStatus() != null ? o.getStatus().name() : "");
            case "active":
                return Comparator.comparing(o -> Boolean.TRUE.equals(o.getActive()));
            case "createdAt":
            default:
                return Comparator.comparing(Organization::getCreatedAt,
                        Comparator.nullsLast(Comparator.naturalOrder()));
        }
    }

    private String nullSafeString(String v) {
        return v == null ? "" : v;
    }
}


