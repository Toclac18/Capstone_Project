package com.capstone.be.controller;

import com.capstone.be.dto.response.importReader.ImportDetailResponse;
import com.capstone.be.dto.response.importReader.ImportListResponse;
import com.capstone.be.service.ImportService;
import com.capstone.be.service.impl.ProgressBroadcaster;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/org-admin/imports")
public class ImportController {
    private final ImportService service;
    private final ProgressBroadcaster broadcaster;

    public ImportController(ImportService service, ProgressBroadcaster broadcaster) {
        this.service = service;
        this.broadcaster = broadcaster;
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ORGANIZATION')")
    public ImportListResponse list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "ALL") String status) {
        return service.list(page, pageSize, q, status);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ORGANIZATION')")
    public ImportDetailResponse detail(@PathVariable String id) {
        return service.detail(id);
    }

    @GetMapping("/{id}/result")
    @PreAuthorize("hasAnyAuthority('ORGANIZATION')")
    public ResponseEntity<byte[]> resultCsv(@PathVariable String id) {
        String csv = service.csvResult(id);
        return ResponseEntity.ok()
                .header(
                        HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=import_" + id + "_result.csv")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csv.getBytes());
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyAuthority('ORGANIZATION')")
    public ImportDetailResponse create(
            @RequestPart("file") MultipartFile file) {
        return service.create(file);
    }

    @GetMapping("/template")
    @PreAuthorize("hasAnyAuthority('ORGANIZATION')")
    public ResponseEntity<byte[]> downloadTemplate() {
        byte[] data = service.templateExcel();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=import_template.xlsx")
                .contentType(
                        MediaType.parseMediaType(
                                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(data);
    }

    @GetMapping("/{id}/events")
    public SseEmitter events(@PathVariable String id) {
        return broadcaster.subscribe(id);
    }
}