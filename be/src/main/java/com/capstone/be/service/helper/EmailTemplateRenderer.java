package com.capstone.be.service.helper;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

/**
 * Nạp template email từ classpath và điền tham số.
 *
 * <p>Trước đây 16 template HTML nằm trong {@code EmailServiceImpl} dưới dạng text block
 * Java — hơn 1.000 dòng HTML lẫn trong code, không ai mở xem trước được, và sửa một
 * khoảng trắng cũng phải biên dịch lại.
 *
 * <p>Giữ {@code String.format} đúng như text block cũ dùng {@code .formatted(...)},
 * nên nội dung template không phải đổi gì: cùng {@code %s}, cùng thứ tự tham số.
 * Vì vậy HTML sinh ra giống nguyên văn — {@code EmailTemplateGoldenTest} chốt điều đó.
 *
 * <p>Không dùng Thymeleaf: các nhánh điều kiện trong email đều là chọn GIÁ TRỊ (màu,
 * nhãn, câu chữ theo enum), không phải chọn cấu trúc HTML, nên chúng thuộc Java.
 * Thêm {@code spring-boot-starter-thymeleaf} còn kéo theo view resolver cho web MVC —
 * một thay đổi không cần thiết cho việc này.
 *
 * <p>Template được cache sau lần nạp đầu: chúng nằm trong jar nên không đổi lúc chạy.
 */
@Component
public class EmailTemplateRenderer {

  private static final String BASE_PATH = "templates/email/";

  private final Map<String, String> cache = new ConcurrentHashMap<>();

  /**
   * Nạp template rồi điền tham số theo đúng thứ tự {@code %s} trong file.
   *
   * @param name tên file không có đuôi, ví dụ {@code "welcome"}
   * @param args tham số, cùng thứ tự như {@code .formatted(...)} trước đây
   */
  public String render(String name, Object... args) {
    return load(name).formatted(args);
  }

  /** Nạp template thô, không điền tham số. */
  public String load(String name) {
    return cache.computeIfAbsent(name, n -> {
      ClassPathResource resource = new ClassPathResource(BASE_PATH + n + ".html");
      try (var in = resource.getInputStream()) {
        return new String(in.readAllBytes(), StandardCharsets.UTF_8);
      } catch (IOException e) {
        throw new UncheckedIOException(
            "Không đọc được template email: " + BASE_PATH + n + ".html", e);
      }
    });
  }
}
