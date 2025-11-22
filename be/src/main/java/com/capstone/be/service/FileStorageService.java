package com.capstone.be.service;

import java.util.List;
import org.springframework.web.multipart.MultipartFile;

/**
 * Service for file storage operations (AWS S3)
 */
public interface FileStorageService {

  /**
   * Upload a file to S3
   *
   * @param file     The file to upload
   * @param folder   The folder/prefix in S3 bucket
   * @param filename Custom filename (optional, will use original if null)
   * @return The Key of the uploaded file
   */
  String uploadFile(MultipartFile file, String folder, String filename);

  /**
   * Upload a file to S3 from raw bytes (for generated files like thumbnails)
   *
   * @param content     File content as byte array
   * @param contentType MIME type, e.g. "image/png"
   * @param folder      Folder/prefix in S3 bucket
   * @param filename    Custom filename (optional)
   * @return Key of uploaded file
   */
  String uploadFile(byte[] content, String contentType, String folder, String filename);


  /**
   * Upload multiple files to S3
   *
   * @param files  List of files to upload
   * @param folder The folder/prefix in S3 bucket
   * @return List of Keys of uploaded files
   */
  List<String> uploadFiles(List<MultipartFile> files, String folder);

  /**
   * Delete a file from S3
   * @param folder folder to delete file
   * @param fileName name of the file to delete
   */
  void deleteFile(String folder, String fileName);

  /**
   * Delete multiple files from S3
   * @param folder folder to delete file
   * @param fileUrls List of file URLs to delete
   */
  void deleteFiles(String folder, List<String> fileUrls);
}
