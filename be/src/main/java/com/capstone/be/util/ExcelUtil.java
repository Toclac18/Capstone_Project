package com.capstone.be.util;

import com.capstone.be.exception.InvalidRequestException;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.validator.routines.EmailValidator;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.web.multipart.MultipartFile;

/**
 * Utility class for parsing Excel files
 */
@Slf4j
public class ExcelUtil {
  private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
//  private static final Pattern EMAIL_PATTERN = Pattern.compile(
//      "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"
//  );

  /**
   * Validate Excel file
   *
   * @param file MultipartFile to validate
   * @throws InvalidRequestException if validation fails
   */
  public static void validateExcelFile(MultipartFile file) {
    if (file == null || file.isEmpty()) {
      throw new InvalidRequestException("Excel file is required");
    }

    // Check file extension
    String filename = file.getOriginalFilename();
    if (filename == null || !filename.toLowerCase().endsWith(".xlsx")) {
      throw new InvalidRequestException("Only .xlsx files are supported");
    }

    // Check file size
    if (file.getSize() > MAX_FILE_SIZE) {
      throw new InvalidRequestException("File size must not exceed 5MB");
    }
  }

  /**
   * Parse email list from Excel file
   * Expected format: First column contains email addresses, first row is header (skipped)
   *
   * @param file Excel file containing email list
   * @return List of valid email addresses
   */
  public static List<String> parseEmailListFromExcel(MultipartFile file) {
    List<String> emails = new ArrayList<>();

    try (InputStream inputStream = file.getInputStream();
        Workbook workbook = new XSSFWorkbook(inputStream)) {

      Sheet sheet = workbook.getSheetAt(0); // Get first sheet

      // Skip header row (row 0) and start from row 1
      for (int rowIndex = 1; rowIndex <= sheet.getLastRowNum(); rowIndex++) {
        Row row = sheet.getRow(rowIndex);
        if (row == null) {
          continue;
        }

        // Get first cell (column 0) which should contain email
        Cell cell = row.getCell(0);
        if (cell == null) {
          continue;
        }

        String email = getCellValueAsString(cell);
        if (email != null && !email.trim().isEmpty()) {
          email = email.trim().toLowerCase();

          // Validate email format
//          if (isValidEmail(email)) {
            emails.add(email);
//          } else {
//            log.warn("Invalid email format in row {}: {}", rowIndex + 1, email);
//          }
        }
      }

      log.info("Parsed {} valid emails from Excel file", emails.size());
      return emails;

    } catch (IOException e) {
      log.error("Error parsing Excel file", e);
      throw new InvalidRequestException("Failed to parse Excel file: " + e.getMessage());
    }
  }

  /**
   * Get cell value as string regardless of cell type
   */
  private static String getCellValueAsString(Cell cell) {
    if (cell == null) {
      return null;
    }

    CellType cellType = cell.getCellType();

    return switch (cellType) {
      case STRING -> cell.getStringCellValue();
      case NUMERIC -> String.valueOf((long) cell.getNumericCellValue());
      case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
      case FORMULA -> cell.getCellFormula();
      default -> null;
    };
  }

  /**
   * Validate email format
   */
  private static boolean isValidEmail(String email) {
//    return email != null && EMAIL_PATTERN.matcher(email).matches();
    return EmailValidator.getInstance().isValid(email);
  }
}
