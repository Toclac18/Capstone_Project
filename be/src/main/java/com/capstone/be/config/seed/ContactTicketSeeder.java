package com.capstone.be.config.seed;

import com.capstone.be.domain.entity.ContactTicket;
import com.capstone.be.domain.enums.ContactCategory;
import com.capstone.be.domain.enums.ContactStatus;
import com.capstone.be.domain.enums.ContactUrgency;
import com.capstone.be.repository.ContactTicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Seeder for ContactTicket test data (dev profile only)
 */
@Profile("dev")
@Component
@RequiredArgsConstructor
@Slf4j
@Order(5) // Run after user seeding
public class ContactTicketSeeder {

  private final ContactTicketRepository contactTicketRepository;

  private static final int SEED_CONTACT_START = 9000000;

  @Transactional
  @EventListener(org.springframework.boot.context.event.ApplicationReadyEvent.class)
  public void run() {
    if (contactTicketRepository.count() > 0) {
      log.warn("Contact tickets already exist → skip seeding.");
      return;
    }

    log.info("Starting contact ticket seeding...");

    int seed = SEED_CONTACT_START;

    // NEW tickets - High urgency
    createTicket(seed++, "Nguyễn Văn A", "nguyenvana@gmail.com",
        ContactCategory.TECHNICAL, null, ContactUrgency.HIGH,
        "Không thể đăng nhập vào hệ thống",
        "Tôi đã thử đăng nhập nhiều lần nhưng hệ thống báo lỗi 'Invalid credentials'. " +
            "Tôi chắc chắn mật khẩu của mình là đúng. Vui lòng kiểm tra và hỗ trợ.",
        ContactStatus.NEW, "192.168.1.100", null);

    createTicket(seed++, "Trần Thị B", "tranthib@yahoo.com",
        ContactCategory.PAYMENT, null, ContactUrgency.HIGH,
        "Thanh toán bị lỗi nhưng tiền đã bị trừ",
        "Tôi đã thanh toán gói Premium nhưng hệ thống báo lỗi. Tuy nhiên tiền trong tài khoản " +
            "của tôi đã bị trừ. Mã giao dịch: TXN123456789. Vui lòng hoàn tiền hoặc kích hoạt gói dịch vụ cho tôi.",
        ContactStatus.NEW, "192.168.1.101", null);

    // NEW tickets - Normal urgency
    createTicket(seed++, "Phạm Văn C", "phamvanc@outlook.com",
        ContactCategory.CONTENT, null, ContactUrgency.NORMAL,
        "Yêu cầu bổ sung tài liệu về Machine Learning",
        "Hiện tại thư viện của hệ thống có rất ít tài liệu về Machine Learning. " +
            "Tôi mong muốn nhà trường có thể bổ sung thêm tài liệu về các thuật toán ML hiện đại.",
        ContactStatus.NEW, "192.168.1.102", null);

    createTicket(seed++, "Lê Thị D", "lethid@gmail.com",
        ContactCategory.ACCOUNT, null, ContactUrgency.NORMAL,
        "Muốn thay đổi email đăng ký",
        "Email hiện tại của tôi sắp hết hạn (email công ty cũ). Tôi muốn đổi sang email mới. " +
            "Email mới: lethid.new@gmail.com. Vui lòng hướng dẫn tôi cách thực hiện.",
        ContactStatus.NEW, "192.168.1.103", null);

    // READ tickets - Normal urgency
    createTicket(seed++, "Hoàng Văn E", "hoangvane@gmail.com",
        ContactCategory.ACCESS, null, ContactUrgency.NORMAL,
        "Không thể tải xuống tài liệu PDF",
        "Khi tôi click vào nút download tài liệu, hệ thống không phản hồi gì cả. " +
            "Tôi đã thử với nhiều tài liệu khác nhau nhưng đều bị lỗi tương tự.",
        ContactStatus.READ, "192.168.1.104", null);

    // IN_PROGRESS tickets
    createTicket(seed++, "Vũ Thị F", "vuthif@yahoo.com",
        ContactCategory.TECHNICAL, null, ContactUrgency.HIGH,
        "Upload tài liệu bị lỗi 500",
        "Tôi đang cố gắng upload một bài báo khoa học (file PDF 5MB) nhưng luôn bị lỗi 500. " +
            "Đã thử nhiều lần trong 2 ngày qua nhưng không thành công.",
        ContactStatus.IN_PROGRESS, "192.168.1.105",
        "Đang kiểm tra log server. Có vẻ như file upload service đang gặp vấn đề.");

    createTicket(seed++, "Đỗ Văn G", "dovang@gmail.com",
        ContactCategory.OTHER, "Báo cáo lỗi bảo mật", ContactUrgency.HIGH,
        "[SECURITY] Phát hiện lỗ hổng XSS",
        "Tôi phát hiện một lỗ hổng XSS reflected ở trang tìm kiếm. " +
            "Payload: <script>alert('XSS')</script> " +
            "URL: https://example.com/search?q=<payload>",
        ContactStatus.IN_PROGRESS, "192.168.1.106",
        "Đang verify lỗ hổng. Cảm ơn bạn đã báo cáo!");

    // REPLIED tickets
    createTicket(seed++, "Ngô Thị H", "ngothih@outlook.com",
        ContactCategory.ACCOUNT, null, ContactUrgency.NORMAL,
        "Quên mật khẩu và email không nhận được OTP",
        "Tôi đã click 'Quên mật khẩu' nhưng email của tôi không nhận được mã OTP. " +
            "Đã kiểm tra cả spam folder rồi. Email: ngothih@outlook.com",
        ContactStatus.REPLIED, "192.168.1.107",
        "Chúng tôi đã gửi lại mã OTP cho bạn. Vui lòng kiểm tra email. " +
            "Nếu vẫn không nhận được, vui lòng liên hệ hotline: 1900-xxxx");

    createTicket(seed++, "Bùi Văn I", "buivani@gmail.com",
        ContactCategory.CONTENT, null, ContactUrgency.LOW,
        "Đề xuất thêm tính năng bookmark",
        "Tôi mong muốn hệ thống có tính năng bookmark để lưu lại các tài liệu hay. " +
            "Điều này sẽ rất hữu ích cho người dùng.",
        ContactStatus.REPLIED, "192.168.1.108",
        "Cảm ơn đề xuất của bạn! Chúng tôi đã ghi nhận và sẽ cân nhắc triển khai " +
            "trong phiên bản tiếp theo. Hiện tại bạn có thể dùng chức năng 'Saved List'.");

    // RESOLVED tickets
    createTicket(seed++, "Trịnh Thị K", "trinhthik@gmail.com",
        ContactCategory.PAYMENT, null, ContactUrgency.NORMAL,
        "Hóa đơn điện tử chưa được gửi",
        "Tôi đã thanh toán từ 5 ngày trước nhưng chưa nhận được hóa đơn điện tử. " +
            "Mã giao dịch: TXN987654321",
        ContactStatus.RESOLVED, "192.168.1.109",
        "Hóa đơn đã được gửi lại đến email của bạn. Xin lỗi vì sự bất tiện này!");

    createTicket(seed++, "Phan Văn L", "phanvanl@yahoo.com",
        ContactCategory.TECHNICAL, null, ContactUrgency.NORMAL,
        "Giao diện hiển thị lỗi trên mobile",
        "Khi xem tài liệu trên điện thoại, giao diện bị vỡ và nội dung bị che khuất. " +
            "Thiết bị: iPhone 12, iOS 17.1, Safari browser.",
        ContactStatus.RESOLVED, "192.168.1.110",
        "Lỗi đã được sửa trong bản cập nhật mới nhất. Vui lòng clear cache và thử lại. " +
            "Cảm ơn bạn đã báo cáo!");

    // CLOSED tickets - Low priority
    createTicket(seed++, "Võ Thị M", "vothim@gmail.com",
        ContactCategory.OTHER, "Góp ý cải thiện", ContactUrgency.LOW,
        "Đề xuất thêm dark mode",
        "Tôi thường xuyên đọc tài liệu vào ban đêm. Nếu có dark mode sẽ rất tốt cho mắt. " +
            "Mong hệ thống cân nhắc thêm tính năng này.",
        ContactStatus.CLOSED, "192.168.1.111",
        "Cảm ơn góp ý! Tính năng này đã được thêm vào backlog và sẽ được xem xét " +
            "trong Q2/2025.");

    createTicket(seed++, "Đinh Văn N", "dinhvann@outlook.com",
        ContactCategory.ACCESS, null, ContactUrgency.LOW,
        "Hỏi về quyền truy cập tài liệu premium",
        "Tài khoản của tôi có thể xem được những tài liệu premium nào? " +
            "Tôi muốn biết để nâng cấp gói phù hợp.",
        ContactStatus.CLOSED, "192.168.1.112",
        "Bạn có thể xem danh sách tài liệu premium tại mục 'Premium Library'. " +
            "Hoặc xem bảng so sánh các gói tại: https://example.com/pricing");

    log.info("Seeded 13 Contact Tickets (2 NEW/HIGH, 2 NEW/NORMAL, 1 READ, " +
        "2 IN_PROGRESS, 2 REPLIED, 2 RESOLVED, 2 CLOSED)");
  }

  private void createTicket(int seed, String name, String email,
      ContactCategory category, String otherCategory, ContactUrgency urgency,
      String subject, String message, ContactStatus status,
      String ipAddress, String adminNotes) {

    ContactTicket ticket = ContactTicket.builder()
        .id(SeedUtil.generateUUID(seed))
        .name(name)
        .email(email)
        .category(category)
        .otherCategory(otherCategory)
        .urgency(urgency)
        .subject(subject)
        .message(message)
        .status(status)
        .ipAddress(ipAddress)
        .adminNotes(adminNotes)
        .build();

    contactTicketRepository.save(ticket);
  }
}
