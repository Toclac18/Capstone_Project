package com.capstone.be.config.seed;

import com.capstone.be.config.seed.event.DocumentSeededEvent;
import com.capstone.be.domain.entity.Document;
import com.capstone.be.domain.entity.DocumentReport;
import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.DocStatus;
import com.capstone.be.domain.enums.ReportReason;
import com.capstone.be.domain.enums.ReportStatus;
import com.capstone.be.repository.DocumentReportRepository;
import com.capstone.be.repository.DocumentRepository;
import com.capstone.be.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Seeder for DocumentReport (dev profile only)
 * Creates sample reports for testing BA Report Management
 */
@Profile("dev")
@Component
@RequiredArgsConstructor
@Slf4j
public class DocumentReportSeeder {

  private final DocumentReportRepository documentReportRepository;
  private final DocumentRepository documentRepository;
  private final UserRepository userRepository;

  @Transactional
  @EventListener(DocumentSeededEvent.class)
  public void run() {
    log.info("🚨 Start seeding DocumentReport");

    if (documentReportRepository.count() > 0) {
      log.warn("DocumentReport already exist → skip seeding.");
      return;
    }

    List<Document> activeDocs = documentRepository.findAll().stream()
        .filter(d -> d.getStatus() == DocStatus.ACTIVE)
        .limit(10)
        .toList();

    if (activeDocs.isEmpty()) {
      log.warn("⚠️ No active documents found. Skipping report seeding.");
      return;
    }

    // Get readers for reporting
    List<User> readers = userRepository.findAll().stream()
        .filter(u -> u.getEmail().startsWith("reader"))
        .limit(5)
        .toList();

    if (readers.isEmpty()) {
      log.warn("⚠️ No readers found. Skipping report seeding.");
      return;
    }

    // Get BA for reviewing
    User businessAdmin = userRepository.findByEmail("business1@capstone.com").orElse(null);

    int seed = 0;

    // PENDING reports (6)
    createReport(seed++, activeDocs.get(0), readers.get(0),
        ReportReason.INAPPROPRIATE_CONTENT,
        "Tài liệu này chứa nội dung không phù hợp với học sinh.",
        ReportStatus.PENDING, null, null);

    createReport(seed++, activeDocs.get(1), readers.get(1),
        ReportReason.COPYRIGHT_VIOLATION,
        "Tài liệu này sao chép từ sách của NXB Giáo dục mà không có bản quyền.",
        ReportStatus.PENDING, null, null);

    createReport(seed++, activeDocs.get(2), readers.get(2),
        ReportReason.SPAM,
        "Tài liệu này chứa quảng cáo và link spam.",
        ReportStatus.PENDING, null, null);

    createReport(seed++, activeDocs.get(3), readers.get(0),
        ReportReason.MISLEADING_INFORMATION,
        "Thông tin trong tài liệu này không chính xác, có thể gây hiểu lầm cho người đọc.",
        ReportStatus.PENDING, null, null);

    createReport(seed++, activeDocs.get(4), readers.get(1),
        ReportReason.QUALITY_ISSUES,
        "Tài liệu scan chất lượng kém, không đọc được nhiều trang.",
        ReportStatus.PENDING, null, null);

    createReport(seed++, activeDocs.get(5), readers.get(2),
        ReportReason.OTHER,
        "Tài liệu có vấn đề cần kiểm tra.",
        ReportStatus.PENDING, null, null);

    // RESOLVED reports (6)
    createReport(seed++, activeDocs.get(6 % activeDocs.size()), readers.get(3 % readers.size()),
        ReportReason.DUPLICATE_CONTENT,
        "Tài liệu này trùng lặp với tài liệu đã có trên hệ thống.",
        ReportStatus.RESOLVED, businessAdmin, "Đã xác nhận trùng lặp và gỡ bỏ tài liệu.");

    createReport(seed++, activeDocs.get(7 % activeDocs.size()), readers.get(4 % readers.size()),
        ReportReason.COPYRIGHT_VIOLATION,
        "Vi phạm bản quyền sách của tác giả ABC.",
        ReportStatus.RESOLVED, businessAdmin, "Đã xác minh và xử lý vi phạm bản quyền.");

    createReport(seed++, activeDocs.get(8 % activeDocs.size()), readers.get(0),
        ReportReason.INAPPROPRIATE_CONTENT,
        "Nội dung không phù hợp với đối tượng học sinh.",
        ReportStatus.RESOLVED, businessAdmin, "Đã kiểm duyệt và chỉnh sửa nội dung.");

    createReport(seed++, activeDocs.get(9 % activeDocs.size()), readers.get(1),
        ReportReason.SPAM,
        "Tài liệu spam.",
        ReportStatus.RESOLVED, businessAdmin, "Đã kiểm tra và xử lý.");

    createReport(seed++, activeDocs.get(0), readers.get(2),
        ReportReason.QUALITY_ISSUES,
        "Chất lượng hình ảnh kém.",
        ReportStatus.RESOLVED, businessAdmin, "Uploader đã cập nhật file mới với chất lượng tốt hơn.");

    createReport(seed++, activeDocs.get(1), readers.get(3 % readers.size()),
        ReportReason.MISLEADING_INFORMATION,
        "Thông tin sai lệch về công thức toán học.",
        ReportStatus.RESOLVED, businessAdmin, "Đã yêu cầu uploader sửa nội dung.");

    log.info("✅ DocumentReport seeding completed! Created {} reports", seed);
  }

  private void createReport(int seed, Document document, User reporter,
      ReportReason reason, String description, ReportStatus status,
      User reviewedBy, String adminNotes) {

    DocumentReport report = DocumentReport.builder()
        .id(SeedUtil.generateUUID("report-" + seed))
        .document(document)
        .reporter(reporter)
        .reason(reason)
        .description(description)
        .status(status)
        .reviewedBy(reviewedBy)
        .adminNotes(adminNotes)
        .build();

    documentReportRepository.save(report);

    log.info("📝 Created report #{}: {} reported {} - Status: {}",
        seed + 1, reporter.getFullName(), document.getTitle(), status);
  }
}
