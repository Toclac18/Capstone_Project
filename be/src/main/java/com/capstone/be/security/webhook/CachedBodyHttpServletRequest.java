package com.capstone.be.security.webhook;

import jakarta.servlet.ReadListener;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

/**
 * Cho phép đọc body nhiều lần: filter xác thực chữ ký cần raw bytes, controller sau đó
 * vẫn cần deserialize cùng body đó. ServletInputStream gốc chỉ đọc được một lần.
 */
public class CachedBodyHttpServletRequest extends HttpServletRequestWrapper {

  private final byte[] body;

  public CachedBodyHttpServletRequest(HttpServletRequest request, byte[] body) {
    super(request);
    this.body = body;
  }

  @Override
  public ServletInputStream getInputStream() {
    ByteArrayInputStream buffer = new ByteArrayInputStream(body);
    return new ServletInputStream() {
      @Override
      public boolean isFinished() {
        return buffer.available() == 0;
      }

      @Override
      public boolean isReady() {
        return true;
      }

      @Override
      public void setReadListener(ReadListener listener) {
        throw new UnsupportedOperationException("Chỉ dùng cho đọc đồng bộ");
      }

      @Override
      public int read() {
        return buffer.read();
      }
    };
  }

  @Override
  public BufferedReader getReader() {
    return new BufferedReader(
        new InputStreamReader(getInputStream(), StandardCharsets.UTF_8));
  }
}
