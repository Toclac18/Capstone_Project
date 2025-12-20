package com.capstone.be.service.impl;

import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;

/**
 * Wrapper để tạo MultipartFile từ byte array
 * Dùng để truyền file vào async method sau khi đã đọc bytes trong synchronous context
 */
public class ByteArrayMultipartFile implements MultipartFile {
  private final byte[] content;
  private final String name;
  private final String originalFilename;
  private final String contentType;

  public ByteArrayMultipartFile(byte[] content, String originalFilename, String contentType) {
    this.content = content;
    this.name = originalFilename;
    this.originalFilename = originalFilename;
    this.contentType = contentType;
  }

  @Override
  public String getName() {
    return name;
  }

  @Override
  public String getOriginalFilename() {
    return originalFilename;
  }

  @Override
  public String getContentType() {
    return contentType;
  }

  @Override
  public boolean isEmpty() {
    return content == null || content.length == 0;
  }

  @Override
  public long getSize() {
    return content != null ? content.length : 0;
  }

  @Override
  public byte[] getBytes() throws IOException {
    return content != null ? content.clone() : new byte[0];
  }

  @Override
  public InputStream getInputStream() throws IOException {
    return new ByteArrayInputStream(content != null ? content : new byte[0]);
  }

  @Override
  public void transferTo(java.io.File dest) throws IOException, IllegalStateException {
    java.nio.file.Files.write(dest.toPath(), content != null ? content : new byte[0]);
  }
}
