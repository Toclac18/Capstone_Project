package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.ImportJob;
import com.capstone.be.domain.entity.ImportRowResult;
import com.capstone.be.domain.enums.ImportStatus;
import com.capstone.be.dto.response.importReader.ImportDetailResponse;
import com.capstone.be.dto.response.importReader.ImportListResponse;
import com.capstone.be.mapper.ImportMapper;
import com.capstone.be.repository.ImportJobRepository;
import com.capstone.be.service.EmailService;
import com.capstone.be.service.ImportService;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.*;
import java.util.stream.Collectors;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ImportServiceImpl implements ImportService {
  private final ImportJobRepository repo;
  private final EmailService emailService;

  public ImportServiceImpl(ImportJobRepository repo, EmailService emailService) {
    this.repo = repo;
    this.emailService = emailService;
    seed();
  }

  private void seed() {
    if (!repo.findAll().isEmpty()) return;

    ImportJob a = new ImportJob();
    a.setFileName("users_batch_oct15.xlsx");
    a.setCreatedBy("alice.nguyen");
    a.setStatus(ImportStatus.COMPLETED);
    a.setTotalRows(5);
    a.setProcessedRows(5);
    a.setSuccessCount(4);
    a.setFailureCount(1);
    a.getResults().add(makeRow(2, "Jane Roe", "jroe", "jroe@ex.com", true, true, null));
    a.getResults().add(makeRow(3, "Mark Li", "mli", "mli@ex.com", true, true, null));
    a.getResults().add(makeRow(4, "Zoë K", "zoek", "zoek@ex.com", true, true, null));
    a.getResults()
        .add(makeRow(5, "Chris P", "chrisp", "chrisp@ex.com", false, false, "Duplicate username"));
    a.getResults().add(makeRow(6, "Ana M", "anam", "anam@ex.com", true, true, null));
    repo.save(a);

    ImportJob b = new ImportJob();
    b.setFileName("readers_nov.xlsx");
    b.setCreatedBy("bob.tran");
    b.setStatus(ImportStatus.COMPLETED);
    b.setTotalRows(3);
    b.setProcessedRows(3);
    b.setSuccessCount(3);
    b.setFailureCount(0);
    b.getResults().add(makeRow(2, "Hana T", "hanat", "hana@ex.com", true, true, null));
    b.getResults().add(makeRow(3, "Ivo N", "ivon", "ivo@ex.com", true, true, null));
    b.getResults().add(makeRow(4, "Quynh P", "quynhp", "quynh@ex.com", true, true, null));
    repo.save(b);
  }

  private ImportRowResult makeRow(
      int row, String fn, String un, String em, boolean imp, boolean sent, String err) {
    ImportRowResult r = new ImportRowResult();
    r.setRow(row);
    r.setFullName(fn);
    r.setUsername(un);
    r.setEmail(em);
    r.setImported(imp);
    r.setEmailSent(sent);
    r.setError(err);
    return r;
  }

  @Override
  public ImportListResponse list(int page, int pageSize, String q, String status) {
    java.util.List<ImportJob> all = new java.util.ArrayList<>(repo.findAll());

    String kw = q == null ? "" : q.trim().toLowerCase(Locale.ROOT);
    if (!kw.isEmpty()) {
      all =
          all.stream()
              .filter(
                  j ->
                      (j.getFileName() + " " + j.getCreatedBy() + " " + j.getStatus())
                          .toLowerCase(Locale.ROOT)
                          .contains(kw))
              .collect(Collectors.toList());
    }
    if (status != null && !status.equalsIgnoreCase("ALL")) {
      try {
        var st = ImportStatus.valueOf(status.toUpperCase(Locale.ROOT));
        all = all.stream().filter(j -> j.getStatus() == st).collect(Collectors.toList());
      } catch (IllegalArgumentException ignored) {
      }
    }

    all.sort(Comparator.comparing(ImportJob::getCreatedAt).reversed());
    int total = all.size();
    int from = Math.max(0, (page - 1) * pageSize);
    int to = Math.min(total, from + pageSize);
    java.util.List<ImportJob> pageList = from >= to ? java.util.List.of() : all.subList(from, to);

    ImportListResponse out = new ImportListResponse();
    out.items = pageList.stream().map(ImportMapper::toItem).collect(Collectors.toList());
    out.total = total;
    out.page = page;
    out.pageSize = pageSize;
    return out;
  }

  @Override
  public ImportDetailResponse detail(String id) {
    ImportJob j = repo.findById(id).orElseThrow(() -> new RuntimeException("Not found"));
    return ImportMapper.toDetail(j);
  }

  @Override
  public ImportDetailResponse create(MultipartFile file, String createdBy) {
    try (InputStream is = file.getInputStream();
        XSSFWorkbook wb = new XSSFWorkbook(is)) {
      ImportJob job = new ImportJob();
      job.setFileName(file.getOriginalFilename());
      job.setCreatedBy(createdBy);
      job.setStatus(ImportStatus.PROCESSING);

      Sheet sheet = wb.getSheetAt(0);
      int success = 0, fail = 0;

      for (int i = 1; i <= sheet.getLastRowNum(); i++) { // row 0 = header
        Row row = sheet.getRow(i);
        if (row == null) continue;

        String fullName = getStr(row, 0);
        String username = getStr(row, 1);
        String email = getStr(row, 2);

        ImportRowResult rr = new ImportRowResult();
        rr.setRow(i + 1);
        rr.setFullName(fullName);
        rr.setUsername(username);
        rr.setEmail(email);

        boolean imported =
            username != null && !username.isBlank() && email != null && email.contains("@");
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
      }

      job.setTotalRows(job.getResults().size());
      job.setProcessedRows(job.getResults().size());
      job.setSuccessCount(success);
      job.setFailureCount(fail);
      job.setStatus(
          fail == 0
              ? ImportStatus.COMPLETED
              : (success > 0 ? ImportStatus.COMPLETED : ImportStatus.FAILED));

      repo.save(job);
      return ImportMapper.toDetail(job);
    } catch (Exception e) {
      throw new RuntimeException("Upload parse failed: " + e.getMessage(), e);
    }
  }

  private String getStr(Row r, int idx) {
    try {
      return r.getCell(idx) == null ? null : r.getCell(idx).getStringCellValue();
    } catch (Exception e) {
      return null;
    }
  }

  @Override
  public String csvResult(String id) {
    ImportJob j = repo.findById(id).orElseThrow(() -> new RuntimeException("Not found"));
    StringBuilder sb = new StringBuilder();
    sb.append("Row,Full Name,Username,Email,Imported,Email Sent,Error\n");
    for (var r : j.getResults()) {
      sb.append(r.getRow())
          .append(',')
          .append(csv(r.getFullName()))
          .append(',')
          .append(csv(r.getUsername()))
          .append(',')
          .append(csv(r.getEmail()))
          .append(',')
          .append(r.isImported())
          .append(',')
          .append(r.isEmailSent())
          .append(',')
          .append(csv(r.getError()))
          .append('\n');
    }
    return sb.toString();
  }

  private String csv(String s) {
    if (s == null) return "";
    if (s.contains(",")) return "\"" + s.replace("\"", "\"\"") + "\"";
    return s;
  }

  @Override
  public byte[] templateExcel() {
    try (XSSFWorkbook wb = new XSSFWorkbook()) {
      Sheet sheet = wb.createSheet("Template");

      // Style header (đậm)
      Font bold = wb.createFont();
      bold.setBold(true);
      CellStyle headerStyle = wb.createCellStyle();
      headerStyle.setFont(bold);

      // Header
      Row h = sheet.createRow(0);
      String[] headers = {"Full Name", "Username", "Email"};
      for (int i = 0; i < headers.length; i++) {
        Cell c = h.createCell(i);
        c.setCellValue(headers[i]);
        c.setCellStyle(headerStyle);
      }

      // 5 dòng mẫu
      String[][] sample = {
        {"John Doe", "jdoe", "jdoe@example.com"},
        {"Mary Tran", "mtran", "mtran@example.com"},
        {"Lee Wong", "lwong", "lwong@example.com"},
        {"Ana Maria", "anam", "anam@example.com"},
        {"David Kim", "dkim", "dkim@example.com"}
      };

      for (int r = 0; r < sample.length; r++) {
        Row row = sheet.createRow(r + 1);
        for (int c = 0; c < sample[r].length; c++) {
          row.createCell(c).setCellValue(sample[r][c]);
        }
      }

      // Auto-size cột
      for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);

      ByteArrayOutputStream out = new ByteArrayOutputStream();
      wb.write(out);
      return out.toByteArray();
    } catch (Exception e) {
      throw new RuntimeException("Failed to generate template: " + e.getMessage(), e);
    }
  }
}
