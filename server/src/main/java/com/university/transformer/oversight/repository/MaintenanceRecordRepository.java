package com.university.transformer.oversight.repository;

import com.university.transformer.oversight.model.MaintenanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface MaintenanceRecordRepository extends JpaRepository<MaintenanceRecord, Long> {
    Optional<MaintenanceRecord> findByInspectionId(Long inspectionId);
}