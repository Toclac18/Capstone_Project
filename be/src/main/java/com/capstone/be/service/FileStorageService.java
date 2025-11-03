package com.capstone.be.service;

import java.util.List;
import java.util.UUID;
import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {

  List<String> uploadReviewerBackground(UUID reviewerId, List<MultipartFile> files);

}
