//package com.capstone.be.domain.entity;
//
//import com.capstone.be.domain.entity.common.BaseEntity;
//import com.capstone.be.domain.enums.DocStatus;
//import jakarta.persistence.Column;
//import jakarta.persistence.Entity;
//import jakarta.persistence.EnumType;
//import jakarta.persistence.Enumerated;
//import jakarta.persistence.FetchType;
//import jakarta.persistence.JoinColumn;
//import jakarta.persistence.ManyToOne;
//import jakarta.persistence.Table;
//import lombok.AllArgsConstructor;
//import lombok.Builder;
//import lombok.Getter;
//import lombok.NoArgsConstructor;
//import lombok.Setter;
//import lombok.experimental.SuperBuilder;
//
///**
// * Entity to track document review assignments
// * Records when a reviewer is assigned to review a document
// */
//@Entity
//@Table(name = "review_assignments")
//@Getter
//@Setter
//@NoArgsConstructor
//@AllArgsConstructor
//@SuperBuilder
//public class ReviewAssignment extends BaseEntity {
//
//  @ManyToOne(fetch = FetchType.LAZY, optional = false)
//  @JoinColumn(name = "document_id", nullable = false)
//  private Document document;
//
//  @ManyToOne(fetch = FetchType.LAZY, optional = false)
//  @JoinColumn(name = "reviewer_id", nullable = false)
//  private User reviewer;
//
//  @Enumerated(EnumType.STRING)
//  @Column(nullable = false, length = 20)
//  @Builder.Default
//  private DocStatus reviewStatus = DocStatus.VERIFYING;
//
//  @Column(columnDefinition = "TEXT")
//  private String reviewNotes;
//
//  @Column(columnDefinition = "TEXT")
//  private String reviewReportUrl; // URL to review report file in S3
//}
//
