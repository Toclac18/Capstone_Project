package com.capstone.be.util;

import com.capstone.be.domain.entity.Reader;
import com.capstone.be.domain.enums.ReaderStatus;
import com.capstone.be.repository.ReaderRepository;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * SeedData: chèn dữ liệu mẫu vào DB khi ứng dụng khởi động. Dành cho môi trường dev / test.
 */
@Profile("dev")
@Component
@RequiredArgsConstructor
public class SeedData implements CommandLineRunner {

  private final ReaderRepository readerRepository;

  @Override
  public void run(String... args) {
    long existingCount = readerRepository.count();
    if (existingCount > 0) {
      System.out.println("⚙️  [SeedData] Skipped — existing readers found (" + existingCount + ")");
      return;
    }

    System.out.println("🌱 [SeedData] Seeding readers into database...");

    List<Reader> readers = new ArrayList<>();

    readers.add(new Reader(
        UUID.randomUUID(),
        "Alice Nguyen",
        "alice",
        LocalDate.of(1998, 5, 20),
        "alice@example.com",
        "$2a$10$hashAlice123456789",
        "https://i.pravatar.cc/150?img=1",
        120,
        ReaderStatus.ACTIVE
    ));

    readers.add(new Reader(
        UUID.randomUUID(),
        "Bob Tran",
        "bob",
        LocalDate.of(1995, 9, 14),
        "bob@example.com",
        "$2a$10$hashBob987654321",
        "https://i.pravatar.cc/150?img=2",
        5,
        ReaderStatus.DEACTIVE
    ));

    readers.add(new Reader(
        UUID.randomUUID(),
        "Charlie Le",
        "charlie",
        LocalDate.of(1999, 1, 8),
        "charlie@example.com",
        "$2a$10$hashCharlieABCDEF",
        "https://i.pravatar.cc/150?img=3",
        80,
        ReaderStatus.ACTIVE
    ));

    readers.add(new Reader(
        UUID.randomUUID(),
        "David Pham",
        "david",
        LocalDate.of(2001, 2, 11),
        "david@example.com",
        "$2a$10$hashDavidXYZ99999",
        "https://i.pravatar.cc/150?img=4",
        340,
        ReaderStatus.PENDING_VERIFICATION
    ));

    // Sinh thêm ~100 bản ghi để test phân trang / lọc
    for (int i = 1; i <= 100; i++) {
      readers.add(new Reader(
          UUID.randomUUID(),
          "Reader " + i,
          "reader" + i,
          LocalDate.of(1990 + (i % 10), (i % 12) + 1, (i % 27) + 1),
          "reader" + i + "@example.com",
          "$2a$10$hash" + i,
          "https://i.pravatar.cc/150?img=" + ((i % 70) + 5),
          100 + (i * 3),
          switch (i % 4) {
            case 0 -> ReaderStatus.ACTIVE;
            case 1 -> ReaderStatus.DEACTIVE;
            case 2 -> ReaderStatus.PENDING_VERIFICATION;
            default -> ReaderStatus.DELETED;
          }
      ));
    }

    readerRepository.saveAll(readers);

    System.out.println("✅ [SeedData] Inserted " + readers.size() + " readers successfully.");
  }
}
