package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.ImportJob;
import com.capstone.be.domain.enums.ImportStatus;
import com.capstone.be.dto.response.importReader.ImportDetailResponse;
import com.capstone.be.dto.response.importReader.ImportListItemResponse;
import com.capstone.be.dto.response.importReader.ImportListResponse;
import com.capstone.be.mapper.ImportMapper;
import com.capstone.be.repository.ImportJobRepository;
import com.capstone.be.service.ImportService;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ImportServiceImpl implements ImportService {

    private final ImportJobRepository repo;
    private final ImportProcessor processor;

    public ImportServiceImpl(ImportJobRepository repo, ImportProcessor processor) {
        this.repo = repo;
        this.processor = processor;
    }

    @Override
    public ImportListResponse list(int page, int pageSize, String q, String status) {
        List<ImportJob> all = repo.findAll();
        var filtered = all.stream()
                .filter(j -> q == null || q.isBlank()
                        || (j.getFileName() != null && j.getFileName().toLowerCase().contains(q.toLowerCase()))
                        || (j.getCreatedBy() != null && j.getCreatedBy().toLowerCase().contains(q.toLowerCase()))
                        || (j.getStatus() != null && j.getStatus().name().toLowerCase().contains(q.toLowerCase())))
                .filter(j -> "ALL".equalsIgnoreCase(status)
                        || (j.getStatus() != null && j.getStatus().name().equalsIgnoreCase(status)))
                .sorted(Comparator.comparing(ImportJob::getCreatedAt).reversed())
                .collect(Collectors.toList());

        long total = filtered.size();
        int from = Math.max(0, (page - 1) * pageSize);
        int to = Math.min(filtered.size(), from + pageSize);
        List<ImportListItemResponse> items = filtered.subList(from, to).stream()
                .map(ImportMapper::toItem)
                .collect(Collectors.toList());

        ImportListResponse res = new ImportListResponse();
        res.items = items;
        res.total = total;
        res.page = page;
        res.pageSize = pageSize;
        return res;
    }

    @Override
    public ImportDetailResponse detail(String id) {
        var job = repo.findByIdWithResults(id).orElseThrow();
        return ImportMapper.toDetail(job);
    }

    @Override
    public ImportDetailResponse create(MultipartFile file, String createdBy) {
        try {
            ImportJob job = new ImportJob();
            job.setFileName(file.getOriginalFilename());
            job.setCreatedAt(OffsetDateTime.now());
            job.setCreatedBy(createdBy);
            job.setStatus(ImportStatus.PROCESSING);
            repo.save(job);
            byte[] data = file.getBytes();
            processor.process(job.getId(), data, createdBy);
            return ImportMapper.toDetail(job);
        } catch (Exception e) {
            throw new RuntimeException("Failed to create import job", e);
        }
    }

    @Override
    public String csvResult(String id) {
        var job = repo.findByIdWithResults(id).orElseThrow();
        StringBuilder sb = new StringBuilder();
        sb.append("Row,Full Name,Username,Email,Imported,Email Sent,Error\n");
        job.getResults().forEach(r -> {
            sb.append(r.getRow()).append(",");
            sb.append(escapeCsv(r.getFullName())).append(",");
            sb.append(escapeCsv(r.getUsername())).append(",");
            sb.append(escapeCsv(r.getEmail())).append(",");
            sb.append(r.isImported()).append(",");
            sb.append(r.isEmailSent()).append(",");
            sb.append(escapeCsv(r.getError())).append("\n");
        });
        return sb.toString();
    }

    private String escapeCsv(String s) {
        if (s == null) return "";
        if (s.contains(",") || s.contains("\"") || s.contains("\n")) {
            return "\"" + s.replace("\"", "\"\"") + "\"";
        }
        return s;
    }

    @Override
    public byte[] templateExcel() {
        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet("Template");
            Font headerFont = wb.createFont();
            headerFont.setBold(true);
            CellStyle header = wb.createCellStyle();
            header.setFont(headerFont);

            Row h = sheet.createRow(0);
            String[] cols = {"Full Name", "Username", "Email"};
            for (int i = 0; i < cols.length; i++) {
                Cell c = h.createCell(i);
                c.setCellValue(cols[i]);
                c.setCellStyle(header);
            }
            Object[][] samples = {
                    {"John Doe", "johnd", "john@example.com"},
                    {"Mary Tran", "maryt", "mary@example.com"},
                    {"Alex Kim", "alexk", "alex@example.com"},
                    {"Linh Nguyen", "linhn", "linh@example.com"},
                    {"David Lee", "davidl", "david@example.com"}
            };
            for (int r = 0; r < samples.length; r++) {
                Row row = sheet.createRow(r + 1);
                for (int c = 0; c < samples[r].length; c++) {
                    row.createCell(c).setCellValue(samples[r][c].toString());
                }
            }
            for (int i = 0; i < cols.length; i++) sheet.autoSizeColumn(i);
            wb.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to build template", e);
        }
    }
}
