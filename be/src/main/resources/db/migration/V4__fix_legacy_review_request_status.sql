-- Chuyển từ config/seed/ReviewRequestStatusFixer.java.
--
-- 'COMPLETED' không còn trong enum ReviewRequestStatus. Theo comment của bản Java,
-- giá trị này vốn để chỉ "review đã xong", tương ứng 'ACCEPTED'.
--
-- Bản Java chạy UPDATE này mỗi lần app khởi động (@Profile("!test")).
-- Flyway chạy đúng một lần cho mỗi database.
--
-- status là varchar: ReviewRequest.status dùng @Enumerated(EnumType.STRING).

UPDATE review_request
SET status = 'ACCEPTED'
WHERE status = 'COMPLETED';
