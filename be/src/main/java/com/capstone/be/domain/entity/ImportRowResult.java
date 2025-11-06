package com.capstone.be.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "import_job_results")
@Getter
@Setter
public class ImportRowResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "row_no", nullable = false)
    private int row;

    @Column(name = "full_name", length = 255)
    private String fullName;

    @Column(name = "username", length = 100)
    private String username;

    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "imported")
    private boolean imported;

    @Column(name = "email_sent")
    private boolean emailSent;

    @Column(name = "error", length = 500)
    private String error; // nullable

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", nullable = false)
    private ImportJob job;
}
