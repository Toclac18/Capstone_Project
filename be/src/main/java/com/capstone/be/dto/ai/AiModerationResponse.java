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

  private String status; // "pass" or "reject"

  private List<String> violations;

  private Summaries summaries;

  private Timings timings;

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
