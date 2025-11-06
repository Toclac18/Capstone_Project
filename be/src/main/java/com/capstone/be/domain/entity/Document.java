package com.capstone.be.domain.entity;

import com.capstone.be.domain.entity.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "documents")
@EqualsAndHashCode(callSuper = true)
@Data
public class Document extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Column()
    private String description;

    @ManyToOne
    @JoinColumn(name = "uploader_id")
    private Reader uploader;

    @ManyToOne
    @JoinColumn(name = "organization_id")
    private Organization organization;

    @ManyToOne
    @JoinColumn(name = "type_id")
    private DocumentType type;

    @ManyToMany(mappedBy = "documents")
    private Set<DocumentCategory> categories = new HashSet<>();

    private Boolean isPublic;

    private Boolean isPremium;

    private Integer price;

    private Integer viewCount;

    private String file_name;

    private Boolean deleted;
}
