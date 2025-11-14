//package com.capstone.be.config.seed;
//
//import com.capstone.be.domain.entity_old.Domain;
//import com.capstone.be.domain.entity_old.Specialization;
//import com.capstone.be.repository.DomainRepository;
//import com.capstone.be.repository.SpecializationRepository;
//import lombok.RequiredArgsConstructor;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.context.annotation.Profile;
//import org.springframework.context.event.EventListener;
//import org.springframework.stereotype.Component;
//import org.springframework.transaction.annotation.Transactional;
//
//@Profile("dev")
//@Component
//@RequiredArgsConstructor
//@Slf4j
//public class DomainAndSpecializationSeeder {
//
//  private final DomainRepository domainRepository;
//  private final SpecializationRepository specializationRepository;
//
//
//  @Transactional
//  @EventListener(org.springframework.boot.context.event.ApplicationReadyEvent.class)
//  public void run() {
//    if (domainRepository.existsByCode(10)) {
//      log.info("Domain&Spec Seeder: Data existed");
//      return;
//    }
//
//    Domain domain1 = new Domain();
//    domain1.setCode(10);
//    domain1.setName("Mathematics");
//
//    Specialization specialization1 = new Specialization();
//    specialization1.setCode(1001);
//    specialization1.setDomain(domain1);
//    specialization1.setName("Calculus");
//
//    Specialization specialization2 = new Specialization();
//    specialization2.setCode(1002);
//    specialization2.setDomain(domain1);
//    specialization2.setName("Discrete Math");
//
//    Specialization specialization3 = new Specialization();
//    specialization3.setCode(1003);
//    specialization3.setDomain(domain1);
//    specialization3.setName("Applied Math");
//
//    domainRepository.save(domain1);
//    specializationRepository.save(specialization1);
//    specializationRepository.save(specialization2);
//    specializationRepository.save(specialization3);
//
//  }
//}
