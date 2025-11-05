package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.ImportJob;
import com.capstone.be.domain.entity.ImportRowResult;
import com.capstone.be.domain.enums.ImportStatus;
import com.capstone.be.dto.response.importReader.ImportDetailResponse;
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
import java.util.*;
import java.util.stream.Collectors;

/**
 * ImportServiceImpl
 * - list/detail/csvResult: giữ nguyên hành vi
 * - create(): TẠO JOB và KÍCH HOẠT XỬ LÝ NỀN (async) qua ImportProcessor để tránh timeout
 * - templateExcel(): tạo file .xlsx thật với 5 dòng mẫu
 */
@Service
public class ImportServiceImpl implements ImportService {

  private final ImportJobRepository repo;
  private final ImportProcessor processor;

  public ImportServiceImpl(ImportJobRepository repo,
                           ImportProcessor processor) {
    this.repo = repo;
    this.processor = processor;
    seed();
  }

  @Override
  public ImportListResponse list(int page, int pageSize, String q, String status) {
    List<ImportJob> all = new ArrayList<>(repo.findAll());

    String kw = q == null ? "" : q.trim().toLowerCase(Locale.ROOT);
    if (!kw.isEmpty()) {
      all = all.stream()
              .filter(j ->
                      (safe(j.getFileName()) + " " +
                              safe(j.getCreatedBy()) + " " +
                              safe(String.valueOf(j.getStatus())))
                              .toLowerCase(Locale.ROOT)
                              .contains(kw))
              .collect(Collectors.toList());
    }

    if (status != null && !status.equalsIgnoreCase("ALL")) {
      try {
          ImportStatus finalSt = ImportStatus.valueOf(status.toUpperCase(Locale.ROOT));
        all = all.stream().filter(j -> j.getStatus() == finalSt).collect(Collectors.toList());
      } catch (IllegalArgumentException ignored) {}
    }

    all.sort(Comparator.comparing(ImportJob::getCreatedAt).reversed());

    int total = all.size();
    int from = Math.max(0, (page - 1) * pageSize);
    int to = Math.min(total, from + pageSize);
    List<ImportJob> pageList = (from >= to) ? Collections.emptyList() : all.subList(from, to);

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

  /**
   * Tạo job mới và kích hoạt xử lý nền (đọc Excel + gửi mail).
   * Trả về ngay để FE redirect sang trang chi tiết và poll.
   */
  @Override
  public ImportDetailResponse create(MultipartFile file, String createdBy) {
    try {
      ImportJob job = new ImportJob();
      job.setFileName(file.getOriginalFilename());
      job.setCreatedBy(createdBy);
      job.setStatus(ImportStatus.PROCESSING);
      job.setCreatedAt(OffsetDateTime.now());
      repo.save(job);

      byte[] bytes;
      try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
        file.getInputStream().transferTo(out);
        bytes = out.toByteArray();
      }

      processor.process(job.getId(), bytes);

      return ImportMapper.toDetail(job);

    } catch (Exception e) {
      throw new RuntimeException("Upload failed: " + e.getMessage(), e);
    }
  }

  @Override
  public String csvResult(String id) {
    ImportJob j = repo.findById(id).orElseThrow(() -> new RuntimeException("Not found"));
    StringBuilder sb = new StringBuilder();
    sb.append("Row,Full Name,Username,Email,Imported,Email Sent,Error\n");
    for (var r : j.getResults()) {
      sb.append(r.getRow()).append(',')
              .append(csv(r.getFullName())).append(',')
              .append(csv(r.getUsername())).append(',')
              .append(csv(r.getEmail())).append(',')
              .append(r.isImported()).append(',')
              .append(r.isEmailSent()).append(',')
              .append(csv(r.getError())).append('\n');
    }
    return sb.toString();
  }

  /**
   * Tạo file Excel template (.xlsx) thật với 5 dòng mẫu.
   */
  @Override
  public byte[] templateExcel() {
    try (XSSFWorkbook wb = new XSSFWorkbook()) {
      Sheet sheet = wb.createSheet("Template");

      // style header
      Font bold = wb.createFont();
      bold.setBold(true);
      CellStyle headerStyle = wb.createCellStyle();
      headerStyle.setFont(bold);

      // header
      Row h = sheet.createRow(0);
      String[] headers = {"Full Name", "Username", "Email"};
      for (int i = 0; i < headers.length; i++) {
        Cell c = h.createCell(i);
        c.setCellValue(headers[i]);
        c.setCellStyle(headerStyle);
      }

      // 5 mẫu
      String[][] sample = {
              {"John Doe",  "jdoe",  "jdoe@example.com"},
              {"Mary Tran", "mtran", "mtran@example.com"},
              {"Lee Wong",  "lwong", "lwong@example.com"},
              {"Ana Maria", "anam",  "anam@example.com"},
              {"David Kim", "dkim",  "dkim@example.com"}
      };
      for (int r = 0; r < sample.length; r++) {
        Row row = sheet.createRow(r + 1);
        for (int c = 0; c < sample[r].length; c++) {
          row.createCell(c).setCellValue(sample[r][c]);
        }
      }

      for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);

      try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
        wb.write(out);
        return out.toByteArray();
      }
    } catch (Exception e) {
      throw new RuntimeException("Failed to generate template: " + e.getMessage(), e);
    }
  }

  private String safe(String s) {
    return s == null ? "" : s;
  }

  private String csv(String s) {
    if (s == null) return "";
    if (s.contains(",")) return "\"" + s.replace("\"", "\"\"") + "\"";
    return s;
  }

  /**
   * Seed 2 job mẫu để FE thấy danh sách ngay (mock).
   */
  private void seed() {
    if (!repo.findAll().isEmpty()) return;

    ImportJob a = new ImportJob();
    a.setFileName("users_batch_oct15.xlsx");
    a.setCreatedBy("alice.nguyen");
    a.setStatus(ImportStatus.COMPLETED);
    a.setCreatedAt(OffsetDateTime.now().minusDays(2));
    a.setTotalRows(5);
    a.setProcessedRows(5);
    a.setSuccessCount(4);
    a.setFailureCount(1);
    a.getResults().add(row(2, "Jane Roe", "jroe", "jroe@ex.com", true,  true,  null));
    a.getResults().add(row(3, "Mark Li",  "mli",  "mli@ex.com",  true,  true,  null));
    a.getResults().add(row(4, "Zoë K",    "zoek", "zoek@ex.com", true,  true,  null));
    a.getResults().add(row(5, "Chris P",  "chrisp","chrisp@ex.com", false, false, "Duplicate username"));
    a.getResults().add(row(6, "Ana M",    "anam", "anam@ex.com",  true,  true,  null));
    repo.save(a);

    ImportJob b = new ImportJob();
    b.setFileName("readers_nov.xlsx");
    b.setCreatedBy("bob.tran");
    b.setStatus(ImportStatus.COMPLETED);
    b.setCreatedAt(OffsetDateTime.now().minusDays(1));
    b.setTotalRows(3);
    b.setProcessedRows(3);
    b.setSuccessCount(3);
    b.setFailureCount(0);
    b.getResults().add(row(2, "Hana T",   "hanat","hana@ex.com", true,  true,  null));
    b.getResults().add(row(3, "Ivo N",    "ivon", "ivo@ex.com",  true,  true,  null));
    b.getResults().add(row(4, "Quynh P",  "quynhp","quynh@ex.com",true, true,  null));
    repo.save(b);
  }

  private ImportRowResult row(int r, String fn, String un, String em, boolean imp, boolean sent, String err) {
    ImportRowResult x = new ImportRowResult();
    x.setRow(r);
    x.setFullName(fn);
    x.setUsername(un);
    x.setEmail(em);
    x.setImported(imp);
    x.setEmailSent(sent);
    x.setError(err);
    return x;
  }
}
