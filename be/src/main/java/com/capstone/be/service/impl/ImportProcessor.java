package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.ImportJob;
import com.capstone.be.domain.entity.ImportRowResult;
import com.capstone.be.domain.entity.Invitation;
import com.capstone.be.domain.enums.ImportStatus;
import com.capstone.be.dto.response.importReader.ProgressUpdate;
import com.capstone.be.dto.response.importReader.RowUpdate;
import com.capstone.be.repository.ImportJobRepository;
import com.capstone.be.repository.ImportRowResultRepository;
import com.capstone.be.repository.InvitationRepository;
import com.capstone.be.security.util.JwtUtil;
import com.capstone.be.service.EmailService;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.time.ZoneId;

@Component
public class ImportProcessor {

    private static final int PROGRESS_BATCH = 10;
    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final String VERIFY_URL = "http://localhost:3000/verify-org-invitation";
    private final ImportJobRepository jobRepo;
    private final ImportRowResultRepository rowRepo;
    private final EmailService emailService;
    private final ProgressBroadcaster broadcaster;
    private final InvitationRepository invitationRepo;
    private final JwtUtil jwtUtil;

    public ImportProcessor(
            ImportJobRepository jobRepo,
            ImportRowResultRepository rowRepo,
            EmailService emailService,
            ProgressBroadcaster broadcaster,
            InvitationRepository invitationRepo,
            JwtUtil jwtUtil) {
        this.jobRepo = jobRepo;
        this.rowRepo = rowRepo;
        this.emailService = emailService;
        this.broadcaster = broadcaster;
        this.invitationRepo = invitationRepo;
        this.jwtUtil = jwtUtil;
    }

    @Async("taskExecutor")
    public void process(String jobId, byte[] excelBytes, String createdBy) {
        ImportJob job = jobRepo.findById(jobId).orElseThrow();
        try (XSSFWorkbook wb = new XSSFWorkbook(new ByteArrayInputStream(excelBytes))) {
            Sheet sheet = wb.getSheetAt(0);
            DataFormatter fmt = new DataFormatter();

            int lastRow = sheet.getLastRowNum(); // 0-based, header at 0
            job.setTotalRows(Math.max(0, lastRow));
            job.setStatus(ImportStatus.PROCESSING);
            jobRepo.save(job);

            int processed = 0, success = 0, failure = 0;

            for (int i = 1; i <= lastRow; i++) {
                Row excelRow = sheet.getRow(i);
                if (excelRow == null) continue;

                String fullName = fmt.formatCellValue(excelRow.getCell(0)).trim();
                String username = fmt.formatCellValue(excelRow.getCell(1)).trim();
                String email = fmt.formatCellValue(excelRow.getCell(2)).trim();

                ImportRowResult rr = new ImportRowResult();
                rr.setRow(i + 1);
                rr.setFullName(fullName);
                rr.setUsername(username);
                rr.setEmail(email);
                rr.setImported(false);
                rr.setEmailSent(false);
                rr.setError(null);
                rr.setJob(job);
                rowRepo.save(rr);

                boolean valid = username != null && !username.isBlank() && email != null && email.contains("@");
                if (valid) {
                    boolean sent = false;
                    String orgId = job.getCreatedBy();
                    try {
                        String token = jwtUtil.generateUrlVerifyToken(orgId, email);

                        OffsetDateTime now = OffsetDateTime.now(VN_ZONE);
                        OffsetDateTime expiresAt = now.plus(
                                Duration.ofMillis(jwtUtil.getEmailVerificationExpirationMs())
                        );

                        Invitation inv = new Invitation();
                        inv.setEmail(email);
                        inv.setUsername(username);
                        inv.setToken(token);
                        inv.setCreatedAt(now);
                        inv.setExpiresAt(expiresAt);
                        inv.setCreatedBy(createdBy);
                        inv.setAccepted(false);
                        invitationRepo.save(inv);

                        String verifyLink = VERIFY_URL + "?token=" + token;
                        sent = emailService.sendInvitationEmail(email, username, verifyLink, expiresAt);
                    } catch (Exception ex) {
                        sent = false;
                    }
                    rr.setImported(true);
                    rr.setEmailSent(sent);
                    rowRepo.save(rr);
                    success++;
                } else {
                    rr.setImported(false);
                    rr.setEmailSent(false);
                    rr.setError("Validation failed");
                    rowRepo.save(rr);
                    failure++;
                }

                processed++;
                job.setProcessedRows(processed);
                job.setSuccessCount(success);
                job.setFailureCount(failure);

                RowUpdate ru = new RowUpdate();
                ru.jobId = job.getId();
                ru.row = rr.getRow();
                ru.fullName = fullName;
                ru.username = username;
                ru.email = email;
                ru.imported = rr.isImported();
                ru.emailSent = rr.isEmailSent();
                ru.error = rr.getError();
                ru.processedRows = processed;
                ru.totalRows = job.getTotalRows();
                ru.successCount = success;
                ru.failureCount = failure;
                ru.percent = percent(processed, job.getTotalRows());
                broadcaster.send(job.getId(), "row", ru);

                if (processed % PROGRESS_BATCH == 0 || i == lastRow) {
                    jobRepo.save(job);
                    ProgressUpdate pu = new ProgressUpdate();
                    pu.jobId = job.getId();
                    pu.processedRows = processed;
                    pu.totalRows = job.getTotalRows();
                    pu.successCount = success;
                    pu.failureCount = failure;
                    pu.status = job.getStatus().name();
                    pu.percent = percent(processed, job.getTotalRows());
                    broadcaster.send(job.getId(), "progress", pu);
                }
            }

            job.setStatus(ImportStatus.COMPLETED);
            jobRepo.save(job);

            ProgressUpdate end = new ProgressUpdate();
            end.jobId = job.getId();
            end.processedRows = processed;
            end.totalRows = job.getTotalRows();
            end.successCount = success;
            end.failureCount = failure;
            end.status = job.getStatus().name();
            end.percent = 100;
            broadcaster.send(job.getId(), "progress", end);
            broadcaster.complete(job.getId());

        } catch (Exception e) {
            job.setStatus(ImportStatus.FAILED);
            jobRepo.save(job);

            ProgressUpdate end = new ProgressUpdate();
            end.jobId = job.getId();
            end.processedRows = job.getProcessedRows();
            end.totalRows = job.getTotalRows();
            end.successCount = job.getSuccessCount();
            end.failureCount = job.getFailureCount();
            end.status = job.getStatus().name();
            end.percent = 100;
            broadcaster.send(job.getId(), "progress", end);
            broadcaster.complete(job.getId());
        }
    }

    private int percent(int processed, int total) {
        if (total <= 0) return 0;
        int p = (int) Math.round(processed * 100.0 / total);
        return Math.max(0, Math.min(100, p));
    }
}