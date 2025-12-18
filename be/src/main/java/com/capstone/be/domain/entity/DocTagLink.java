//package com.capstone.be.domain.entity;
//
//import com.capstone.be.domain.entity.common.BaseEntity;
//import jakarta.persistence.Entity;
//import jakarta.persistence.FetchType;
//import jakarta.persistence.JoinColumn;
//import jakarta.persistence.ManyToOne;
//import lombok.AllArgsConstructor;
//import lombok.Getter;
//import lombok.NoArgsConstructor;
//import lombok.Setter;
//import lombok.experimental.SuperBuilder;
//
//@Getter
//@Setter
//@NoArgsConstructor
//@AllArgsConstructor
//@SuperBuilder
//@Entity
//public class DocTagLink extends BaseEntity {
//
//  @ManyToOne(fetch = FetchType.LAZY)
//  @JoinColumn(name = "document_id")
//  private Document document;
//
//  @ManyToOne(fetch = FetchType.LAZY)
//  @JoinColumn(name = "tag_id")
//  private Tag tag;
//
//
//}
