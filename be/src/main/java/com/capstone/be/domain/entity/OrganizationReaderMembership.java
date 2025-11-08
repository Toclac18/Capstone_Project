package com.capstone.be.domain.entity;

import com.capstone.be.domain.entity.common.BaseEntity;
import com.capstone.be.domain.enums.MembershipStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Bảng trung gian giữa Organization và Reader.
 * Một Reader có thể join nhiều Org và một Org có thể có nhiều Reader.
 */
@Entity
@Table(
        name = "organization_reader_memberships",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_org_reader", columnNames = {"organization_id", "reader_id"})
        },
        indexes = {
                @Index(name = "idx_membership_org", columnList = "organization_id"),
                @Index(name = "idx_membership_reader", columnList = "reader_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
public class OrganizationReaderMembership extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organization_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_membership_org"))
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Organization organization;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reader_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_membership_reader"))
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Reader reader;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private MembershipStatus status = MembershipStatus.ACTIVE;
    @Column(nullable = false)
    private OffsetDateTime joinedAt;
    @Column(length = 255)
    private String invitedBy;
    @Column(length = 2048)
    private String invitationToken;
    @Column(length = 1000)
    private String note;
    @Column(nullable = false)
    private Boolean active = true;
}
