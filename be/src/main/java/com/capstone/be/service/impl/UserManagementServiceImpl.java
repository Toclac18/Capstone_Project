package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.Organization;
import com.capstone.be.domain.entity.Reader;
import com.capstone.be.domain.entity.Reviewer;
import com.capstone.be.domain.enums.ReaderStatus;
import com.capstone.be.dto.request.user.UpdateUserStatusRequest;
import com.capstone.be.dto.request.user.UserQueryRequest;
import com.capstone.be.dto.response.user.UserListResponse;
import com.capstone.be.dto.response.user.UserResponse;
import com.capstone.be.mapper.UserManagementMapper;
import com.capstone.be.repository.OrganizationRepository;
import com.capstone.be.repository.ReaderRepository;
import com.capstone.be.repository.ReviewerRepository;
import com.capstone.be.service.UserManagementService;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserManagementServiceImpl implements UserManagementService {

  private final ReaderRepository readerRepository;
  private final ReviewerRepository reviewerRepository;
  private final OrganizationRepository organizationRepository;
  private final UserManagementMapper userManagementMapper;

  @Override
  public UserListResponse getUsers(UserQueryRequest request) {
    String role = request.getRole();

    if (role != null && !role.isEmpty()) {
      if (role.equals("READER")) {
        return getReaders(request);
      } else if (role.equals("REVIEWER")) {
        return getReviewers(request);
      } else if (role.equals("ORGANIZATION_ADMIN") || role.equals("ORGANIZATION")) {
        return getOrganizations(request);
      }
    }

    List<UserResponse> allUsers = new ArrayList<>();
    
    List<Reader> readers = readerRepository.findAll();
    for (Reader reader : readers) {
      if (applyFilters(reader, request)) {
        UserResponse userResponse = userManagementMapper.toUserResponse(reader);
        allUsers.add(userResponse);
      }
    }
    
    List<Reviewer> reviewers = reviewerRepository.findAll();
    for (Reviewer reviewer : reviewers) {
      if (Boolean.TRUE.equals(reviewer.getDeleted())) continue;
      if (applyFilters(reviewer, request)) {
        UserResponse userResponse = userManagementMapper.toUserResponse(reviewer);
        allUsers.add(userResponse);
      }
    }
    
    List<Organization> organizations = organizationRepository.findAll();
    for (Organization org : organizations) {
      if (Boolean.TRUE.equals(org.getDeleted())) continue;
      if (applyFilters(org, request)) {
        UserResponse userResponse = userManagementMapper.toUserResponse(org);
        allUsers.add(userResponse);
      }
    }
    
    // Sort and paginate
    return sortAndPaginate(allUsers, request);
  }
  
  private UserListResponse getReaders(UserQueryRequest request) {
    List<Reader> readers = readerRepository.findAll();
    List<UserResponse> userResponses = new ArrayList<>();
    
    for (Reader reader : readers) {
      if (applyFilters(reader, request)) {
        UserResponse userResponse = userManagementMapper.toUserResponse(reader);
        userResponses.add(userResponse);
      }
    }
    
    return sortAndPaginate(userResponses, request);
  }
  
  private UserListResponse getReviewers(UserQueryRequest request) {
    List<Reviewer> reviewers = reviewerRepository.findAll();
    List<UserResponse> userResponses = new ArrayList<>();
    
    for (Reviewer reviewer : reviewers) {
      if (Boolean.TRUE.equals(reviewer.getDeleted())) continue;
      if (applyFilters(reviewer, request)) {
        UserResponse userResponse = userManagementMapper.toUserResponse(reviewer);
        userResponses.add(userResponse);
      }
    }
    
    return sortAndPaginate(userResponses, request);
  }
  
  private UserListResponse getOrganizations(UserQueryRequest request) {
    List<Organization> organizations = organizationRepository.findAll();
    List<UserResponse> userResponses = new ArrayList<>();
    
    for (Organization org : organizations) {
      if (Boolean.TRUE.equals(org.getDeleted())) continue;
      if (applyFilters(org, request)) {
        UserResponse userResponse = userManagementMapper.toUserResponse(org);
        userResponses.add(userResponse);
      }
    }
    
    return sortAndPaginate(userResponses, request);
  }
  
  private boolean applyFilters(Object entity, UserQueryRequest request) {
    String search = request.getSearch();
    String status = request.getStatus();
    
    // Search filter
    if (search != null && !search.isEmpty()) {
      String searchLower = search.toLowerCase();
      boolean matchesSearch = false;
      
      if (entity instanceof Reader reader) {
        matchesSearch = reader.getFullName().toLowerCase().contains(searchLower) 
            || reader.getEmail().toLowerCase().contains(searchLower);
      } else if (entity instanceof Reviewer reviewer) {
        matchesSearch = reviewer.getName().toLowerCase().contains(searchLower) 
            || reviewer.getEmail().toLowerCase().contains(searchLower);
      } else if (entity instanceof Organization org) {
        matchesSearch = org.getEmail().toLowerCase().contains(searchLower) 
            || org.getAdminEmail().toLowerCase().contains(searchLower);
      }
      
      if (!matchesSearch) {
        return false;
      }
    }
    
    // Status filter
    if (status != null && !status.isEmpty()) {
      if (entity instanceof Reader reader) {
        ReaderStatus readerStatus = ReaderStatus.valueOf(status);
        if (!reader.getStatus().equals(readerStatus)) {
          return false;
        }
      } else if (entity instanceof Reviewer reviewer) {
        boolean expectedActive = status.equals("ACTIVE");
        if (reviewer.getActive() != expectedActive) {
          return false;
        }
      } else if (entity instanceof Organization org) {
        boolean expectedActive = status.equals("ACTIVE");
        if (org.getActive() != expectedActive) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  private UserListResponse sortAndPaginate(List<UserResponse> users, UserQueryRequest request) {
    String sortBy = request.getSortBy() != null ? request.getSortBy() : "createdAt";
    String sortOrder = request.getSortOrder() != null ? request.getSortOrder() : "desc";
    
    users.sort((a, b) -> {
      int comparison = 0;
      
      switch (sortBy) {
        case "name":
          comparison = a.getName().compareToIgnoreCase(b.getName());
          break;
        case "email":
          comparison = a.getEmail().compareToIgnoreCase(b.getEmail());
          break;
        case "role":
          comparison = a.getRole().compareToIgnoreCase(b.getRole());
          break;
        case "status":
          comparison = a.getStatus().compareToIgnoreCase(b.getStatus());
          break;
        case "createdAt":
        default:
          comparison = a.getCreatedAt().compareTo(b.getCreatedAt());
          break;
      }
      
      return sortOrder.equalsIgnoreCase("asc") ? comparison : -comparison;
    });
    
    int page = request.getPage() != null ? request.getPage() : 1;
    int limit = request.getLimit() != null ? request.getLimit() : 10;
    int start = (page - 1) * limit;
    int end = Math.min(start + limit, users.size());
    
    List<UserResponse> paginatedUsers = start < users.size() 
        ? users.subList(start, end) 
        : new ArrayList<>();
    
    return UserListResponse.builder()
        .users(paginatedUsers)
        .total(users.size())
        .page(page)
        .limit(limit)
        .build();
  }

  @Override
  @Transactional
  public void updateUserStatus(UUID userId, UpdateUserStatusRequest request) {
    String status = request.getStatus();
    
    // Try to find in each repository
    Reader reader = readerRepository.findById(userId).orElse(null);
    if (reader != null) {
      ReaderStatus readerStatus = ReaderStatus.valueOf(status);
      reader.setStatus(readerStatus);
      readerRepository.save(reader);
      return;
    }
    
    Reviewer reviewer = reviewerRepository.findById(userId).orElse(null);
    if (reviewer != null) {
      if (status.equals("DELETED")) {
        reviewer.setDeleted(true);
        reviewer.setActive(false);
      } else {
        reviewer.setActive(status.equals("ACTIVE"));
        reviewer.setDeleted(false);
      }
      reviewerRepository.save(reviewer);
      return;
    }
    
    Organization organization = organizationRepository.findById(userId).orElse(null);
    if (organization != null) {
      if (status.equals("DELETED")) {
        organization.setDeleted(true);
        organization.setActive(false);
      } else {
        organization.setActive(status.equals("ACTIVE"));
        organization.setDeleted(false);
      }
      organizationRepository.save(organization);
      return;
    }
    
    throw new RuntimeException("User not found with id: " + userId);
  }
}

