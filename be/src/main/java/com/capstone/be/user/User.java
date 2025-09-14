package com.capstone.be.user;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Entity
@Table(name = "users", uniqueConstraints = @UniqueConstraint(columnNames = "email"))
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false) private String email;
    @Column(nullable = false) private String password;

    @Enumerated(EnumType.STRING) @Column(nullable = false)
    private Provider provider;

    @Column(nullable = false) private boolean enabled;
    @Column(nullable = false) private Instant createdAt;

    public enum Provider { LOCAL, GOOGLE }
}