-- Chuyển từ config/migration/AiProcessingJobTableMigration.java (DDL viết tay bằng JdbcTemplate).
-- Giữ IF NOT EXISTS để migration idempotent: các DB hiện có đã được bảng này tạo sẵn
-- bởi component cũ hoặc bởi ddl-auto, nên V2 phải chạy được mà không lỗi trên cả hai trường hợp.

CREATE TABLE IF NOT EXISTS ai_processing_jobs (
    id                      UUID PRIMARY KEY,
    document_id             UUID NOT NULL,
    job_id                  VARCHAR(100) NOT NULL UNIQUE,
    status                  VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    filename                VARCHAR(500),
    error_message           TEXT,
    callback_url            VARCHAR(500),
    started_at              BIGINT,
    completed_at            BIGINT,
    processing_time_seconds DOUBLE PRECISION,
    created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ai_processing_jobs_document
        FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ai_processing_jobs_job_id      ON ai_processing_jobs (job_id);
CREATE INDEX IF NOT EXISTS idx_ai_processing_jobs_document_id ON ai_processing_jobs (document_id);
CREATE INDEX IF NOT EXISTS idx_ai_processing_jobs_status      ON ai_processing_jobs (status);
CREATE INDEX IF NOT EXISTS idx_ai_processing_jobs_created_at  ON ai_processing_jobs (created_at);
