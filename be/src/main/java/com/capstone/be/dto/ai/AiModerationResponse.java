package com.capstone.be.dto.ai;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO from AI moderation and summarization service
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiModerationResponse {

  private String status; // "pass" or "fail"

  private List<Violation> violations;

  private Summaries summaries;

  private Timings timings;

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class Violation {

    private String type; // "text" or "image"

    private Integer index; // Index in batch

    private String snippet; // For text violations, the offending text

    private String prediction; // e.g., "toxic"

    private Double confidence; // Confidence score (0.0 to 1.0)

    private Integer page; // Page number where violation was found
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class Summaries {

    @JsonProperty("short")
    private SummaryDetail shortSummary;

    @JsonProperty("medium")
    private SummaryDetail mediumSummary;

    @JsonProperty("detailed")
    private SummaryDetail detailedSummary;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class SummaryDetail {

    private String text;

    @JsonProperty("output_tokens")
    private Integer outputTokens;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class Timings {

    @JsonProperty("ocr_ms")
    private Double ocrMs;

    @JsonProperty("image_moderation_ms")
    private Double imageModerationMs;

    @JsonProperty("text_moderation_ms")
    private Double textModerationMs;

    @JsonProperty("summary_ms")
    private Double summaryMs;

    @JsonProperty("total_ms")
    private Double totalMs;
  }
}
