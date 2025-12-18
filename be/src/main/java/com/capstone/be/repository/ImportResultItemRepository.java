package com.capstone.be.repository;

import com.capstone.be.domain.entity.ImportResultItem;
import com.capstone.be.domain.entity.MemberImportBatch;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ImportResultItemRepository extends JpaRepository<ImportResultItem, UUID> {

  Page<ImportResultItem> findByImportBatch(MemberImportBatch batch, Pageable pageable);

  Page<ImportResultItem> findByImportBatchOrderByStatusAsc(MemberImportBatch batch, Pageable pageable);

  List<ImportResultItem> findByImportBatchId(UUID batchId);

  List<ImportResultItem> findByImportBatchIdAndStatus(UUID batchId, String status);
}
