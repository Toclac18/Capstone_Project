package com.capstone.be.util;

import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * A simple implementation of MultipartFile that wraps a byte array.
 * Used for creating MultipartFile from converted documents.
 */
public class ByteArrayMultipartFile implements MultipartFile {

  private final String name;
  private final String originalFilename;
  private final String contentType;
  private final byte[] content;

  public ByteArrayMultipartFile(String name, String originalFilename, String contentType, byte[] content) {
    this.name = name;
    this.originalFilename = originalFilename;
    this.contentType = contentType;
    this.content = content != null ? content : new byte[0];
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
    return content.length == 0;
  }

  @Override
  public long getSize() {
    return content.length;
  }

  @Override
  public byte[] getBytes() throws IOException {
    return content;
  }

  @Override
  public InputStream getInputStream() throws IOException {
    return new ByteArrayInputStream(content);
  }

  @Override
  public void transferTo(File dest) throws IOException, IllegalStateException {
    Files.write(dest.toPath(), content);
  }

  @Override
  public void transferTo(Path dest) throws IOException, IllegalStateException {
    Files.write(dest, content);
  }
}
