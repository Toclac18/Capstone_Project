package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.ImportJob;
import com.capstone.be.domain.entity.ImportRowResult;
import com.capstone.be.domain.enums.ImportStatus;
import com.capstone.be.dto.response.importReader.ProgressUpdate;
import com.capstone.be.repository.ImportJobRepository;
import com.capstone.be.service.EmailService;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.InputStream;

@Service
public class ImportProcessor {
    private final ImportJobRepository repo;
    private final EmailService emailService;
    private final ProgressBroadcaster broadcaster;
    private final DataFormatter fmt = new DataFormatter();

    public ImportProcessor(ImportJobRepository repo, EmailService emailService, ProgressBroadcaster broadcaster) {
        this.repo = repo;
        this.emailService = emailService;
        this.broadcaster = broadcaster;
    }

    @Async
    public void process(String jobId, byte[] excelBytes) {
        ImportJob job = repo.findById(jobId).orElse(null);
        if (job == null) return;

        int success = 0, fail = 0, total;

        try (InputStream is = new ByteArrayInputStream(excelBytes);
             XSSFWorkbook wb = new XSSFWorkbook(is)) {

            Sheet sheet = wb.getSheetAt(0);
            total = Math.max(0, sheet.getLastRowNum()); // header at row0

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                String fullName = get(row,0);
                String username = get(row,1);
                String email    = get(row,2);

                ImportRowResult rr = new ImportRowResult();
                rr.setRow(i+1);
                rr.setFullName(fullName);
                rr.setUsername(username);
                rr.setEmail(email);

                boolean imported = username != null && !username.isBlank()
                        && email != null && email.contains("@");
                rr.setImported(imported);
                if (imported) {
                    boolean sent = emailService.sendWelcomeEmail(email, username, "Temp#1234");
                    rr.setEmailSent(sent);
                    success++;
                } else {
                    rr.setError("Validation failed");
                    fail++;
                }
                job.getResults().add(rr);

                if (i % 10 == 0 || i == sheet.getLastRowNum()) {
                    job.setTotalRows(job.getResults().size());        // sau header
                    job.setProcessedRows(job.getResults().size());
                    job.setSuccessCount(success);
                    job.setFailureCount(fail);
                    job.setStatus(ImportStatus.PROCESSING);
                    repo.save(job);

                    ProgressUpdate up = new ProgressUpdate();
                    up.jobId = jobId;
                    up.totalRows = Math.max(total, job.getTotalRows());
                    up.processedRows = job.getProcessedRows();
                    up.successCount = success;
                    up.failureCount = fail;
                    up.status = "PROCESSING";
                    up.percent = up.totalRows == 0 ? 0 : Math.min(100, (int)Math.round(100.0 * up.processedRows / up.totalRows));
                    broadcaster.send(jobId, "progress", up);
                }
            }

            job.setStatus(fail==0 ? ImportStatus.COMPLETED : (success>0 ? ImportStatus.COMPLETED : ImportStatus.FAILED));
            repo.save(job);

            ProgressUpdate done = new ProgressUpdate();
            done.jobId = jobId;
            done.totalRows = job.getTotalRows();
            done.processedRows = job.getProcessedRows();
            done.successCount = success;
            done.failureCount = fail;
            done.status = job.getStatus().name();
            done.percent = 100;
            broadcaster.send(jobId, "progress", done);
            broadcaster.complete(jobId);

        } catch (Exception e) {
            job.setStatus(ImportStatus.FAILED);
            job.setFailureCount(job.getFailureCount()+1);
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

    private String get(Row r, int i) {
        try { var c = r.getCell(i); return c==null ? null : fmt.formatCellValue(c).trim(); }
        catch (Exception e) { return null; }
    }
}
