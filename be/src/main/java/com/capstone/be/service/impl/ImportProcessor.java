package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.ImportJob;
import com.capstone.be.domain.entity.ImportRowResult;
import com.capstone.be.domain.enums.ImportStatus;
import com.capstone.be.dto.response.importReader.ProgressUpdate;
import com.capstone.be.dto.response.importReader.RowUpdate;
import com.capstone.be.repository.ImportJobRepository;
import com.capstone.be.service.EmailService;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.InputStream;

/**
 * ImportProcessor
 * - Read Excel (XLSX) and process each row
 * - Send per-row SSE ("row") right after each row is processed
 * - Send periodic SSE ("progress") every BATCH rows (and at the end)
 * - Save intermediate progress to repository to keep detail API in-sync
 */
@Service
public class ImportProcessor {

    private static final int PROGRESS_BATCH = 10; // send progress event every N rows

    private final ImportJobRepository repo;
    private final EmailService emailService;
    private final ProgressBroadcaster broadcaster;
    private final DataFormatter fmt = new DataFormatter();

    public ImportProcessor(ImportJobRepository repo,
                           EmailService emailService,
                           ProgressBroadcaster broadcaster) {
        this.repo = repo;
        this.emailService = emailService;
        this.broadcaster = broadcaster;
    }

    @Async
    public void process(String jobId, byte[] excelBytes) {
        ImportJob job = repo.findById(jobId).orElse(null);
        if (job == null) return;

        int success = 0;
        int fail = 0;

        try (InputStream is = new ByteArrayInputStream(excelBytes);
             XSSFWorkbook wb = new XSSFWorkbook(is)) {

            Sheet sheet = wb.getSheetAt(0);
            // Assume row 0 is header; lastRowNum is 0-based; totalRows excludes header
            final int lastRow = sheet.getLastRowNum();
            final int totalRows = Math.max(0, lastRow);

            // Initialize job counters
            job.setStatus(ImportStatus.PROCESSING);
            job.setTotalRows(totalRows);
            job.setProcessedRows(0);
            job.setSuccessCount(0);
            job.setFailureCount(0);
            repo.save(job);

            for (int i = 1; i <= lastRow; i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                final String fullName = get(row, 0);
                final String username = get(row, 1);
                final String email    = get(row, 2);

                ImportRowResult rr = new ImportRowResult();
                rr.setRow(i + 1); // 1-based, header at 1 => data starts at 2
                rr.setFullName(fullName);
                rr.setUsername(username);
                rr.setEmail(email);

                boolean valid = isValid(username, email);
                if (valid) {
                    boolean sent = false;
                    try {
                        // You can generate / lookup the initial password from your domain
                        sent = emailService.sendWelcomeEmail(email, username, "Temp#1234");
                    } catch (Exception mailEx) {
                        // Email failure should not block the import; mark imported but emailSent=false
                        sent = false;
                    }
                    rr.setImported(true);
                    rr.setEmailSent(sent);
                    success++;
                } else {
                    rr.setImported(false);
                    rr.setEmailSent(false);
                    rr.setError("Validation failed");
                    fail++;
                }

                // append result & update job counters
                job.getResults().add(rr);
                job.setProcessedRows(job.getResults().size());
                job.setSuccessCount(success);
                job.setFailureCount(fail);

                RowUpdate ru = new RowUpdate();
                ru.jobId = jobId;
                ru.row = rr.getRow();
                ru.fullName = rr.getFullName();
                ru.username = rr.getUsername();
                ru.email = rr.getEmail();
                ru.imported = rr.isImported();
                ru.emailSent = rr.isEmailSent();
                ru.error = rr.getError();

                ru.processedRows = job.getProcessedRows();
                ru.totalRows = totalRows;
                ru.successCount = success;
                ru.failureCount = fail;
                ru.percent = computePercent(ru.processedRows, ru.totalRows);
                broadcaster.send(jobId, "row", ru);

                // Persist & send progress periodically or at last row
                if (i % PROGRESS_BATCH == 0 || i == lastRow) {
                    job.setStatus(ImportStatus.PROCESSING);
                    repo.save(job);

                    ProgressUpdate up = new ProgressUpdate();
                    up.jobId = jobId;
                    up.totalRows = totalRows;
                    up.processedRows = job.getProcessedRows();
                    up.successCount = success;
                    up.failureCount = fail;
                    up.status = job.getStatus().name();
                    up.percent = computePercent(up.processedRows, up.totalRows);
                    broadcaster.send(jobId, "progress", up);
                }
            }

            // Finalize status
            job.setStatus(ImportStatus.COMPLETED);
            repo.save(job);

            // Final progress = 100
            ProgressUpdate done = new ProgressUpdate();
            done.jobId = jobId;
            done.totalRows = job.getTotalRows();
            done.processedRows = job.getProcessedRows();
            done.successCount = job.getSuccessCount();
            done.failureCount = job.getFailureCount();
            done.status = job.getStatus().name();
            done.percent = 100;
            broadcaster.send(jobId, "progress", done);
            broadcaster.complete(jobId);

        } catch (Exception e) {
            // Mark job failed and close the stream
            job.setStatus(ImportStatus.FAILED);
            repo.save(job);

            ProgressUpdate err = new ProgressUpdate();
            err.jobId = jobId;
            err.totalRows = job.getTotalRows();
            err.processedRows = job.getProcessedRows();
            err.successCount = job.getSuccessCount();
            err.failureCount = job.getFailureCount();
            err.status = "FAILED";
            err.percent = 100;
            broadcaster.send(jobId, "progress", err);
            broadcaster.complete(jobId);
        }
    }

    // ===== helpers =====

    private String get(Row r, int i) {
        try {
            Cell c = r.getCell(i);
            return c == null ? null : fmt.formatCellValue(c).trim();
        } catch (Exception e) {
            return null;
        }
    }

    private boolean isValid(String username, String email) {
        if (username == null || username.isBlank()) return false;
        if (email == null || email.isBlank()) return false;
        return email.contains("@");
    }

    private int computePercent(int processed, int total) {
        if (total <= 0) return 0;
        int p = (int) Math.round(100.0 * processed / total);
        return Math.max(0, Math.min(100, p));
    }
}
