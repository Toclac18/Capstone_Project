package com.capstone.be.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentSummarization {

    @Column(name = "summary_short", columnDefinition = "TEXT")
    private String shortSummary;

    @Column(name = "summary_medium", columnDefinition = "TEXT")
    private String mediumSummary;

    @Column(name = "summary_detailed", columnDefinition = "TEXT")
    private String detailedSummary;
}