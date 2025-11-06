package com.capstone.be.service;

import com.capstone.be.dto.response.importReader.ImportDetailResponse;
import com.capstone.be.dto.response.importReader.ImportListResponse;
import org.springframework.web.multipart.MultipartFile;

public interface ImportService {
    ImportListResponse list(int page, int pageSize, String q, String status);

    ImportDetailResponse detail(String id);

    ImportDetailResponse create(MultipartFile file, String createdBy);

    String csvResult(String id);

    byte[] templateExcel();
}
