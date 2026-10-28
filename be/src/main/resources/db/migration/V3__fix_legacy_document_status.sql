-- Chuyển từ config/seed/DocumentStatusFixer.java.
--
-- 'VERIFIED' và 'AI_VERIFIED' không còn trong enum DocStatus; dữ liệu cũ mang
-- hai giá trị này không map được về enum và sẽ lỗi khi Hibernate đọc lên.
--
-- Bản Java chạy UPDATE này mỗi lần app khởi động (@Profile("!test")) dù javadoc
-- gọi nó là "one-time migration". Flyway chạy đúng một lần cho mỗi database.
--
-- status là varchar: Document.status dùng @Enumerated(EnumType.STRING).

UPDATE document
SET status = 'PENDING_REVIEW'
WHERE status IN ('VERIFIED', 'AI_VERIFIED');
