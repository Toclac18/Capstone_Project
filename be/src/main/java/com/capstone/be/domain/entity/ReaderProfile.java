package com.capstone.be.domain.entity;

import com.capstone.be.domain.entity.common.BaseEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Entity
public class ReaderProfile extends BaseEntity {

  @OneToOne
  @JoinColumn(name = "user_id", nullable = false, unique = true)
  private User user;

  private LocalDate dob;

  //favourite Domain/Spec .., ViewHistory, ..
  //saved List..

}
